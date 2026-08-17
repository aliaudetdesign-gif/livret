"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { MoreVertical } from "lucide-react";
import {
  deleteProjectSection,
  deleteProjectSections,
  updateSectionType,
} from "@/app/agence/projets/[id]/actions";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { ReactNode } from "react";

const inputClass =
  "px-3 py-2 text-sm bg-white/70 border border-white/60 rounded-field focus:outline-none focus:border-clay-500 focus:bg-white/90 transition-colors";

export interface DesignCardData {
  key: string;
  label: string;
  icon: string;
  count: number;
  // Id du section_type sous-jacent (bibliothèque partagée), nécessaire pour
  // l'édition icône/titre. Absent pour les cartes Essentiel (non éditables).
  sectionTypeId?: string;
}

function DesignCard({ card, href }: { card: DesignCardData; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 glass rounded-card p-4 hover-lift"
    >
      <span className="text-2xl leading-none">{card.icon}</span>
      <span>
        <span className="block text-xs text-ink-500">{card.label}</span>
        <span className="block text-xl font-semibold">{card.count}</span>
      </span>
    </Link>
  );
}

// Carte d'une section complémentaire côté agence : menu ⋮ (sélectionner /
// modifier / supprimer) au survol, sur le modèle de SectionAssetCard. En mode
// sélection, la carte devient une case à cocher plutôt qu'un lien. "Modifier"
// bascule la carte en formulaire inline (icône + titre).
function ComplementCard({
  card,
  href,
  projectId,
  selectionMode,
  selected,
  onToggleSelect,
  onSelectFromMenu,
  onDelete,
  isDeleting,
}: {
  card: DesignCardData;
  href: string;
  projectId: string;
  selectionMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onSelectFromMenu: (card: DesignCardData) => void;
  onDelete: (card: DesignCardData) => void;
  isDeleting: boolean;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [labelValue, setLabelValue] = useState(card.label);
  const [iconValue, setIconValue] = useState(card.icon);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

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

  function startEditing() {
    setLabelValue(card.label);
    setIconValue(card.icon);
    setEditError(null);
    setEditing(true);
  }

  function saveEdit() {
    if (!card.sectionTypeId) return;
    setEditError(null);
    startSaving(async () => {
      const result = await updateSectionType(card.sectionTypeId!, labelValue, iconValue, projectId);
      if (result.error) {
        setEditError(result.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <div className="col-span-1 glass rounded-card p-4 flex flex-col gap-2.5">
        <div className="flex gap-2">
          <input
            value={iconValue}
            onChange={(e) => setIconValue(e.target.value)}
            maxLength={4}
            className={`${inputClass} w-14 text-center`}
          />
          <input
            value={labelValue}
            onChange={(e) => setLabelValue(e.target.value)}
            className={`${inputClass} flex-1`}
          />
        </div>
        {editError && (
          <p className="text-xs text-err-600 bg-err-100 border border-err-600/15 rounded-field px-2.5 py-2">{editError}</p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={saveEdit}
            disabled={isSaving || !labelValue.trim()}
            className="btn-clay text-xs font-semibold px-3 py-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={isSaving}
            className="text-xs text-ink-500 px-3 py-1.5"
          >
            Annuler
          </button>
        </div>
      </div>
    );
  }

  if (selectionMode) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleSelect}
        className="relative flex items-center gap-3 glass rounded-card p-4 cursor-pointer"
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-3 left-3 z-10 w-4 h-4 accent-clay-500"
        />
        <span className="text-2xl leading-none ml-6">{card.icon}</span>
        <span>
          <span className="block text-xs text-ink-500">{card.label}</span>
          <span className="block text-xl font-semibold">{card.count}</span>
        </span>
      </div>
    );
  }

  return (
    <div className="group relative">
      <Link href={href} className="flex items-center gap-3 glass rounded-card p-4 hover-lift">
        <span className="text-2xl leading-none">{card.icon}</span>
        <span>
          <span className="block text-xs text-ink-500">{card.label}</span>
          <span className="block text-xl font-semibold">{card.count}</span>
        </span>
      </Link>

      <div ref={menuRef} className="absolute top-2 right-2 z-20">
        <button
          type="button"
          onClick={(e) => {
            stop(e);
            setMenuOpen((v) => !v);
          }}
          className="w-7 h-7 hidden group-hover:flex items-center justify-center rounded-chip bg-white/85 border border-white/60 text-ink-500 hover:text-ink-900 transition-colors"
          aria-label="Options de la section"
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
                onSelectFromMenu(card);
              }}
              className="w-full text-left px-3.5 py-2.5 hover:bg-white/60 transition-colors"
            >
              Sélectionner
            </button>
            {card.sectionTypeId && (
              <button
                type="button"
                onClick={(e) => {
                  stop(e);
                  setMenuOpen(false);
                  startEditing();
                }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-white/60 transition-colors border-t border-white/50"
              >
                Modifier
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                stop(e);
                setMenuOpen(false);
                onDelete(card);
              }}
              disabled={isDeleting}
              className="w-full text-left px-3.5 py-2.5 text-err-600 hover:bg-err-100/70 transition-colors border-t border-white/50 disabled:opacity-50"
            >
              Supprimer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function DesignGrid({
  essentiel,
  complements,
  sectionHrefTemplate,
  addSectionSlot,
  projectId,
}: {
  essentiel: DesignCardData[];
  complements: DesignCardData[];
  // Gabarit d'URL avec un placeholder "{key}" : une simple chaîne, pas une
  // fonction, car DesignGrid est un composant client et une fonction ne peut
  // pas traverser la frontière serveur -> client depuis la page qui l'appelle.
  sectionHrefTemplate: string;
  addSectionSlot?: ReactNode;
  projectId?: string;
}) {
  const editable = !!projectId;
  const sectionHref = (key: string) => sectionHrefTemplate.replace("{key}", key);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<
    { type: "single"; card: DesignCardData } | { type: "bulk" } | null
  >(null);

  function handleSelectFromMenu(card: DesignCardData) {
    setSelectionMode(true);
    setSelected(new Set([card.key]));
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

  function handleDelete(card: DesignCardData) {
    if (!projectId) return;
    setConfirmDelete({ type: "single", card });
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
          const result = await deleteProjectSection(confirmDelete.card.key, projectId);
          if (result.error) setError(result.error);
        } else {
          const result = await deleteProjectSections(Array.from(selected), projectId);
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-400 mb-3">Essentiel</p>
        <div className="grid grid-cols-4 gap-4">
          {essentiel.map((card) => (
            <DesignCard key={card.key} card={card} href={sectionHref(card.key)} />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-400">Compléments</p>
          {editable && complements.length > 0 && selectionMode && (
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={selected.size === 0 || isPending}
                className="text-xs font-medium text-err-600 hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
              >
                {isPending ? "Suppression..." : `Supprimer (${selected.size})`}
              </button>
              <button
                type="button"
                onClick={exitSelectionMode}
                className="text-xs font-medium text-ink-500 hover:text-clay-600"
              >
                Annuler
              </button>
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-err-600 bg-err-100 border border-err-600/15 rounded-field px-3.5 py-2.5 mb-3">{error}</p>
        )}

        <div className="grid grid-cols-4 gap-4 items-start">
          {complements.map((card) =>
            editable ? (
              <ComplementCard
                key={card.key}
                card={card}
                href={sectionHref(card.key)}
                projectId={projectId as string}
                selectionMode={selectionMode}
                selected={selected.has(card.key)}
                onToggleSelect={() => toggleSelect(card.key)}
                onSelectFromMenu={handleSelectFromMenu}
                onDelete={handleDelete}
                isDeleting={isPending}
              />
            ) : (
              <DesignCard key={card.key} card={card} href={sectionHref(card.key)} />
            )
          )}
          {!selectionMode && addSectionSlot}
        </div>
        {complements.length === 0 && !addSectionSlot && (
          <p className="text-sm text-ink-400 mt-1">Aucune section complémentaire pour l&apos;instant.</p>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title={
          confirmDelete?.type === "bulk"
            ? `Supprimer ${selected.size} section${selected.size > 1 ? "s" : ""} ?`
            : confirmDelete?.type === "single"
              ? `Supprimer "${confirmDelete.card.label}" ?`
              : ""
        }
        message="La section et ses fichiers associés seront déplacés vers la Corbeille, récupérables en cas d'erreur."
        pending={isPending}
        onConfirm={runConfirmedDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
