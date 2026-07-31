"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createProjectSection, type SectionActionState } from "@/app/agence/projets/[id]/actions";
import type { SectionType } from "@/lib/types";

const initialState: SectionActionState = { error: null };

const inputClass =
  "w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-md focus:outline-none focus:border-[var(--color-terracotta)] transition-colors";

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
        className="flex items-center gap-3 bg-white border border-dashed border-zinc-200 rounded-lg p-4 text-left text-sm text-zinc-500 hover:border-[var(--color-terracotta)] hover:text-[var(--color-terracotta)] transition-colors"
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
      className="col-span-2 bg-white border border-zinc-100 rounded-lg p-4 flex flex-col gap-3"
    >
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="mode" value={mode} />

      <p className="text-sm font-medium">Ajouter une section</p>

      {availableSectionTypes.length > 0 && (
        <div className="flex gap-4 text-xs">
          <button
            type="button"
            onClick={() => setMode("existing")}
            className={mode === "existing" ? "font-medium" : "text-zinc-400"}
          >
            Depuis la bibliothèque
          </button>
          <button
            type="button"
            onClick={() => setMode("new")}
            className={mode === "new" ? "font-medium" : "text-zinc-400"}
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
        <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{state.error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-gradient-terracotta text-white text-sm font-medium rounded-md px-4 py-2 hover-lift disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? "Ajout..." : "Ajouter"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-zinc-500 px-4 py-2"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
