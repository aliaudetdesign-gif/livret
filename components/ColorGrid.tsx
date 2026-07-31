"use client";

import { useState, useTransition } from "react";
import { deleteBrandAssets } from "@/app/agence/projets/[id]/actions";
import { ColorCard } from "@/components/ColorCard";
import type { BrandAsset, ColorCategory, ColorMetadata } from "@/lib/types";
import type { ReactNode } from "react";

const categoryOrder: ColorCategory[] = ["primaire", "secondaire"];

const categoryHeadings: Record<ColorCategory, string> = {
  primaire: "Couleurs primaires",
  secondaire: "Couleurs secondaires",
};

// Couleurs créées avant l'ajout de la catégorie (metadata absente) : classées
// par défaut en primaire plutôt que masquées.
function categoryOf(asset: BrandAsset): ColorCategory {
  const metadata = asset.metadata as unknown as ColorMetadata | null;
  return metadata?.category ?? "primaire";
}

// Grille de la palette de couleurs, groupée par catégorie (primaire/secondaire)
// façon DocumentGrid. En mode agence (projectId fourni) : édition et
// suppression portées par chaque ColorCard, plus sélection multiple et
// suppression groupée. Lecture seule côté client (projectId absent).
export function ColorGrid({
  assets,
  projectId,
  addSlot,
}: {
  assets: BrandAsset[];
  projectId?: string;
  addSlot?: ReactNode;
}) {
  const editable = !!projectId;

  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelected(new Set());
  }

  function handleBulkDelete() {
    if (!projectId || selected.size === 0) return;
    const confirmed = window.confirm(
      `Supprimer ${selected.size} couleur${selected.size > 1 ? "s" : ""} ? Cette action est irréversible.`
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
      <div className="grid grid-cols-4 gap-4">{addSlot}</div>
    ) : (
      <p className="text-sm text-zinc-400">
        Rien à afficher pour l&apos;instant, ton agence n&apos;a pas encore ajouté d&apos;éléments ici.
      </p>
    );
  }

  return (
    <div>
      {editable && (
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => (selectionMode ? exitSelectionMode() : setSelectionMode(true))}
            className="text-sm font-medium text-zinc-500 hover:text-[var(--color-terracotta)]"
          >
            {selectionMode ? "Annuler" : "Sélectionner"}
          </button>

          {selectionMode && (
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={selected.size === 0 || isPending}
              className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? "Suppression..." : `Supprimer (${selected.size})`}
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2 mb-4">{error}</p>
      )}

      <div className="flex flex-col gap-6">
        {addSlot && (
          <div key="add-slot" className="grid grid-cols-4 gap-4">
            {addSlot}
          </div>
        )}

        {categoryOrder.map((category) => {
          const items = assets.filter((asset) => categoryOf(asset) === category);
          if (items.length === 0) return null;

          return (
            <div key={category}>
              <p className="text-sm font-medium mb-3">{categoryHeadings[category]}</p>
              <div className="grid grid-cols-4 gap-4">
                {items.map((asset) => (
                  <ColorCard
                    key={asset.id}
                    asset={asset}
                    projectId={projectId}
                    selectionMode={editable && selectionMode}
                    selected={selected.has(asset.id)}
                    onToggleSelect={() => toggleSelect(asset.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
