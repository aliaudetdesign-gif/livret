"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  updateNotificationPreferences,
  type ProfileActionState,
} from "@/app/profil/actions";

const initialState: ProfileActionState = { error: null };

export function NotificationPreferencesForm({
  notifyNewMessage,
  notifyNewDocument,
}: {
  notifyNewMessage: boolean;
  notifyNewDocument: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateNotificationPreferences, initialState);
  const wasPending = useRef(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      setSaved(true);
      const timeout = setTimeout(() => setSaved(false), 3000);
      return () => clearTimeout(timeout);
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="notify_new_message"
          defaultChecked={notifyNewMessage}
          className="w-4 h-4 accent-[var(--color-terracotta)]"
        />
        M&apos;avertir par email des nouveaux messages
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="notify_new_document"
          defaultChecked={notifyNewDocument}
          className="w-4 h-4 accent-[var(--color-terracotta)]"
        />
        M&apos;avertir par email des nouveaux documents
      </label>

      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{state.error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="self-start bg-gradient-terracotta text-white text-sm font-medium rounded-md px-5 py-2 hover-lift disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? "Enregistrement..." : "Enregistrer"}
        </button>
        {saved && <span className="text-sm text-emerald-600">Enregistré.</span>}
      </div>
    </form>
  );
}
