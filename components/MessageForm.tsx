"use client";

import { useActionState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { sendMessage, type SendMessageState } from "@/app/agence/messagerie/actions";

const initialState: SendMessageState = { error: null };

export function MessageForm({ projectId }: { projectId: string }) {
  const [state, formAction, pending] = useActionState(sendMessage, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  // Sans redirect côté serveur (voir sendMessage), le formulaire ne se vide
  // plus automatiquement : on le réinitialise nous-même une fois l'envoi
  // terminé sans erreur.
  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <div className="border-t border-white/55">
      {state.error && <p className="text-xs text-err-600 bg-err-100 px-4 py-2">{state.error}</p>}
      <form ref={formRef} action={formAction} className="flex items-end gap-2 p-4">
        <input type="hidden" name="project_id" value={projectId} />
        <textarea
          name="content"
          rows={1}
          required
          placeholder="Écris un message..."
          className="flex-1 resize-none px-3 py-2 text-sm bg-white/70 border border-white/60 rounded-field focus:outline-none focus:border-clay-500 focus:bg-white/90 transition-colors"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 w-9 h-9 rounded-field bg-gradient-terracotta text-white flex items-center justify-center hover-lift disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
