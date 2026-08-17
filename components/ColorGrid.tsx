"use client";

import { useState, useTransition } from "react";
import { deleteBrandAssets } from "@/app/agence/projets/[id]/actions";
import { ColorCard } from "@/components/ColorCard";
import { ConfirmDialog } from "@/components/ConfirmDialog";
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
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);

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
    setConfirmBulkOpen(true);
  }

  function runBulkDelete() {
    if (!projectId) return;
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

  if (assets.length === 0 && !editable) {
    return (
      <p className="text-sm text-ink-400">
        Rien à afficher pour l&apos;instant, ton agence n&apos;a pas encore ajouté d&apos;éléments ici.
      </p>
    );
  }

  return (
    <div>
      {editable && (
        <div className="flex items-center justify-between mb-4">
          {selectionMode ? (
            <button
              type="button"
              onClick={exitSelectionMode}
              className="text-sm font-medium text-ink-500 hover:text-clay-600"
            >
              Annuler
            </button>
          ) : assets.length > 0 ? (
            <button
              type="button"
              onClick={() => setSelectionMode(true)}
              className="text-sm font-medium text-ink-500 hover:text-clay-600"
            >
              Sélectionner
            </button>
          ) : (
            <span />
          )}

          {selectionMode ? (
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={selected.size === 0 || isPending}
              className="text-sm font-medium text-err-600 hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
            >
              {isPending ? "Suppression..." : `Supprimer (${selected.size})`}
            </button>
          ) : (
            addSlot
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-err-600 bg-err-100 border border-err-600/15 rounded-field px-3.5 py-2.5 mb-4">{error}</p>
      )}

      {assets.length === 0 ? (
        <p className="text-sm text-ink-400">Aucune couleur pour l&apos;instant.</p>
      ) : (
      <div className="flex flex-col gap-6">
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
      )}

      <ConfirmDialog
        open={confirmBulkOpen}
        title={`Supprimer ${selected.size} couleur${selected.size > 1 ? "s" : ""} ?`}
        message="Récupérable depuis la Corbeille en cas d'erreur."
        pending={isPending}
        onConfirm={runBulkDelete}
        onCancel={() => setConfirmBulkOpen(false)}
      />
    </div>
  );
}
