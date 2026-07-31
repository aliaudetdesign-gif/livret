"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  emptyTrash,
  permanentlyDeleteItem,
  restoreItem,
  type TrashItemType,
} from "@/app/agence/corbeille/actions";
import { formatShortDate } from "@/lib/format";

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
    const confirmed = window.confirm(
      `Supprimer définitivement "${entry.label}" ? Cette action est irréversible.`
    );
    if (!confirmed) return;

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
    });
  }

  function handleEmptyTrash() {
    const confirmed = window.confirm(
      "Vider entièrement la corbeille ? Tous les éléments seront supprimés définitivement."
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      try {
        const result = await emptyTrash();
        if (result.error) setError(result.error);
        else router.refresh();
      } catch {
        setError("Une erreur est survenue, réessaie.");
      }
    });
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
    </div>
  );
}
