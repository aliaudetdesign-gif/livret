"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  updateProjectSettings,
  type ProjectSettingsActionState,
} from "@/app/agence/projets/[id]/actions";
import type { Project } from "@/lib/types";

const inputClass =
  "w-full px-3 py-2 text-sm bg-white/70 border border-white/60 rounded-field focus:outline-none focus:border-clay-500 focus:bg-white/90 transition-colors";
const labelClass = "block text-xs font-medium text-ink-500 mb-1.5";

const initialState: ProjectSettingsActionState = { error: null };

// Formulaire d'édition des paramètres généraux d'un projet, modifiables
// uniquement après création (le formulaire de création ne couvre que la
// première saisie).
export function ProjectSettingsForm({ project }: { project: Project }) {
  const [state, formAction, pending] = useActionState(updateProjectSettings, initialState);
  const [saved, setSaved] = useState(false);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      setSaved(true);
      const timeout = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(timeout);
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-xl">
      <input type="hidden" name="project_id" value={project.id} />

      <div>
        <label htmlFor="name" className={labelClass}>
          Nom du projet *
        </label>
        <input id="name" name="name" defaultValue={project.name} required className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="sector" className={labelClass}>
            Secteur
          </label>
          <input id="sector" name="sector" defaultValue={project.sector ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="city" className={labelClass}>
            Ville
          </label>
          <input id="city" name="city" defaultValue={project.city ?? ""} className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Description (bloc identité de marque)
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={project.description ?? ""}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="status" className={labelClass}>
          Statut
        </label>
        <select id="status" name="status" defaultValue={project.status} className={inputClass}>
          <option value="en_cours">En cours</option>
          <option value="attente_validation">Attente de validation</option>
          <option value="livre">Livré</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="start_date" className={labelClass}>
            Date de début
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            defaultValue={project.start_date ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="end_date" className={labelClass}>
            Date de fin
          </label>
          <input
            id="end_date"
            name="end_date"
            type="date"
            defaultValue={project.end_date ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="archived"
          defaultChecked={project.archived}
          className="w-4 h-4 accent-clay-500"
        />
        Projet archivé
      </label>

      {state.error && (
        <p className="text-sm text-err-600 bg-err-100 border border-err-600/15 rounded-field px-3.5 py-2.5">{state.error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="self-start btn-clay text-sm font-semibold px-4 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? "Enregistrement..." : "Enregistrer"}
        </button>
        {saved && <span className="text-sm text-ok-600">Enregistré.</span>}
      </div>
    </form>
  );
}
