"use client";

import { Fragment, useState, useTransition } from "react";
import { deleteBrandAssets } from "@/app/agence/projets/[id]/actions";
import { AssetCard } from "@/components/AssetCard";
import { TypographyCard } from "@/components/TypographyCard";
import { LogoCard } from "@/components/LogoCard";
import type { AssetType, BrandAsset } from "@/lib/types";
import type { ReactNode } from "react";

const RECENT_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

function isRecentlyAdded(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < RECENT_THRESHOLD_MS;
}

// Grille des éléments d'une section (logo, couleur, typographie, moodboard)
// côté agence : sélection multiple + suppression groupée, en plus de l'édition
// et la suppression individuelles portées par chaque carte.
export function AssetGrid({
  assets,
  type,
  projectId,
  addSlot,
}: {
  assets: BrandAsset[];
  type: AssetType;
  projectId: string;
  addSlot?: ReactNode;
}) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) =>
      prev.size === assets.length ? new Set() : new Set(assets.map((a) => a.id))
    );
  }

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelected(new Set());
  }

  function handleBulkDelete() {
    if (selected.size === 0) return;
    const confirmed = window.confirm(
      `Supprimer ${selected.size} élément${selected.size > 1 ? "s" : ""} ? Cette action est irréversible.`
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteBrandAssets(Array.from(selected), projectId);
        if (result.error) {
          setError(result.error);
          return;
        }
        exitSelectionMode();
      } catch {
        setError("Une erreur est survenue, réessaie.");
      }
    });
  }

  if (assets.length === 0) {
    return addSlot ? (
      <div
        className={
          type === "typographie" ? "flex flex-col gap-4 max-w-2xl" : "grid grid-cols-3 gap-4"
        }
      >
        {addSlot}
      </div>
    ) : (
      <p className="text-sm text-ink-400">
        Aucun élément pour ce projet pour l&apos;instant.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => (selectionMode ? exitSelectionMode() : setSelectionMode(true))}
          className="text-sm font-medium text-ink-500 hover:text-[var(--color-terracotta)]"
        >
          {selectionMode ? "Annuler" : "Sélectionner"}
        </button>

        {selectionMode && (
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-sm text-ink-500 hover:text-[var(--color-terracotta)]"
            >
              {selected.size === assets.length ? "Tout désélectionner" : "Tout sélectionner"}
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={selected.size === 0 || isPending}
              className="text-sm font-medium text-err-600 hover:text-err-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? "Suppression..." : `Supprimer (${selected.size})`}
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-err-600 bg-err-100 rounded-md px-3 py-2 mb-4">{error}</p>
      )}

      <div
        className={
          type === "typographie" ? "flex flex-col gap-4 max-w-2xl" : "grid grid-cols-3 gap-4"
        }
      >
        {addSlot && <Fragment key="add-slot">{addSlot}</Fragment>}
        {assets.map((asset) =>
          type === "typographie" ? (
            <TypographyCard
              key={asset.id}
              asset={asset}
              projectId={projectId}
              selectionMode={selectionMode}
              selected={selected.has(asset.id)}
              onToggleSelect={() => toggleSelect(asset.id)}
            />
          ) : type === "logo" ? (
            <LogoCard
              key={asset.id}
              asset={asset}
              recentlyAdded={isRecentlyAdded(asset.created_at)}
              projectId={projectId}
              selectionMode={selectionMode}
              selected={selected.has(asset.id)}
              onToggleSelect={() => toggleSelect(asset.id)}
            />
          ) : (
            <AssetCard
              key={asset.id}
              asset={asset}
              type={type}
              projectId={projectId}
              selectionMode={selectionMode}
              selected={selected.has(asset.id)}
              onToggleSelect={() => toggleSelect(asset.id)}
            />
          )
        )}
      </div>
    </div>
  );
}
