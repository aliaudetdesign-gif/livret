"use client";

import { useActionState } from "react";
import { setPasswordAfterInvite, type SetPasswordActionState } from "./actions";

const initialState: SetPasswordActionState = { error: null };

export function DefinirMotDePasseForm() {
  const [state, formAction, pending] = useActionState(setPasswordAfterInvite, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-medium text-ink-700" htmlFor="password">
          Nouveau mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="bg-white/70 border border-white/60 rounded-field px-3 py-2 text-sm focus:outline-none focus:border-clay-500 focus:bg-white/90 transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-medium text-ink-700" htmlFor="password_confirm">
          Confirme le mot de passe
        </label>
        <input
          id="password_confirm"
          name="password_confirm"
          type="password"
          required
          minLength={8}
          className="bg-white/70 border border-white/60 rounded-field px-3 py-2 text-sm focus:outline-none focus:border-clay-500 focus:bg-white/90 transition-colors"
        />
      </div>

      {state.error && <p className="text-[13px] text-err-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="btn-clay mt-2 py-2.5 text-sm font-semibold disabled:opacity-60"
      >
        {pending ? "Enregistrement..." : "Définir le mot de passe"}
      </button>
    </form>
  );
}
