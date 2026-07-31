"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { changePassword, type ProfileActionState } from "@/app/profil/actions";

const initialState: ProfileActionState = { error: null };

const inputClass =
  "w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-md focus:outline-none focus:border-[var(--color-terracotta)] transition-colors";
const labelClass = "block text-xs font-medium text-zinc-500 mb-1.5";

export function PasswordSecurityForm() {
  const [state, formAction, pending] = useActionState(changePassword, initialState);
  const wasPending = useRef(false);
  const [saved, setSaved] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      setSaved(true);
      formRef.current?.reset();
      const timeout = setTimeout(() => setSaved(false), 3000);
      return () => clearTimeout(timeout);
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="password" className={labelClass}>
            Nouveau mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
            placeholder="8 caractères minimum"
          />
        </div>
        <div>
          <label htmlFor="password_confirmation" className={labelClass}>
            Confirmation
          </label>
          <input
            id="password_confirmation"
            name="password_confirmation"
            type="password"
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{state.error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="self-start bg-gradient-terracotta text-white text-sm font-medium rounded-md px-5 py-2 hover-lift disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? "Enregistrement..." : "Changer le mot de passe"}
        </button>
        {saved && <span className="text-sm text-emerald-600">Mot de passe mis à jour.</span>}
      </div>
    </form>
  );
}
