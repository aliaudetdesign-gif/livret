"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { LOGO_FORMAT_DESCRIPTIONS, type BrandAsset, type LogoBackground, type LogoMetadata } from "@/lib/types";
import {
  updateBrandAsset,
  deleteBrandAsset,
  type AssetActionState,
} from "@/app/agence/projets/[id]/actions";
import { ExtraFormatFields } from "@/components/ExtraFormatFields";
import { InfoPopover } from "@/components/InfoPopover";

export type FormatKey = keyof LogoMetadata["formats"];

export const FORMAT_LABELS: Record<FormatKey, string> = { svg: "SVG", png: "PNG", pdf: "PDF" };

// Déclenche un vrai téléchargement (et non une ouverture d'onglet) même pour
// des fichiers cross-origin (storage Supabase) : l'attribut download seul est
// ignoré par les navigateurs sur ce type d'URL. On récupère le fichier en
// blob puis on télécharge depuis une URL locale (même origine).
async function downloadFile(url: string, filename: string) {
  const response = await fetch(url);
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}

// Devine une extension de fichier plausible à partir de l'URL, pour nommer le
// fichier téléchargé (l'URL de storage porte déjà le nom d'origine).
function guessFilename(label: string, url: string): string {
  const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  const ext = match ? match[1] : "";
  return ext ? `${label}.${ext}` : label;
}

const backgroundStyles: Record<LogoBackground, string> = {
  dark: "bg-ink-900 text-white",
  light: "bg-paper text-ink-900",
  color: "bg-gradient-terracotta text-white",
};

const backgroundOptions: { value: LogoBackground; label: string }[] = [
  { value: "dark", label: "Fond sombre" },
  { value: "light", label: "Fond clair" },
  { value: "color", label: "Fond couleur" },
];

const inputClass =
  "w-full px-2.5 py-1.5 text-sm bg-white/70 border border-white/60 rounded-field focus:outline-none focus:border-clay-500 focus:bg-white/90 transition-colors";
const labelClass = "block text-xs font-medium text-ink-500 mb-1";

const initialState: AssetActionState = { error: null };

