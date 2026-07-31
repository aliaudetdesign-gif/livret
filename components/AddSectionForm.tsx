"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createProjectSection, type SectionActionState } from "@/app/agence/projets/[id]/actions";
import type { SectionType } from "@/lib/types";

const initialState: SectionActionState = { error: null };

const inputClass =
  "w-full px-3 py-2 text-sm bg-white/70 border border-white/60 rounded-field focus:outline-none focus:border-clay-500 focus:bg-white/90 transition-colors";

export function AddSectionForm({
  projectId,
  availableSectionTypes,
}: {
  projectId: string;
  availableSectionTypes: SectionType[];
}) {
  const [state, formAction, pending] = useActionState(createProjectSection, initialState);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"existing" | "new">(
    availableSectionTypes.length > 0 ? "existing" : "new"
  );
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      setOpen(false);
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 glass-soft border-dashed rounded-card p-4 text-left text-sm text-ink-500 hover:border-clay-500 hover:text-clay-600 transition-colors"
      >
        <span className="text-xl leading-none">+</span>
        Ajouter une section
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="col-span-2 glass rounded-card p-4 flex flex-col gap-3"
    >
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="mode" value={mode} />

      <p className="text-sm font-medium">Ajouter une section</p>

      {availableSectionTypes.length > 0 && (
        <div className="flex gap-4 text-xs">
          <button
            type="button"
            onClick={() => setMode("existing")}
            className={mode === "existing" ? "font-medium" : "text-ink-400"}
          >
            Depuis la bibliothèque
          </button>
          <button
            type="button"
            onClick={() => setMode("new")}
            className={mode === "new" ? "font-medium" : "text-ink-400"}
          >
            Nouvelle section
          </button>
        </div>
      )}

      {mode === "existing" ? (
        <select name="section_type_id" required className={inputClass}>
          {availableSectionTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.icon} {t.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="flex gap-3">
          <input
            name="icon"
            placeholder="🎇"
            maxLength={4}
            className={`${inputClass} w-16 text-center`}
          />
          <input name="label" placeholder="ex: Illustrations" required className={inputClass} />
        </div>
      )}

      {state.error && (
        <p className="text-sm text-err-600 bg-err-100 border border-err-600/15 rounded-field px-3.5 py-2.5">{state.error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="btn-clay text-sm font-semibold px-4 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? "Ajout..." : "Ajouter"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-ink-500 px-4 py-2"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
