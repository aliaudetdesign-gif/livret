"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateAgencyProfile, type AgencyProfileActionState } from "@/app/agence/parametres/actions";

const initialState: AgencyProfileActionState = { error: null };

const inputClass =
  "w-full px-3 py-2 text-sm bg-white/70 border border-white/60 rounded-field focus:outline-none focus:border-clay-500 focus:bg-white/90 transition-colors";
const labelClass = "block text-xs font-medium text-ink-500 mb-1.5";

export function AgencyProfileForm({ fullName, email }: { fullName: string; email: string }) {
  const [state, formAction, pending] = useActionState(updateAgencyProfile, initialState);
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="full_name" className={labelClass}>
            Nom de l&apos;agence
          </label>
          <input id="full_name" name="full_name" defaultValue={fullName} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input
            value={email}
            disabled
            className={`${inputClass} bg-white/55 text-ink-400 cursor-not-allowed`}
          />
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-err-600 bg-err-100 rounded-md px-3 py-2">{state.error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="self-start bg-gradient-terracotta text-white text-sm font-medium rounded-md px-5 py-2 hover-lift disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? "Enregistrement..." : "Enregistrer"}
        </button>
        {saved && <span className="text-sm text-ok-600">Enregistré.</span>}
      </div>
    </form>
  );
}
