"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createProject, type ActionState } from "@/app/agence/projets/nouveau/actions";
import { InviteLinkPanel } from "@/components/InviteLinkPanel";

const initialState: ActionState = { error: null };

const inputClass =
  "w-full px-3 py-2 text-sm bg-white/70 border border-white/60 rounded-field focus:outline-none focus:border-clay-500 focus:bg-white/90 transition-colors";
const labelClass = "block text-xs font-medium text-ink-500 mb-1.5";

export function NouveauProjetForm({
  clients,
}: {
  clients: { id: string; full_name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createProject, initialState);
  const [clientMode, setClientMode] = useState<"nouveau" | "existant">("nouveau");

  if (state.inviteLink) {
    return (
      <div className="glass rounded-card p-6 max-w-xl flex flex-col gap-4">
        <p className="text-sm font-medium text-ink-900">Projet créé.</p>
        <InviteLinkPanel inviteLink={state.inviteLink} />
        <Link
          href="/agence/projets"
          className="self-start btn-clay text-sm font-semibold px-4 py-2.5"
        >
          Voir les projets
        </Link>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="glass rounded-card p-6 max-w-xl flex flex-col gap-4"
    >
      <div>
        <label htmlFor="name" className={labelClass}>
          Nom du projet *
        </label>
        <input id="name" name="name" required className={inputClass} placeholder="ex: Maison Léa" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="sector" className={labelClass}>
            Secteur
          </label>
          <input
            id="sector"
            name="sector"
            className={inputClass}
            placeholder="ex: Décoration & Lifestyle"
          />
        </div>
        <div>
          <label htmlFor="city" className={labelClass}>
            Ville
          </label>
          <input id="city" name="city" className={inputClass} placeholder="ex: Paris" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="status" className={labelClass}>
            Statut
          </label>
          <select id="status" name="status" defaultValue="en_cours" className={inputClass}>
            <option value="en_cours">En cours</option>
            <option value="attente_validation">Attente de validation</option>
            <option value="livre">Livré</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Client</label>
          <div className="flex gap-1 mb-2 bg-white/65 rounded-field p-1 w-fit">
            <button
              type="button"
              onClick={() => setClientMode("nouveau")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-chip transition-colors ${
                clientMode === "nouveau" ? "bg-white/95 shadow-[0_2px_6px_-2px_rgba(52,36,26,0.2)] text-ink-900" : "text-ink-500"
              }`}
            >
              Nouveau client
            </button>
            <button
              type="button"
              onClick={() => setClientMode("existant")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-chip transition-colors ${
                clientMode === "existant" ? "bg-white/95 shadow-[0_2px_6px_-2px_rgba(52,36,26,0.2)] text-ink-900" : "text-ink-500"
              }`}
            >
              Client existant
            </button>
          </div>
          {clientMode === "existant" ? (
            <select id="client_profile_id" name="client_profile_id" defaultValue="" className={inputClass}>
              <option value="">Sélectionne un client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.full_name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-ink-400 leading-snug">
              Le compte sera créé en même temps que le projet.
            </p>
          )}
        </div>
      </div>

      {clientMode === "nouveau" ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="client_full_name" className={labelClass}>
              Nom du client
            </label>
            <input
              id="client_full_name"
              name="client_full_name"
              className={inputClass}
              placeholder="ex: Léa Martin"
            />
          </div>
          <div>
            <label htmlFor="client_email" className={labelClass}>
              Email du client
            </label>
            <input
              id="client_email"
              name="client_email"
              type="email"
              className={inputClass}
              placeholder="ex: lea@martin.fr"
            />
          </div>
        </div>
      ) : (
        <div>
          <label htmlFor="client_email" className={labelClass}>
            Email du client
          </label>
          <input
            id="client_email"
            name="client_email"
            type="email"
            className={inputClass}
            placeholder="ex: lea@martin.fr"
          />
        </div>
      )}
      <p className="text-xs text-ink-400 -mt-2">
        Optionnel : possible d&apos;ajouter les coordonnées des clients via &quot;Gérer le projet&quot;.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="start_date" className={labelClass}>
            Date de début
          </label>
          <input id="start_date" name="start_date" type="date" className={inputClass} />
        </div>
        <div>
          <label htmlFor="end_date" className={labelClass}>
            Date de fin
          </label>
          <input id="end_date" name="end_date" type="date" className={inputClass} />
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-err-600 bg-err-100 border border-err-600/15 rounded-field px-3.5 py-2.5">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start btn-clay text-sm font-semibold px-4 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? "Création..." : "Créer le projet"}
      </button>
    </form>
  );
}
