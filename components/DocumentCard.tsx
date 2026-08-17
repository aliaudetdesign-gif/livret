"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";
import {
  updateProjectDocument,
  type DocumentActionState,
} from "@/app/agence/projets/[id]/actions";
import type { DocumentCategory, ProjectDocument } from "@/lib/types";

const categoryLabels: Record<DocumentCategory, string> = {
  devis: "Devis",
  facture: "Facture",
  brief: "Brief",
};

const inputClass =
  "w-full px-2.5 py-1.5 text-sm bg-white/70 border border-white/60 rounded-field focus:outline-none focus:border-clay-500 focus:bg-white/90 transition-colors";
const labelClass = "block text-xs font-medium text-ink-500 mb-1";

const initialState: DocumentActionState = { error: null };

const RECENT_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

function isRecentlyAdded(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < RECENT_THRESHOLD_MS;
}

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
      className="w-8 h-8 text-clay-600 shrink-0"
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

// Carte document administratif. En mode agence (projectId fourni) : pastille
// "récemment ajouté", menu ⋮ (sélectionner / télécharger / modifier /
// supprimer) et édition inline (nom, catégorie, remplacement du fichier).
// Lecture seule côté client (projectId absent) : bouton de téléchargement
// direct, pastille "récemment ajouté" conservée pour signaler la nouveauté.
export function DocumentCard({
  doc,
  projectId,
  selectionMode = false,
  selected = false,
  onToggleSelect,
  onSelectFromMenu,
  onDelete,
  isDeleting = false,
}: {
  doc: ProjectDocument;
  projectId?: string;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onSelectFromMenu?: (doc: ProjectDocument) => void;
  onDelete?: (doc: ProjectDocument) => void;
  isDeleting?: boolean;
}) {
  const editable = !!projectId;
  const recentlyAdded = isRecentlyAdded(doc.created_at);

  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [state, formAction, pending] = useActionState(updateProjectDocument, initialState);
  const wasPending = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      setIsEditing(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  useEffect(() => {
    if (!menuOpen) return;
    function handlePointer(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [menuOpen]);

  function stop(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  async function handleDownload(e: React.MouseEvent) {
    stop(e);
    setMenuOpen(false);
    setIsDownloading(true);
    try {
      await downloadFile(
        doc.file_url,
        doc.label.toLowerCase().endsWith(".pdf") ? doc.label : `${doc.label}.pdf`
      );
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleClientDownload() {
    setIsDownloading(true);
    try {
      await downloadFile(
        doc.file_url,
        doc.label.toLowerCase().endsWith(".pdf") ? doc.label : `${doc.label}.pdf`
      );
    } finally {
      setIsDownloading(false);
    }
  }

  if (selectionMode) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleSelect}
        className="flex items-center gap-3 glass rounded-card p-4 cursor-pointer"
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 accent-clay-500 shrink-0"
        />
        <PdfIcon />
        <span className="text-sm font-medium truncate">{doc.label}</span>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="glass rounded-card p-4">
        <form action={formAction} className="flex flex-col gap-2">
          <input type="hidden" name="document_id" value={doc.id} />
          <input type="hidden" name="project_id" value={projectId} />

          <div>
            <label className={labelClass}>Nom</label>
            <input name="label" defaultValue={doc.label} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Catégorie</label>
            <select name="category" defaultValue={doc.category} required className={inputClass}>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Remplacer le fichier (optionnel)</label>
            <input
              name="file"
              type="file"
              accept="application/pdf"
              className={`${inputClass} file:mr-3 file:py-1 file:px-2 file:rounded-chip file:border-0 file:text-xs file:bg-white/65 file:text-ink-700`}
            />
          </div>

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
      </div>
    );
  }

  return (
    <div className="group relative">
      {recentlyAdded && (
        <span
          className="absolute top-3 right-3 z-20 w-2.5 h-2.5 rounded-full bg-clay-500 shadow-[0_0_0_3px_rgba(255,255,255,0.6)] group-hover:opacity-0 transition-opacity"
          title="Récemment ajouté"
        />
      )}

      {editable ? (
        <>
          <a
            href={doc.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 glass rounded-card p-4 hover-lift"
          >
            <PdfIcon />
            <span className="text-sm font-medium truncate">{doc.label}</span>
          </a>

          <div ref={menuRef} className="absolute top-2 right-2 z-20">
            <button
              type="button"
              onClick={(e) => {
                stop(e);
                setMenuOpen((v) => !v);
              }}
              className="w-7 h-7 hidden group-hover:flex items-center justify-center rounded-chip bg-white/85 border border-white/60 text-ink-500 hover:text-ink-900 transition-colors"
              aria-label="Options du document"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div
                className="bg-[var(--paper)] border border-white/60 shadow-[0_20px_45px_-18px_rgba(23,22,26,0.45)] animate-pop-in absolute z-20 top-full right-0 mt-2 w-48 rounded-field overflow-hidden text-[13px]"
                onClick={stop}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    stop(e);
                    setMenuOpen(false);
                    onSelectFromMenu?.(doc);
                  }}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-white/60 transition-colors"
                >
                  Sélectionner
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-white/60 transition-colors border-t border-white/50 disabled:opacity-50"
                >
                  {isDownloading ? "Téléchargement..." : "Télécharger"}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    stop(e);
                    setMenuOpen(false);
                    setIsEditing(true);
                  }}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-white/60 transition-colors border-t border-white/50"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    stop(e);
                    setMenuOpen(false);
                    onDelete?.(doc);
                  }}
                  disabled={isDeleting}
                  className="w-full text-left px-3.5 py-2.5 text-err-600 hover:bg-err-100/70 transition-colors border-t border-white/50 disabled:opacity-50"
                >
                  Supprimer
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={handleClientDownload}
          disabled={isDownloading}
          className="w-full flex items-center gap-3 glass rounded-card p-4 hover-lift text-left disabled:opacity-60 disabled:cursor-wait"
        >
          <PdfIcon />
          <span className="text-sm font-medium truncate">{doc.label}</span>
          <span className="ml-auto text-xs text-ink-400 shrink-0">
            {isDownloading ? "..." : "↓"}
          </span>
        </button>
      )}
    </div>
  );
}
