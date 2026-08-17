"use client";

import { useState, useTransition } from "react";
import { deleteBrandAssets } from "@/app/agence/projets/[id]/actions";
import { AssetCard } from "@/components/AssetCard";
import { TypographyCard } from "@/components/TypographyCard";
import { LogoCard } from "@/components/LogoCard";
import { ConfirmDialog } from "@/components/ConfirmDialog";
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
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);

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
    setConfirmBulkOpen(true);
  }

  function runBulkDelete() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteBrandAssets(Array.from(selected), projectId);
        if (result.error) {
          setError(result.error);
        } else {
          exitSelectionMode();
        }
      } catch {
        setError("Une erreur est survenue, réessaie.");
      }
      setConfirmBulkOpen(false);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        {assets.length > 0 ? (
          <button
            type="button"
            onClick={() => (selectionMode ? exitSelectionMode() : setSelectionMode(true))}
            className="text-sm font-medium text-ink-500 hover:text-clay-600"
          >
            {selectionMode ? "Annuler" : "Sélectionner"}
          </button>
        ) : (
          <span />
        )}

        {selectionMode ? (
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-sm text-ink-500 hover:text-clay-600"
            >
              {selected.size === assets.length ? "Tout désélectionner" : "Tout sélectionner"}
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={selected.size === 0 || isPending}
              className="text-sm font-medium text-err-600 hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
            >
              {isPending ? "Suppression..." : `Supprimer (${selected.size})`}
            </button>
          </div>
        ) : (
          addSlot
        )}
      </div>

      {error && (
        <p className="text-sm text-err-600 bg-err-100 border border-err-600/15 rounded-field px-3.5 py-2.5 mb-4">{error}</p>
      )}

      {assets.length === 0 ? (
        <p className="text-sm text-ink-400">
          Aucun élément pour ce projet pour l&apos;instant.
        </p>
      ) : (
      <div
        className={
          type === "typographie" ? "flex flex-col gap-4 max-w-2xl" : "grid grid-cols-3 gap-4"
        }
      >
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
      )}

      <ConfirmDialog
        open={confirmBulkOpen}
        title={`Supprimer ${selected.size} élément${selected.size > 1 ? "s" : ""} ?`}
        message="Récupérable depuis la Corbeille en cas d'erreur."
        pending={isPending}
        onConfirm={runBulkDelete}
        onCancel={() => setConfirmBulkOpen(false)}
      />
    </div>
  );
}
