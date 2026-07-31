"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import type { BrandAsset, TypographyCategory, TypographyMetadata } from "@/lib/types";
import {
  updateBrandAsset,
  deleteBrandAsset,
  type AssetActionState,
} from "@/app/agence/projets/[id]/actions";

// Trois teintes de la charte plutôt que violet/emerald/orange, chacune
// vérifiée au-dessus de 4,5:1 sur son propre fond teinté :
// clay-700/clay-100 = 4,99 · ok-600/ok-100 = 5,91 · warn-600/warn-100 = 4,93.
const categoryConfig: Record<TypographyCategory, { label: string; badgeClass: string }> = {
  titrage: { label: "Titrage", badgeClass: "bg-clay-100 text-clay-700" },
  corps_de_texte: { label: "Corps de texte", badgeClass: "bg-ok-100 text-ok-600" },
  accent: { label: "Accent / Labels", badgeClass: "bg-warn-100 text-warn-600" },
};

const inputClass =
  "w-full px-2.5 py-1.5 text-sm bg-white/70 border border-white/60 rounded-field focus:outline-none focus:border-clay-500 focus:bg-white/90 transition-colors";
const labelClass = "block text-xs font-medium text-ink-500 mb-1";

// Construit une URL Google Fonts CSS2 à partir du nom de la police. Best-effort :
// si la police n'existe pas sur Google Fonts, le lien renvoie une erreur silencieuse
// et le navigateur retombe sur la pile de polices système via `font-family`.
function googleFontsUrl(label: string): string {
  const family = label.trim().replace(/\s+/g, "+");
  return `https://fonts.googleapis.com/css2?family=${family}:wght@400;500;600;700&display=swap`;
}

const initialState: AssetActionState = { error: null };

