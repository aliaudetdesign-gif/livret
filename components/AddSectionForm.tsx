"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
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

  const templateTypes = availableSectionTypes.filter((t) => t.template);

  const [view, setView] = useState<"templates" | "new">(
    templateTypes.length > 0 ? "templates" : "new"
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

  // Templates (Vidéos, Interfaces Figma, Mockups...) : un clic ajoute
  // directement la section, sans passer par la soumission classique du
  // formulaire (pas de champ à remplir, le choix est l'action).
  function chooseTemplate(sectionTypeId: string) {
    const data = new FormData();
    data.set("project_id", projectId);
    data.set("mode", "existing");
    data.set("section_type_id", sectionTypeId);
    startTransition(() => {
      formAction(data);
    });
  }

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
      <input type="hidden" name="mode" value={view === "new" ? "new" : "existing"} />

      <p className="text-sm font-medium">Ajouter une section</p>

      <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/55 border border-white/60 w-fit">
        {templateTypes.length > 0 && (
          <button
            type="button"
            onClick={() => setView("templates")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              view === "templates"
                ? "bg-clay-100 text-clay-700"
                : "text-ink-500 hover:text-ink-900"
            }`}
          >
            Voir les templates
          </button>
        )}
        <button
          type="button"
          onClick={() => setView("new")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            view === "new" ? "bg-clay-100 text-clay-700" : "text-ink-500 hover:text-ink-900"
          }`}
        >
          Nouvelle section
        </button>
      </div>

      {view === "templates" ? (
        templateTypes.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {templateTypes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => chooseTemplate(t.id)}
                disabled={pending}
                className="flex flex-col items-center gap-2 rounded-field bg-white/55 hover:bg-white/85 border border-white/60 hover:border-clay-500 p-4 text-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-2xl leading-none">{t.icon}</span>
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-400">Tous les templates sont déjà utilisés sur ce projet.</p>
        )
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
        {view !== "templates" && (
          <button
            type="submit"
            disabled={pending}
            className="btn-clay text-sm font-semibold px-4 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {pending ? "Ajout..." : "Ajouter"}
          </button>
        )}
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
