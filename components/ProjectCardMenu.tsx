"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";
import { deleteProject, updateProjectStatus } from "@/app/agence/projets/[id]/actions";
import { toggleArchiveProject } from "@/app/agence/messagerie/actions";
import type { Project, ProjectStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "en_cours", label: "En cours" },
  { value: "attente_validation", label: "Attente de validation" },
  { value: "livre", label: "Livré" },
];

// Menu ⋮ sur les cartes projet (agence) : archiver, changer le statut,
// déplacer dans la corbeille. La carte entière est un <Link> (voir
// ProjectCard) : chaque interaction ici stoppe la propagation du clic pour
// ne pas déclencher la navigation vers la fiche projet.
export function ProjectCardMenu({ project }: { project: Project }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointer(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
        setStatusOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [open]);

  function stop(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleArchive(e: React.MouseEvent) {
    stop(e);
    setOpen(false);
    startTransition(async () => {
      await toggleArchiveProject(project.id, !project.archived);
      router.refresh();
    });
  }

  function handleStatus(e: React.MouseEvent, status: ProjectStatus) {
    stop(e);
    setStatusOpen(false);
    setOpen(false);
    if (status === project.status) return;
    startTransition(async () => {
      const result = await updateProjectStatus(project.id, status);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  function handleDelete(e: React.MouseEvent) {
    stop(e);
    setOpen(false);
    const confirmed = window.confirm(
      `Déplacer "${project.name}" dans la corbeille ? Il restera récupérable depuis la Corbeille.`
    );
    if (!confirmed) return;
    startTransition(async () => {
      const result = await deleteProject(project.id);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          setOpen((v) => !v);
          setStatusOpen(false);
        }}
        disabled={isPending}
        className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors disabled:opacity-50"
        aria-label="Options du projet"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div
          className="absolute z-20 top-full right-0 mt-1 w-52 bg-white border border-zinc-200 rounded-lg shadow-lg overflow-hidden text-sm"
          onClick={stop}
        >
          <button
            type="button"
            onClick={handleArchive}
            className="w-full text-left px-3 py-2 hover:bg-zinc-50 transition-colors"
          >
            {project.archived ? "Désarchiver" : "Archiver"}
          </button>

          <div className="border-t border-zinc-100">
            <button
              type="button"
              onClick={(e) => {
                stop(e);
                setStatusOpen((v) => !v);
              }}
              className="w-full text-left px-3 py-2 hover:bg-zinc-50 transition-colors"
            >
              Changer le statut
            </button>
            {statusOpen && (
              <div className="border-t border-zinc-100 bg-zinc-50/50">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={(e) => handleStatus(e, option.value)}
                    className={`w-full text-left px-5 py-2 text-xs hover:bg-zinc-100 transition-colors ${
                      option.value === project.status
                        ? "font-medium text-[var(--color-terracotta-deep)]"
                        : "text-zinc-600"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleDelete}
            className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 transition-colors border-t border-zinc-100"
          >
            Supprimer
          </button>
        </div>
      )}

      {error && (
        <p className="absolute z-20 top-full right-0 mt-1 w-52 text-[11px] text-red-600 bg-red-50 rounded-md px-2 py-1">
          {error}
        </p>
      )}
    </div>
  );
}
