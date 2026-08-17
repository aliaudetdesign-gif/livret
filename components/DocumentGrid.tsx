"use client";

import { useState, useTransition } from "react";
import {
  deleteProjectDocument,
  deleteProjectDocuments,
} from "@/app/agence/projets/[id]/actions";
import { DocumentCard } from "@/components/DocumentCard";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { DocumentCategory, ProjectDocument } from "@/lib/types";
import type { ReactNode } from "react";

const categoryOrder: DocumentCategory[] = ["devis", "facture", "brief"];

const categoryHeadings: Record<DocumentCategory, string> = {
  devis: "Devis",
  facture: "Factures",
  brief: "Brief",
};

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
  const [confirmDelete, setConfirmDelete] = useState<
    { type: "single"; doc: ProjectDocument } | { type: "bulk" } | null
  >(null);

  function handleSelectFromMenu(doc: ProjectDocument) {
    setSelectionMode(true);
    setSelected(new Set([doc.id]));
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
    setConfirmDelete({ type: "single", doc });
  }

  function handleBulkDelete() {
    if (!projectId || selected.size === 0) return;
    setConfirmDelete({ type: "bulk" });
  }

  function runConfirmedDelete() {
    if (!projectId || !confirmDelete) return;

    setError(null);
    startTransition(async () => {
      try {
        if (confirmDelete.type === "single") {
          const result = await deleteProjectDocument(confirmDelete.doc.id, projectId);
          if (result.error) setError(result.error);
        } else {
          const result = await deleteProjectDocuments(Array.from(selected), projectId);
          if (result.error) {
            setError(result.error);
          } else {
            exitSelectionMode();
          }
        }
      } catch {
        setError("Une erreur est survenue, réessaie.");
      }
      setConfirmDelete(null);
    });
  }

  if (documents.length === 0) {
    return addSlot ? (
      <div className="grid grid-cols-3 gap-4">{addSlot}</div>
    ) : (
      <p className="text-sm text-ink-400">
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

      <div className="flex flex-col gap-6">
        {addSlot && <div key="add-slot" className="grid grid-cols-3 gap-4">{addSlot}</div>}

        {categoryOrder.map((category) => {
          const items = documents.filter((doc) => doc.category === category);
          if (items.length === 0) return null;

          return (
            <div key={category}>
              <p className="text-sm font-medium mb-3">{categoryHeadings[category]}</p>
              <ul className="grid grid-cols-3 gap-4">
                {items.map((doc) => (
                  <li key={doc.id}>
                    <DocumentCard
                      doc={doc}
                      projectId={projectId}
                      selectionMode={editable && selectionMode}
                      selected={selected.has(doc.id)}
                      onToggleSelect={() => toggleSelect(doc.id)}
                      onSelectFromMenu={handleSelectFromMenu}
                      onDelete={handleDelete}
                      isDeleting={isPending}
                    />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title={
          confirmDelete?.type === "bulk"
            ? `Supprimer ${selected.size} document${selected.size > 1 ? "s" : ""} ?`
            : confirmDelete?.type === "single"
              ? `Supprimer "${confirmDelete.doc.label}" ?`
              : ""
        }
        message="Récupérable depuis la Corbeille en cas d'erreur."
        pending={isPending}
        onConfirm={runConfirmedDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
