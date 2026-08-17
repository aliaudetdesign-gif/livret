"use client";

import { useActionState } from "react";
import { login, loginAsDemo, type LoginActionState } from "./actions";

const initialState: LoginActionState = { error: null };

export default function ConnexionPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    // Plus de fond sombre plein écran : on laisse voir la nappe de couleur du
    // layout et on pose une seule dalle de verre au centre.
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="glass w-full max-w-sm rounded-panel p-9">
        <div className="mb-7">
          <span className="text-[23px] font-semibold tracking-[-0.02em] text-ink-900">
            livret<span className="text-gradient-terracotta">.</span>
          </span>
          <p className="text-[13.5px] text-ink-500 mt-1.5">
            Connecte-toi à ton espace agence ou client.
          </p>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-ink-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="bg-white/70 border border-white/60 rounded-field px-3 py-2 text-sm focus:outline-none focus:border-clay-500 focus:bg-white/90 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-ink-700" htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="bg-white/70 border border-white/60 rounded-field px-3 py-2 text-sm focus:outline-none focus:border-clay-500 focus:bg-white/90 transition-colors"
            />
          </div>

          {state.error && <p className="text-[13px] text-err-600">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="btn-clay mt-2 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {pending ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <form action={loginAsDemo}>
          <button
            type="submit"
            className="w-full mt-2.5 py-2.5 text-sm font-medium text-ink-700 rounded-field border border-white/60 bg-white/40 hover:bg-white/70 transition-colors"
          >
            Voir la démo
          </button>
        </form>
      </div>
    </div>
  );
}
