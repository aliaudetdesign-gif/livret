"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { addSectionAsset, type SectionAssetActionState } from "@/app/agence/projets/[id]/actions";
import { ExtraFormatFields } from "@/components/ExtraFormatFields";
import { generatePdfPreview } from "@/lib/pdfPreview";

const initialState: SectionAssetActionState = { error: null };

const inputClass =
  "w-full px-3 py-2 text-sm bg-white/70 border border-white/60 rounded-field focus:outline-none focus:border-clay-500 focus:bg-white/90 transition-colors";
const labelClass = "block text-xs font-medium text-ink-500 mb-1.5";

export function SectionAssetUploadForm({
  projectId,
  projectSectionId,
  onSuccess,
}: {
  projectId: string;
  projectSectionId: string;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(addSectionAsset, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);
  // Choix du designer à chaque ajout, indépendant du type de section : un
  // fichier simple (comportement historique) ou plusieurs formats
  // (PDF/PNG/SVG + formats supplémentaires, même principe qu'un logo).
  const [mode, setMode] = useState<"single" | "multi">("single");

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
      setMode("single");
      onSuccess?.();
    }
    wasPending.current = pending;
  }, [pending, state, onSuccess]);

  // Fichier déposé en PDF : on intercepte la soumission pour générer un
  // aperçu côté navigateur avant d'envoyer le formulaire (même logique que
  // pour les logos, voir lib/pdfPreview.ts), afin que la carte puisse
  // afficher une vraie miniature plutôt qu'une icône PDF générique. En mode
  // multi, ce cas ne se présente que si le PDF est le seul format déposé.
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;

    if (mode === "multi") {
      const svgFile = (form.elements.namedItem("svg_file") as HTMLInputElement | null)?.files?.[0];
      const pngFile = (form.elements.namedItem("png_file") as HTMLInputElement | null)?.files?.[0];
      const pdfFile = (form.elements.namedItem("pdf_file") as HTMLInputElement | null)?.files?.[0];

      if (svgFile || pngFile || !pdfFile) return;

      e.preventDefault();
      const formData = new FormData(form);

      const previewBlob = await generatePdfPreview(pdfFile);
      if (previewBlob) {
        formData.append("pdf_preview_file", previewBlob, "preview.png");
      }

      startTransition(() => {
        formAction(formData);
      });
      return;
    }

    const file = (form.elements.namedItem("file") as HTMLInputElement | null)?.files?.[0];
    if (!file || file.type !== "application/pdf") return;

    e.preventDefault();
    const formData = new FormData(form);

    const previewBlob = await generatePdfPreview(file);
    if (previewBlob) {
      formData.append("pdf_preview_file", previewBlob, "preview.png");
    }

    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      className="glass rounded-card p-4 max-w-md flex flex-col gap-3 mb-6"
    >
      <p className="text-sm font-medium">Ajouter un fichier</p>

      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="project_section_id" value={projectSectionId} />
      <input type="hidden" name="mode" value={mode} />

      <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/55 border border-white/60 w-fit">
        <button
          type="button"
          onClick={() => setMode("single")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            mode === "single" ? "bg-clay-100 text-clay-700" : "text-ink-500 hover:text-ink-900"
          }`}
        >
          Fichier unique
        </button>
        <button
          type="button"
          onClick={() => setMode("multi")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            mode === "multi" ? "bg-clay-100 text-clay-700" : "text-ink-500 hover:text-ink-900"
          }`}
        >
          Plusieurs formats
        </button>
      </div>

      <div>
        <label htmlFor="section-asset-label" className={labelClass}>
          Nom *
        </label>
        <input
          id="section-asset-label"
          name="label"
          required
          className={inputClass}
          placeholder="ex: Illustration accueil"
        />
      </div>

      {mode === "single" ? (
        <div>
          <label htmlFor="section-asset-file" className={labelClass}>
            Fichier (PNG, SVG, PDF, vidéo) *
          </label>
          <input
            id="section-asset-file"
            name="file"
            type="file"
            accept="image/*,application/pdf,video/*"
            required
            className={`${inputClass} file:mr-3 file:py-1 file:px-2 file:rounded-chip file:border-0 file:text-xs file:bg-white/65 file:text-ink-700`}
          />
        </div>
      ) : (
        <>
          <p className="text-xs text-ink-500 -mb-1">Dépose au moins un format (PDF, PNG ou SVG).</p>

          <div>
            <label htmlFor="section-asset-pdf-file" className={labelClass}>
              Fichier PDF
            </label>
            <input
              id="section-asset-pdf-file"
              name="pdf_file"
              type="file"
              accept="application/pdf"
              className={`${inputClass} file:mr-3 file:py-1 file:px-2 file:rounded-chip file:border-0 file:text-xs file:bg-white/65 file:text-ink-700`}
            />
          </div>

          <div>
            <label htmlFor="section-asset-png-file" className={labelClass}>
              Fichier PNG
            </label>
            <input
              id="section-asset-png-file"
              name="png_file"
              type="file"
              accept="image/png"
              className={`${inputClass} file:mr-3 file:py-1 file:px-2 file:rounded-chip file:border-0 file:text-xs file:bg-white/65 file:text-ink-700`}
            />
          </div>

          <div>
            <label htmlFor="section-asset-svg-file" className={labelClass}>
              Fichier SVG
            </label>
            <input
              id="section-asset-svg-file"
              name="svg_file"
              type="file"
              accept=".svg,image/svg+xml"
              className={`${inputClass} file:mr-3 file:py-1 file:px-2 file:rounded-chip file:border-0 file:text-xs file:bg-white/65 file:text-ink-700`}
            />
          </div>

          <ExtraFormatFields />
        </>
      )}

      {state.error && (
        <p className="text-sm text-err-600 bg-err-100 border border-err-600/15 rounded-field px-3.5 py-2.5">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start btn-clay text-sm font-semibold px-4 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? "Ajout..." : "Ajouter"}
      </button>
    </form>
  );
}