export function TypographyCard({
  asset,
  projectId,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: {
  asset: BrandAsset;
  // projectId n'est fourni que côté agence : sans lui la carte reste en lecture
  // seule (utilisée telle quelle côté client).
  projectId?: string;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const category = asset.value as TypographyCategory;
  const metadata = asset.metadata as unknown as TypographyMetadata | null;
  const editable = !!projectId;

  const [isEditing, setIsEditing] = useState(false);
  const [state, formAction, pending] = useActionState(updateBrandAsset, initialState);
  const wasPending = useRef(false);

  const [isDeleting, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      setIsEditing(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  function handleDelete() {
    if (!projectId) return;
    const confirmed = window.confirm(
      `Supprimer "${asset.label}" ? Cette action est irréversible.`
    );
    if (!confirmed) return;

    setDeleteError(null);
    startTransition(async () => {
      try {
        const result = await deleteBrandAsset(asset.id, projectId);
        if (result.error) setDeleteError(result.error);
      } catch {
        setDeleteError("Une erreur est survenue, réessaie.");
      }
    });
  }

  // Filet de sécurité pour d'éventuelles anciennes entrées créées avant l'enrichissement
  // du formulaire (metadata absente) : affichage minimal plutôt qu'un plantage.
  if (!metadata || !categoryConfig[category]) {
    return (
      <div className="glass rounded-card p-5">
        <div className="font-semibold text-[13.5px]">{asset.label}</div>
        <div className="text-xs text-ink-500">{asset.value}</div>
      </div>
    );
  }

  const { label, badgeClass } = categoryConfig[category];
  const fontName = asset.label;
  const isGoogleFonts = (metadata.source ?? "").toLowerCase().includes("google fonts");
  const uploadedFamily = `brand-font-${asset.id}`;

  const fontFamily = metadata.fileUrl
    ? `"${uploadedFamily}", "${fontName}", sans-serif`
    : `"${fontName}", sans-serif`;

  return (
    <div className="glass group relative rounded-card p-5">
      {metadata.fileUrl && (
        <style
          dangerouslySetInnerHTML={{
            __html: `@font-face { font-family: "${uploadedFamily}"; src: url("${metadata.fileUrl}"); font-display: swap; }`,
          }}
        />
      )}
      {!metadata.fileUrl && isGoogleFonts && (
        <link rel="stylesheet" href={googleFontsUrl(fontName)} />
      )}

      {selectionMode ? (
        <label className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="w-4 h-4 accent-clay-500"
          />
        </label>
      ) : (
        editable &&
        !isEditing && (
          <div className="absolute top-3 right-3 z-10 hidden group-hover:flex gap-1">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="w-7 h-7 flex items-center justify-center rounded-chip bg-white/85 border border-white/60 text-ink-500 hover:text-clay-600 transition-colors"
              title="Modifier"
            >
              ✎
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-7 h-7 flex items-center justify-center rounded-chip bg-white/85 border border-white/60 text-ink-500 hover:text-err-600 transition-colors disabled:opacity-50"
              title="Supprimer"
            >
              ✕
            </button>
          </div>
        )
      )}

      {isEditing ? (
        <form action={formAction} className="flex flex-col gap-2">
          <input type="hidden" name="asset_id" value={asset.id} />
          <input type="hidden" name="project_id" value={projectId} />
          <input type="hidden" name="type" value="typographie" />

          <div>
            <label className={labelClass}>Nom de la police</label>
            <input name="label" defaultValue={asset.label} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Source</label>
            <input name="source" defaultValue={metadata.source ?? ""} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Texte d&apos;aperçu</label>
            <input
              name="preview_text"
              defaultValue={metadata.previewText}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Texte d&apos;aperçu secondaire</label>
            <input
              name="preview_subtext"
              defaultValue={metadata.previewSubtext ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Graisses disponibles</label>
            <input
              name="weights"
              defaultValue={metadata.weights.join(", ")}
              className={inputClass}
            />
          </div>

          {state.error && <p className="text-xs text-err-600">{state.error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="btn-clay text-xs font-semibold px-3.5 py-1.5 disabled:opacity-60"
            >
              {pending ? "..." : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs font-medium text-ink-500 hover:text-ink-900 transition-colors px-3 py-1.5"
            >
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <>
          <div
            className={`flex items-start justify-between gap-3 mb-3 ${
              editable && metadata.fileUrl ? "pr-20" : ""
            }`}
          >
            <div className="flex items-center gap-2 text-xs">
              <span className={`px-2.5 py-[3.5px] rounded-full text-[11px] font-semibold ${badgeClass}`}>
                {label}
              </span>
              {metadata.source && <span className="text-ink-400">{metadata.source}</span>}
            </div>
            {metadata.fileUrl && (
              <a
                href={metadata.fileUrl}
                download
                className="text-xs font-semibold text-clay-600 hover:text-clay-700 transition-colors whitespace-nowrap"
              >
                ↓ Télécharger
              </a>
            )}
          </div>

          <p className="text-lg font-semibold tracking-[-0.02em] mb-3">{fontName}</p>

          <div className="border-t border-white/55 py-4">
            {category === "titrage" && (
              <div style={{ fontFamily }}>
                <p className="text-3xl font-bold leading-tight">{metadata.previewText}</p>
                {metadata.previewSubtext && (
                  <p className="italic text-lg text-ink-500 mt-1">{metadata.previewSubtext}</p>
                )}
              </div>
            )}
            {category === "corps_de_texte" && (
              <p style={{ fontFamily }} className="text-base text-ink-700 leading-relaxed">
                {metadata.previewText}
              </p>
            )}
            {category === "accent" && (
              <div style={{ fontFamily }}>
                <p className="text-sm font-medium uppercase tracking-[0.15em]">{metadata.previewText}</p>
                {metadata.previewSubtext && (
                  <p className="text-xs text-ink-500 mt-1 tracking-normal normal-case">
                    {metadata.previewSubtext}
                  </p>
                )}
              </div>
            )}
          </div>

          {metadata.weights.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-white/55 pt-4">
              {metadata.weights.map((w) => (
                <span
                  key={w}
                  className="text-xs px-2.5 py-1 rounded-full bg-white/65 border border-white/60 text-ink-700"
                >
                  {w}
                </span>
              ))}
            </div>
          )}

          {deleteError && <p className="text-xs text-err-600 mt-2">{deleteError}</p>}
        </>
      )}
    </div>
  );
}
