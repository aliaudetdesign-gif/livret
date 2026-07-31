"use client";

import { useState, useTransition } from "react";
import {
  deleteProjectDocument,
  deleteProjectDocuments,
} from "@/app/agence/projets/[id]/actions";
import type { DocumentCategory, ProjectDocument } from "@/lib/types";
import type { ReactNode } from "react";

const categoryOrder: DocumentCategory[] = ["devis", "facture", "brief"];

const categoryHeadings: Record<DocumentCategory, string> = {
  devis: "Devis",
  facture: "Factures",
  brief: "Brief",
};

// Déclenche un vrai téléchargement (et non une ouverture d'onglet) même pour
// un fichier cross-origin (storage Supabase) : l'attribut download seul est
// ignoré par les navigateurs sur ce type d'URL.
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

function PdfIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-8 h-8 text-[var(--color-terracotta)] shrink-0"
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

// Grille des documents administratifs, groupée par catégorie. En mode agence
// (projectId fourni) : suppression individuelle au survol + sélection multiple
// avec suppression groupée. Lecture seule côté client (projectId absent).
export function DocumentGrid({
  documents,
  projectId,
  addSlot,
}: {
  documents: ProjectDocument[];
  projectId?: string;
  addSlot?: ReactNode;
}) {
  const editable = !!projectId;

  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function handleClientDownload(doc: ProjectDocument) {
    setError(null);
    setDownloadingId(doc.id);
    try {
      await downloadFile(doc.file_url, doc.label.toLowerCase().endsWith(".pdf") ? doc.label : `${doc.label}.pdf`);
    } catch {
      setError("Le téléchargement a échoué, réessaie.");
    } finally {
      setDownloadingId(null);
    }
  }

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

  function handleDelete(doc: ProjectDocument) {
    if (!projectId) return;
    const confirmed = window.confirm(
      `Supprimer "${doc.label}" ? Cette action est irréversible.`
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteProjectDocument(doc.id, projectId);
        if (result.error) setError(result.error);
      } catch {
        setError("Une erreur est survenue, réessaie.");
      }
    });
  }

  function handleBulkDelete() {
    if (!projectId || selected.size === 0) return;
    const confirmed = window.confirm(
      `Supprimer ${selected.size} document${selected.size > 1 ? "s" : ""} ? Cette action est irréversible.`
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteProjectDocuments(Array.from(selected), projectId);
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

  if (documents.length === 0) {
    return addSlot ? (
      <div className="grid grid-cols-3 gap-4">{addSlot}</div>
    ) : (
      <p className="text-sm text-zinc-400">
        Aucun document pour l&apos;instant.
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
        {addSlot && <div key="add-slot" className="grid grid-cols-3 gap-4">{addSlot}</div>}

        {categoryOrder.map((category) => {
          const items = documents.filter((doc) => doc.category === category);
          if (items.length === 0) return null;

          return (
            <div key={category}>
              <p className="text-sm font-medium mb-3">{categoryHeadings[category]}</p>
              <ul className="grid grid-cols-3 gap-4">
                {items.map((doc) =>
                  editable && selectionMode ? (
                    <li key={doc.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleSelect(doc.id)}
                        className="flex items-center gap-3 bg-white border border-zinc-100 rounded-lg p-4 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(doc.id)}
                          onChange={() => toggleSelect(doc.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 accent-[var(--color-terracotta)] shrink-0"
                        />
                        <PdfIcon />
                        <span className="text-sm font-medium truncate">{doc.label}</span>
                      </div>
                    </li>
                  ) : (
                    <li key={doc.id} className="group relative">
                      {editable && (
                        <button
                          type="button"
                          onClick={() => handleDelete(doc)}
                          disabled={isPending}
                          className="absolute top-3 right-3 z-10 hidden group-hover:flex w-7 h-7 items-center justify-center rounded-md bg-white border border-zinc-200 text-zinc-500 hover:text-red-600 disabled:opacity-50"
                          title="Supprimer"
                        >
                          ✕
                        </button>
                      )}
                      {editable ? (
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 bg-white border border-zinc-100 rounded-lg p-4 hover-lift"
                        >
                          <PdfIcon />
                          <span className="text-sm font-medium truncate">{doc.label}</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleClientDownload(doc)}
                          disabled={downloadingId === doc.id}
                          className="w-full flex items-center gap-3 bg-white border border-zinc-100 rounded-lg p-4 hover-lift text-left disabled:opacity-60 disabled:cursor-wait"
                        >
                          <PdfIcon />
                          <span className="text-sm font-medium truncate">{doc.label}</span>
                          <span className="ml-auto text-xs text-zinc-400 shrink-0">
                            {downloadingId === doc.id ? "..." : "↓"}
                          </span>
                        </button>
                      )}
                    </li>
                  )
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