// Carte logo façon "déclinaisons" : aperçu sur son fond réel, formats
// sélectionnables avant téléchargement, pastille "récemment ajouté". En mode
// agence (projectId fourni) : édition en direct (nom / fond / sous-titre),
// suppression et sélection multiple.
export function LogoCard({
  asset,
  recentlyAdded,
  projectId,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: {
  asset: BrandAsset;
  recentlyAdded: boolean;
  projectId?: string;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const metadata = asset.metadata as unknown as LogoMetadata | null;
  const editable = !!projectId;

  const availableFormats = (Object.keys(FORMAT_LABELS) as FormatKey[]).filter(
    (key) => metadata?.formats?.[key]
  );

  // Formats standards (SVG/PNG/PDF) et formats supplémentaires réunis dans une
  // seule liste, pour l'affichage des pastilles et la sélection au téléchargement.
  const badgeItems = metadata
    ? [
        ...availableFormats.map((key) => ({
          key: key as string,
          label: FORMAT_LABELS[key],
          url: metadata.formats[key] as string,
          description: LOGO_FORMAT_DESCRIPTIONS[key],
        })),
        ...(metadata.extraFormats ?? []).map((extra, index) => ({
          key: `extra-${index}`,
          label: extra.label,
          url: extra.url,
          description: undefined as string | undefined,
        })),
      ]
    : [];

  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(new Set());

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

  function toggleFormat(key: string) {
    setSelectedFormats((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    if (!metadata) return;
    const items =
      selectedFormats.size > 0
        ? badgeItems.filter((item) => selectedFormats.has(item.key))
        : badgeItems;

    setIsDownloading(true);
    try {
      for (const item of items) {
        try {
          await downloadFile(item.url, guessFilename(`${asset.label}-${item.label}`, item.url));
        } catch {
          // best effort : on continue avec les autres formats sélectionnés
        }
      }
    } finally {
      setIsDownloading(false);
    }
  }

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

  // Filet de sécurité pour d'anciennes entrées créées avant l'enrichissement
  // du modèle logo (metadata absente).
  if (!metadata) {
    return (
      <div className="glass rounded-card p-4">
        <div className="aspect-square w-full mb-2 rounded-field overflow-hidden bg-white/60">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset.value} alt={asset.label} className="w-full h-full object-contain" />
        </div>
        <div className="font-semibold text-[13.5px]">{asset.label}</div>
      </div>
    );
  }

  // Seuls le SVG et le PNG peuvent être affichés directement en aperçu image.
  // Si seul un PDF a été déposé, on utilise l'aperçu généré côté navigateur à
  // l'upload (metadata.generatedPreview) ; à défaut, une icône de secours.
  const previewUrl =
    metadata.formats.svg ?? metadata.formats.png ?? metadata.generatedPreview ?? null;

  // L'aperçu généré depuis un PDF est le rendu complet de la page (il porte
  // déjà son propre fond) : on le fait remplir toute la case plutôt que de le
  // centrer sur le fond choisi, sans quoi on obtient un double cadre visible.
  const isGeneratedFallback = !metadata.formats.svg && !metadata.formats.png && !!previewUrl;

  return (
    <div className="glass hover-lift group relative rounded-card overflow-hidden">
      {recentlyAdded && (
        <span
          className="absolute top-3 right-3 z-20 w-2.5 h-2.5 rounded-full bg-clay-500 shadow-[0_0_0_3px_rgba(255,255,255,0.6)]"
          title="Récemment ajouté"
        />
      )}

      {selectionMode ? (
        <label className="absolute top-3 left-3 z-20">
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
          <div className="absolute top-3 left-3 z-20 hidden group-hover:flex gap-1">
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

      <div
        className={`relative aspect-[4/3] w-full flex items-center justify-center border-b border-white/45 ${
          isGeneratedFallback ? "bg-white/60" : backgroundStyles[metadata.background]
        }`}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={asset.label}
            className={
              isGeneratedFallback
                ? "w-full h-full object-cover"
                : "max-w-[82%] max-h-[70%] object-contain"
            }
          />
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-80">
            <svg
              viewBox="0 0 24 24"
              className="w-10 h-10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M14 2v5h5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs">PDF uniquement</span>
          </div>
        )}

        {!isEditing && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-900/25 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="bg-white/95 text-ink-900 text-xs font-semibold rounded-full px-4 py-2 shadow-[0_8px_20px_-8px_rgba(23,22,26,0.5)] disabled:opacity-60 disabled:cursor-wait"
            >
              {isDownloading ? "Téléchargement..." : "↓ Télécharger"}
            </button>
          </div>
        )}
      </div>

      <div className="p-4">
        {isEditing ? (
          <form action={formAction} className="flex flex-col gap-2">
            <input type="hidden" name="asset_id" value={asset.id} />
            <input type="hidden" name="project_id" value={projectId} />
            <input type="hidden" name="type" value="logo" />

            <div>
              <label className={labelClass}>Nom</label>
              <input name="label" defaultValue={asset.label} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Fond</label>
              <select
                name="background"
                defaultValue={metadata.background}
                required
                className={inputClass}
              >
                {backgroundOptions.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Sous-titre</label>
              <input
                name="subtitle"
                defaultValue={metadata.subtitle ?? ""}
                className={inputClass}
              />
            </div>

            <ExtraFormatFields />

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
            <div className="font-semibold text-[13.5px]">{asset.label}</div>
            {metadata.subtitle && (
              <div className="text-xs text-ink-500 mt-0.5">{metadata.subtitle}</div>
            )}

            {badgeItems.length > 0 && (
              <>
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {badgeItems.map((item) => {
                    const isSelected = selectedFormats.has(item.key);
                    const badge = (
                      <button
                        type="button"
                        onClick={() => toggleFormat(item.key)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                          isSelected
                            ? "bg-ink-900 text-white border-ink-900"
                            : "bg-white/70 text-ink-500 border-white/60 hover:bg-white/90 hover:text-ink-900"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                    return (
                      <span key={item.key}>
                        {item.description ? (
                          <InfoPopover text={item.description}>{badge}</InfoPopover>
                        ) : (
                          badge
                        )}
                      </span>
                    );
                  })}
                </div>
                <p className="text-[11px] text-ink-400 mt-1.5">
                  {selectedFormats.size === 0
                    ? "Sélectionne le format souhaité"
                    : `${selectedFormats.size} format${selectedFormats.size > 1 ? "s" : ""} sélectionné${selectedFormats.size > 1 ? "s" : ""}`}
                </p>
              </>
            )}

            {deleteError && <p className="text-xs text-err-600 mt-2">{deleteError}</p>}
          </>
        )}
      </div>
    </div>
  );
}
