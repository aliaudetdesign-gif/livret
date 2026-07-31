"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  updateBrandAsset,
  deleteBrandAsset,
  type AssetActionState,
} from "@/app/agence/projets/[id]/actions";
import type { AssetType, BrandAsset } from "@/lib/types";

const FILE_TYPES: AssetType[] = ["logo", "moodboard"];
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

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      setIsEditing(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  function handleDelete() {
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

  return (
    <div className="group relative glass rounded-card p-4">
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
        <div className="aspect-square w-full mb-2 rounded-md overflow-hidden bg-white/55">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset.value}
            alt={asset.label}
            className="w-full h-full object-contain"
          />
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
              className="text-xs font-medium bg-gradient-terracotta text-white rounded-md px-3 py-1.5 disabled:opacity-60"
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
    </div>
  );
}
