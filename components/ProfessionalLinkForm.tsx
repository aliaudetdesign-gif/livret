"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateProfessionalLink, type ProfileActionState } from "@/app/profil/actions";

const initialState: ProfileActionState = { error: null };

const inputClass =
  "w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-md focus:outline-none focus:border-[var(--color-terracotta)] transition-colors";
const labelClass = "block text-xs font-medium text-zinc-500 mb-1.5";

export function ProfessionalLinkForm({ professionalLink }: { professionalLink: string }) {
  const [state, formAction, pending] = useActionState(updateProfessionalLink, initialState);
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
      <div>
        <label htmlFor="professional_link" className={labelClass}>
          Lien pro (LinkedIn, site, portfolio)
        </label>
        <input
          id="professional_link"
          name="professional_link"
          type="url"
          defaultValue={professionalLink}
          className={inputClass}
          placeholder="https://..."
        />
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
          {pending ? "Enregistrement..." : "Enregistrer"}
        </button>
        {saved && <span className="text-sm text-emerald-600">Enregistré.</span>}
      </div>
    </form>
  );
}
