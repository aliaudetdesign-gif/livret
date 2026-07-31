"use client";

import { useState, useTransition } from "react";
import {
  deleteSectionAsset,
  deleteSectionAssets,
} from "@/app/agence/projets/[id]/actions";
import type { SectionAsset } from "@/lib/types";
import type { ReactNode } from "react";

function PdfIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-8 h-8 text-clay-600"
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
  );
}

// Grille des fichiers d'une section complémentaire. En mode agence (projectId
// fourni) : suppression individuelle au survol + sélection multiple avec
// suppression groupée. Lecture seule côté client (projectId absent).
export function SectionAssetGrid({
  assets,
  projectId,
  addSlot,
}: {
  assets: SectionAsset[];
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

  function handleDelete(asset: SectionAsset) {
    if (!projectId) return;
    const confirmed = window.confirm(
      `Supprimer "${asset.label}" ? Cette action est irréversible.`
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteSectionAsset(asset.id, projectId);
        if (result.error) setError(result.error);
      } catch {
        setError("Une erreur est survenue, réessaie.");
      }
    });
  }

  function handleBulkDelete() {
    if (!projectId || selected.size === 0) return;
    const confirmed = window.confirm(
      `Supprimer ${selected.size} fichier${selected.size > 1 ? "s" : ""} ? Cette action est irréversible.`
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteSectionAssets(Array.from(selected), projectId);
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
      <ul className="grid grid-cols-4 gap-4">
        <li>{addSlot}</li>
      </ul>
    ) : (
      <p className="text-sm text-ink-400">Aucun fichier pour l&apos;instant.</p>
    );
  }

  return (
    <div>
      {editable && (
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => (selectionMode ? exitSelectionMode() : setSelectionMode(true))}
            className="text-sm font-medium text-ink-500 hover:text-clay-600"
          >
            {selectionMode ? "Annuler" : "Sélectionner"}
          </button>

          {selectionMode && (
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={selected.size === 0 || isPending}
              className="text-sm font-medium text-err-600 hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
            >
              {isPending ? "Suppression..." : `Supprimer (${selected.size})`}
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-err-600 bg-err-100 border border-err-600/15 rounded-field px-3.5 py-2.5 mb-4">{error}</p>
      )}

      <ul className="grid grid-cols-4 gap-4">
        {addSlot && <li key="add-slot">{addSlot}</li>}
        {assets.map((asset) => {
          const isImage = asset.file_type.startsWith("image/");

          const preview = isImage ? (
            <div className="aspect-square w-full mb-2 rounded-field overflow-hidden bg-white/55">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset.file_url}
                alt={asset.label}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="aspect-square w-full mb-2 rounded-field bg-white/55 flex items-center justify-center">
              <PdfIcon />
            </div>
          );

          if (editable && selectionMode) {
            return (
              <li key={asset.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleSelect(asset.id)}
                  className="relative block glass rounded-card p-4 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(asset.id)}
                    onChange={() => toggleSelect(asset.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-3 left-3 z-10 w-4 h-4 accent-clay-500"
                  />
                  {preview}
                  <div className="text-sm font-medium truncate">{asset.label}</div>
                </div>
              </li>
            );
          }

          return (
            <li key={asset.id} className="group relative">
              {editable && (
                <button
                  type="button"
                  onClick={() => handleDelete(asset)}
                  disabled={isPending}
                  className="absolute top-3 right-3 z-10 hidden group-hover:flex w-7 h-7 items-center justify-center rounded-chip bg-white/85 border border-white/60 text-ink-500 hover:text-err-600 transition-colors disabled:opacity-50"
                  title="Supprimer"
                >
                  ✕
                </button>
              )}
              <a
                href={asset.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block glass rounded-card p-4 hover-lift"
              >
                {preview}
                <div className="text-sm font-medium truncate">{asset.label}</div>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
