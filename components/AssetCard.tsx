"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  updateBrandAsset,
  deleteBrandAsset,
  type AssetActionState,
} from "@/app/agence/projets/[id]/actions";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { downloadFile, guessFilename } from "@/lib/download";
import type { AssetType, BrandAsset, GuideMetadata } from "@/lib/types";

const FILE_TYPES: AssetType[] = ["logo", "moodboard", "guide"];
const initialState: AssetActionState = { error: null };

const inputClass =
  "w-full px-2.5 py-1.5 text-sm bg-white/70 border border-white/60 rounded-field focus:outline-none focus:border-clay-500 focus:bg-white/90 transition-colors";

// Carte d'un élément de marque (logo, couleur, moodboard) côté agence, avec
// édition en direct, suppression et sélection multiple. Le fichier lui-même
// n'est pas modifiable ici : pour un logo/visuel, seul le nom est éditable.
export function AssetCard({
  asset,
  type,
  projectId,
  selectionMode,
  selected,
  onToggleSelect,
}: {
  asset: BrandAsset;
  type: AssetType;
  projectId: string;
  selectionMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const isFile = FILE_TYPES.includes(type);

  const [isEditing, setIsEditing] = useState(false);
  const [state, formAction, pending] = useActionState(updateBrandAsset, initialState);
  const wasPending = useRef(false);

  const [isDeleting, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    setIsDownloading(true);
    try {
      await downloadFile(asset.value, guessFilename(asset.label, asset.value));
    } catch {
      // best effort
    } finally {
      setIsDownloading(false);
    }
  }

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      setIsEditing(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  function handleDelete() {
    setConfirmOpen(true);
  }

  function runDelete() {
    setDeleteError(null);
    startTransition(async () => {
      try {
        const result = await deleteBrandAsset(asset.id, projectId);
        if (result.error) setDeleteError(result.error);
      } catch {
        setDeleteError("Une erreur est survenue, réessaie.");
      }
      setConfirmOpen(false);
    });
  }

  // Un guide est un PDF : pas d'affichage direct en <img>. On utilise
  // l'aperçu de la 1re page généré côté navigateur à l'upload, avec une
  // icône de secours si cet aperçu n'a pas pu être généré (même logique que
  // les logos déposés uniquement en PDF sur LogoCard).
  const isGuide = type === "guide";
  const guidePreviewUrl = isGuide
    ? ((asset.metadata as unknown as GuideMetadata | null)?.generatedPreview ?? null)
    : null;

  return (
    <div className="group relative glass rounded-card p-4">
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

      {isFile ? (
        <div className="relative aspect-square w-full mb-2 rounded-field overflow-hidden bg-white/55">
          {isGuide ? (
            guidePreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={guidePreviewUrl}
                alt={asset.label}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-80">
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
            )
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={asset.value}
              alt={asset.label}
              className="w-full h-full object-contain"
            />
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
      ) : null}

      {isEditing ? (
        <form action={formAction} className="flex flex-col gap-2">
          <input type="hidden" name="asset_id" value={asset.id} />
          <input type="hidden" name="project_id" value={projectId} />
          <input type="hidden" name="type" value={type} />

          <input
            name="label"
            defaultValue={asset.label}
            required
            className={inputClass}
          />
          {!isFile && (
            <input
              name="value"
              defaultValue={asset.value}
              required
              className={inputClass}
            />
          )}

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
              className="text-xs font-medium text-ink-500 px-3 py-1.5"
            >
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="font-medium text-sm">{asset.label}</div>
          {!isFile && (
            <div className="flex items-center gap-2 text-xs text-ink-500 mt-1">
              {type === "couleur" && (
                <span
                  className="w-4 h-4 rounded-full border border-white/60 inline-block shrink-0"
                  style={{ backgroundColor: asset.value }}
                />
              )}
              {asset.value}
            </div>
          )}
        </>
      )}

      {deleteError && <p className="text-xs text-err-600 mt-2">{deleteError}</p>}

      <ConfirmDialog
        open={confirmOpen}
        title={`Supprimer "${asset.label}" ?`}
        message="Récupérable depuis la Corbeille en cas d'erreur."
        pending={isDeleting}
        onConfirm={runDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
