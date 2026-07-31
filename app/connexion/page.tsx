"use client";

import { useActionState } from "react";
import { login, type LoginActionState } from "./actions";

const initialState: LoginActionState = { error: null };

export default function ConnexionPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="flex flex-1 items-center justify-center bg-[var(--color-noir-doux)] px-4">
      <div className="w-full max-w-sm bg-white rounded-xl p-8">
        <div className="mb-6">
          <span className="text-xl font-semibold text-[var(--color-noir-doux)]">
            livret<span className="text-gradient-terracotta">.</span>
          </span>
          <p className="text-sm text-zinc-500 mt-1">
            Connecte-toi à ton espace agence ou client.
          </p>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700" htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)]"
            />
          </div>

          {state.error && <p className="text-sm text-red-600">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 bg-[var(--color-noir-doux)] text-white rounded-md py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
