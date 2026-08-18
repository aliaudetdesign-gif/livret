"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Calendar, Send } from "lucide-react";
import {
  sendMessage,
  proposeRendezVous,
  type SendMessageState,
  type ProposeRendezVousState,
} from "@/app/agence/messagerie/actions";

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
      <div className="flex items-end gap-2 p-4">
        {/* En dehors du <form> ci-dessous : un <form> ne peut pas en contenir un
            autre (le popover rendez-vous a le sien), sinon React/le navigateur
            réorganise le DOM au montage et déclenche une erreur d'hydratation. */}
        <RendezVousButton projectId={projectId} />
        <form ref={formRef} action={formAction} className="flex-1 flex items-end gap-2">
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
    </div>
  );
}

const initialRdvState: ProposeRendezVousState = { error: null };

// Bouton calendrier à côté du champ de saisie : ouvre un popover pour
// proposer un rendez-vous (date, heure, lieu optionnel), envoyé comme un
// message à part entière (type "rendezvous"), affiché ensuite via
// RendezVousCard dans le fil de discussion.
function RendezVousButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(proposeRendezVous, initialRdvState);
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
      setOpen(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  useEffect(() => {
    if (!open) return;

    function handlePointer(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Proposer un rendez-vous"
        className={`w-9 h-9 rounded-field border flex items-center justify-center transition-colors ${
          open
            ? "bg-clay-100 border-clay-400 text-clay-600"
            : "bg-white/70 border-white/60 text-ink-500 hover:text-clay-600"
        }`}
      >
        <Calendar className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute bottom-11 left-0 w-64 glass rounded-card p-3 flex flex-col gap-2 z-10">
          <p className="text-xs font-medium text-ink-700">Proposer un rendez-vous</p>
          <form ref={formRef} action={formAction} className="flex flex-col gap-2">
            <input type="hidden" name="project_id" value={projectId} />
            {state.error && <p className="text-xs text-err-600">{state.error}</p>}
            <div className="flex gap-2">
              <input
                type="date"
                name="date"
                required
                className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-white/70 border border-white/60 rounded-field focus:outline-none focus:border-clay-500 focus:bg-white/90"
              />
              <input
                type="time"
                name="heure"
                required
                className="w-24 shrink-0 px-2.5 py-1.5 text-xs bg-white/70 border border-white/60 rounded-field focus:outline-none focus:border-clay-500 focus:bg-white/90"
              />
            </div>
            <input
              type="text"
              name="lieu"
              placeholder="Lieu (optionnel)"
              className="px-2.5 py-1.5 text-xs bg-white/70 border border-white/60 rounded-field focus:outline-none focus:border-clay-500 focus:bg-white/90"
            />
            <button
              type="submit"
              disabled={pending}
              className="px-3 py-1.5 text-xs font-medium rounded-field bg-gradient-terracotta text-white hover-lift disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Envoyer la proposition
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
