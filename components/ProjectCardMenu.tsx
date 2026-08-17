"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";
import { deleteProject, updateProjectStatus } from "@/app/agence/projets/[id]/actions";
import { toggleArchiveProject } from "@/app/agence/messagerie/actions";
import { ConfirmDialog } from "@/components/ConfirmDialog";
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
  const [confirmOpen, setConfirmOpen] = useState(false);
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
    setConfirmOpen(true);
  }

  function runDelete() {
    startTransition(async () => {
      const result = await deleteProject(project.id);
      if (result.error) setError(result.error);
      else router.refresh();
      setConfirmOpen(false);
    });
  }

  return (
    // onClick={stop} au niveau racine : le composant est imbriqué dans le
    // <Link> de ProjectCard (voir ProjectCard.tsx), et ConfirmDialog rend son
    // fond en position fixed mais reste un descendant DOM de ce conteneur.
    // Sans ce blocage, cliquer sur le fond du ConfirmDialog (pour annuler)
    // remonterait jusqu'au Link et déclencherait une navigation indésirable.
    <div ref={ref} className="relative shrink-0" onClick={stop}>
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          // Focus explicite : nécessaire pour que `focus-within` sur la carte
          // (voir ProjectCard) se déclenche de façon fiable, Safari ne
          // donnant pas le focus aux boutons au clic par défaut. C'est ce qui
          // fait passer la carte devant ses voisines le temps que le menu
          // soit ouvert (sans quoi la carte suivante, elle aussi `.glass`
          // donc son propre contexte d'empilement, se réaffiche par-dessus).
          e.currentTarget.focus();
          setOpen((v) => !v);
          setStatusOpen(false);
        }}
        disabled={isPending}
        className="w-7 h-7 rounded-chip flex items-center justify-center text-ink-400 hover:text-ink-900 hover:bg-white/70 transition-colors disabled:opacity-50"
        aria-label="Options du projet"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div
          className="bg-[var(--paper)] border border-white/60 shadow-[0_20px_45px_-18px_rgba(23,22,26,0.45)] animate-pop-in absolute z-20 top-full right-0 mt-2 w-52 rounded-field overflow-hidden text-[13px]"
          onClick={stop}
        >
          <button
            type="button"
            onClick={handleArchive}
            className="w-full text-left px-3.5 py-2.5 hover:bg-white/60 transition-colors"
          >
            {project.archived ? "Désarchiver" : "Archiver"}
          </button>

          <div className="border-t border-white/50">
            <button
              type="button"
              onClick={(e) => {
                stop(e);
                setStatusOpen((v) => !v);
              }}
              className="w-full text-left px-3.5 py-2.5 hover:bg-white/60 transition-colors"
            >
              Changer le statut
            </button>
            {statusOpen && (
              <div className="animate-fade-in border-t border-white/50 bg-white/30">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={(e) => handleStatus(e, option.value)}
                    className={`w-full text-left px-5 py-2 text-xs hover:bg-white/60 transition-colors ${
                      option.value === project.status
                        ? "font-semibold text-clay-600"
                        : "text-ink-700"
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
            className="w-full text-left px-3.5 py-2.5 text-err-600 hover:bg-err-100/70 transition-colors border-t border-white/50"
          >
            Supprimer
          </button>
        </div>
      )}

      {error && (
        <p className="absolute z-20 top-full right-0 mt-2 w-52 text-[11px] text-err-600 bg-err-100 rounded-chip px-2.5 py-1.5">
          {error}
        </p>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={`Déplacer "${project.name}" dans la corbeille ?`}
        message="Le projet restera récupérable depuis la Corbeille."
        pending={isPending}
        onConfirm={runDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
