"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import type { BrandAsset, TypographyCategory, TypographyMetadata } from "@/lib/types";
import {
  updateBrandAsset,
  deleteBrandAsset,
  type AssetActionState,
} from "@/app/agence/projets/[id]/actions";

const categoryConfig: Record<TypographyCategory, { label: string; badgeClass: string }> = {
  titrage: { label: "Titrage", badgeClass: "bg-violet-100 text-violet-700" },
  corps_de_texte: { label: "Corps de texte", badgeClass: "bg-emerald-100 text-emerald-700" },
  accent: { label: "Accent / Labels", badgeClass: "bg-orange-100 text-orange-700" },
};

const inputClass =
  "w-full px-2 py-1.5 text-sm bg-white border border-zinc-200 rounded-md focus:outline-none focus:border-[var(--color-terracotta)] transition-colors";
const labelClass = "block text-xs font-medium text-zinc-500 mb-1";

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
      <div className="bg-white border border-zinc-100 rounded-lg p-5">
        <div className="font-medium text-sm">{asset.label}</div>
        <div className="text-xs text-zinc-500">{asset.value}</div>
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
    <div className="group relative bg-white border border-zinc-100 rounded-lg p-5">
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
            className="w-4 h-4 accent-[var(--color-terracotta)]"
          />
        </label>
      ) : (
        editable &&
        !isEditing && (
          <div className="absolute top-3 right-3 z-10 hidden group-hover:flex gap-1">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-zinc-200 text-zinc-500 hover:text-[var(--color-terracotta)]"
              title="Modifier"
            >
              ✎
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-zinc-200 text-zinc-500 hover:text-red-600 disabled:opacity-50"
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

          {state.error && <p className="text-xs text-red-600">{state.error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="text-xs font-medium bg-gradient-terracotta text-white rounded-md px-3 py-1.5 disabled:opacity-60"
            >
              {pending ? "..." : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs font-medium text-zinc-500 px-3 py-1.5"
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
              <span className={`px-2 py-0.5 rounded-full font-medium ${badgeClass}`}>{label}</span>
              {metadata.source && <span className="text-zinc-400">{metadata.source}</span>}
            </div>
            {metadata.fileUrl && (
              <a
                href={metadata.fileUrl}
                download
                className="text-xs font-medium text-[var(--color-terracotta)] hover:text-[var(--color-terracotta-deep)] whitespace-nowrap"
              >
                ↓ Télécharger
              </a>
            )}
          </div>

          <p className="text-lg font-semibold mb-3">{fontName}</p>

          <div className="border-t border-zinc-100 py-4">
            {category === "titrage" && (
              <div style={{ fontFamily }}>
                <p className="text-3xl font-bold leading-tight">{metadata.previewText}</p>
                {metadata.previewSubtext && (
                  <p className="italic text-lg text-zinc-500 mt-1">{metadata.previewSubtext}</p>
                )}
              </div>
            )}
            {category === "corps_de_texte" && (
              <p style={{ fontFamily }} className="text-base text-zinc-700 leading-relaxed">
                {metadata.previewText}
              </p>
            )}
            {category === "accent" && (
              <div style={{ fontFamily }}>
                <p className="text-sm font-medium uppercase tracking-[0.15em]">{metadata.previewText}</p>
                {metadata.previewSubtext && (
                  <p className="text-xs text-zinc-500 mt-1 tracking-normal normal-case">
                    {metadata.previewSubtext}
                  </p>
                )}
              </div>
            )}
          </div>

          {metadata.weights.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
              {metadata.weights.map((w) => (
                <span
                  key={w}
                  className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600"
                >
                  {w}
                </span>
              ))}
            </div>
          )}

          {deleteError && <p className="text-xs text-red-600 mt-2">{deleteError}</p>}
        </>
      )}
    </div>
  );
}
