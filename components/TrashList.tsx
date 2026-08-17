"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  emptyTrash,
  permanentlyDeleteItem,
  restoreItem,
  type TrashItemType,
} from "@/app/agence/corbeille/actions";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { formatShortDate } from "@/lib/format";
import { TRASH_RETENTION_DAYS } from "@/lib/trash";

// Nombre de jours restants avant suppression définitive automatique d'un
// élément, à partir de sa date de mise à la corbeille.
function daysUntilPurge(deletedAt: string): number {
  const purgeDate = new Date(deletedAt).getTime() + TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const diff = purgeDate - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

function purgeLabel(deletedAt: string): string {
  const days = daysUntilPurge(deletedAt);
  if (days <= 0) return "Suppression définitive imminente";
  if (days === 1) return "Suppression définitive dans 1 jour";
  return `Suppression définitive dans ${days} jours`;
}

export type TrashEntry = {
  type: TrashItemType;
  id: string;
  label: string;
  typeLabel: string;
  deletedAt: string;
  projectId: string | null;
  projectName: string;
};

export function TrashList({ entries }: { entries: TrashEntry[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    { type: "single"; entry: TrashEntry } | { type: "empty" } | null
  >(null);

  function handleRestore(entry: TrashEntry) {
    setError(null);
    setPendingId(entry.id);
    startTransition(async () => {
      try {
        const result = await restoreItem(entry.type, entry.id);
        if (result.error) setError(result.error);
        else router.refresh();
      } catch {
        setError("Une erreur est survenue, réessaie.");
      } finally {
        setPendingId(null);
      }
    });
  }

  function handlePermanentDelete(entry: TrashEntry) {
    setConfirmAction({ type: "single", entry });
  }

  function handleEmptyTrash() {
    setConfirmAction({ type: "empty" });
  }

  function runConfirmedAction() {
    if (!confirmAction) return;

    if (confirmAction.type === "single") {
      const entry = confirmAction.entry;
      setError(null);
      setPendingId(entry.id);
      startTransition(async () => {
        try {
          const result = await permanentlyDeleteItem(entry.type, entry.id);
          if (result.error) setError(result.error);
          else router.refresh();
        } catch {
          setError("Une erreur est survenue, réessaie.");
        } finally {
          setPendingId(null);
        }
        setConfirmAction(null);
      });
    } else {
      setError(null);
      startTransition(async () => {
        try {
          const result = await emptyTrash();
          if (result.error) setError(result.error);
          else router.refresh();
        } catch {
          setError("Une erreur est survenue, réessaie.");
        }
        setConfirmAction(null);
      });
    }
  }

  if (entries.length === 0) {
    return <p className="text-sm text-ink-400">La corbeille est vide.</p>;
  }

  const groups = new Map<string, TrashEntry[]>();
  for (const entry of entries) {
    const key = entry.projectName;
    const list = groups.get(key) ?? [];
    list.push(entry);
    groups.set(key, list);
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={handleEmptyTrash}
          disabled={isPending}
          className="text-sm font-medium text-err-600 hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
        >
          Vider la corbeille
        </button>
      </div>

      {error && (
        <p className="text-sm text-err-600 bg-err-100 border border-err-600/15 rounded-field px-3.5 py-2.5 mb-4">{error}</p>
      )}

      <div className="flex flex-col gap-6">
        {Array.from(groups.entries()).map(([projectName, items]) => (
          <div key={projectName}>
            <p className="text-sm font-medium mb-3">{projectName}</p>
            <ul className="flex flex-col gap-2">
              {items.map((entry) => (
                <li
                  key={`${entry.type}-${entry.id}`}
                  className="flex items-center justify-between gap-3 glass rounded-card px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{entry.label}</div>
                    <div className="text-xs text-ink-400">
                      {entry.typeLabel} · Supprimé le {formatShortDate(entry.deletedAt)}
                    </div>
                    <div className="text-xs text-err-600 mt-0.5">{purgeLabel(entry.deletedAt)}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRestore(entry)}
                      disabled={isPending && pendingId === entry.id}
                      className="text-sm font-medium text-clay-700 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Restaurer
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePermanentDelete(entry)}
                      disabled={isPending && pendingId === entry.id}
                      className="text-sm font-medium text-err-600 hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
                    >
                      Supprimer
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        title={
          confirmAction?.type === "empty"
            ? "Vider entièrement la corbeille ?"
            : confirmAction?.type === "single"
              ? `Supprimer définitivement "${confirmAction.entry.label}" ?`
              : ""
        }
        message={
          confirmAction?.type === "empty"
            ? "Tous les éléments seront supprimés définitivement."
            : "Cette action est irréversible."
        }
        pending={isPending}
        onConfirm={runConfirmedAction}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
