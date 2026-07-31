"use client";

import { useActionState, useEffect, useRef } from "react";
import { addProjectDocument, type DocumentActionState } from "@/app/agence/projets/[id]/actions";
import type { DocumentCategory } from "@/lib/types";

const initialState: DocumentActionState = { error: null };

const inputClass =
  "w-full px-3 py-2 text-sm bg-white/70 border border-white/60 rounded-field focus:outline-none focus:border-clay-500 focus:bg-white/90 transition-colors";
const labelClass = "block text-xs font-medium text-ink-500 mb-1.5";

const categoryLabels: Record<DocumentCategory, string> = {
  devis: "Devis",
  facture: "Facture",
  brief: "Brief",
};

export function DocumentUploadForm({
  projectId,
  onSuccess,
}: {
  projectId: string;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(addProjectDocument, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
      onSuccess?.();
    }
    wasPending.current = pending;
  }, [pending, state, onSuccess]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="glass rounded-card p-4 max-w-md flex flex-col gap-3 mb-6"
    >
      <p className="text-sm font-medium">Ajouter un document</p>

      <input type="hidden" name="project_id" value={projectId} />

      <div>
        <label htmlFor="document-label" className={labelClass}>
          Nom *
        </label>
        <input
          id="document-label"
          name="label"
          required
          className={inputClass}
          placeholder="ex: Devis n°2026-014"
        />
      </div>

      <div>
        <label htmlFor="document-category" className={labelClass}>
          Catégorie *
        </label>
        <select id="document-category" name="category" required className={inputClass}>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="document-file" className={labelClass}>
          Fichier PDF *
        </label>
        <input
          id="document-file"
          name="file"
          type="file"
          accept="application/pdf"
          required
          className={`${inputClass} file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-white/65 file:text-ink-700`}
        />
      </div>

      {state.error && (
        <p className="text-sm text-err-600 bg-err-100 rounded-md px-3 py-2">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start bg-gradient-terracotta text-white text-sm font-medium rounded-md px-4 py-2 hover-lift disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? "Ajout..." : "Ajouter"}
      </button>
    </form>
  );
}
