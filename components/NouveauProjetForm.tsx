"use client";

import { useActionState, useState } from "react";
import { createProject, type ActionState } from "@/app/agence/projets/nouveau/actions";

const initialState: ActionState = { error: null };

const inputClass =
  "w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-md focus:outline-none focus:border-[var(--color-terracotta)] transition-colors";
const labelClass = "block text-xs font-medium text-zinc-500 mb-1.5";

export function NouveauProjetForm({
  clients,
}: {
  clients: { id: string; full_name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createProject, initialState);
  const [clientMode, setClientMode] = useState<"nouveau" | "existant">("nouveau");

  return (
    <form
      action={formAction}
      className="bg-white rounded-lg border border-zinc-100 p-6 max-w-xl flex flex-col gap-4"
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
          <div className="flex gap-1 mb-2 bg-zinc-100 rounded-md p-1 w-fit">
            <button
              type="button"
              onClick={() => setClientMode("nouveau")}
              className={`text-xs font-medium px-3 py-1.5 rounded transition-colors ${
                clientMode === "nouveau" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500"
              }`}
            >
              Nouveau client
            </button>
            <button
              type="button"
              onClick={() => setClientMode("existant")}
              className={`text-xs font-medium px-3 py-1.5 rounded transition-colors ${
                clientMode === "existant" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500"
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
            <p className="text-xs text-zinc-400 leading-snug">
              Le compte sera créé après la création du projet.
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
      <p className="text-xs text-zinc-400 -mt-2">
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
        <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start bg-gradient-terracotta text-white text-sm font-medium rounded-md px-4 py-2 hover-lift disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? "Création..." : "Créer le projet"}
      </button>
    </form>
  );
}
