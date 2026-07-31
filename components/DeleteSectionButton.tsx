"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProjectSection } from "@/app/agence/projets/[id]/actions";

// Bouton de suppression d'une section complémentaire entière (et de tous ses
// fichiers). Utilisé dans le détail d'une section côté agence uniquement.
export function DeleteSectionButton({
  projectId,
  projectSectionId,
  sectionLabel,
}: {
  projectId: string;
  projectSectionId: string;
  sectionLabel: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    const confirmed = window.confirm(
      `Supprimer la section "${sectionLabel}" et tous ses fichiers ? Cette action est irréversible.`
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteProjectSection(projectSectionId, projectId);
        if (result.error) {
          setError(result.error);
          return;
        }
        router.push(`/agence/projets/${projectId}?tab=design`);
      } catch {
        setError("Une erreur est survenue, réessaie.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="text-sm font-medium text-err-600 hover:text-err-600 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isPending ? "Suppression..." : "Supprimer la section"}
      </button>
      {error && <p className="text-xs text-err-600">{error}</p>}
    </div>
  );
}
