"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  updateProjectProgress,
  updateProjectStatus,
} from "@/app/agence/projets/[id]/actions";
import { PROGRESS_STEPS, type ProgressStep, type ProjectStatus } from "@/lib/types";

const STEP_LABELS: Record<(typeof PROGRESS_STEPS)[number], string> = {
  orientation: "Orientation",
  ideation: "Idéation",
  creation: "Création",
  deploiement: "Déploiement",
  fin_de_projet: "Fin de projet",
};

// Mêmes pastilles que sur les ProjectCard (voir badgeStyle dans ProjectCard) :
// uniquement des couleurs de la charte, chacune au-dessus de 4,5:1 sur son fond.
const STATUS_OPTIONS: { value: ProjectStatus; label: string; badgeClass: string }[] = [
  { value: "en_cours", label: "En cours", badgeClass: "bg-clay-100 text-clay-700" },
  {
    value: "attente_validation",
    label: "Attente de validation",
    badgeClass: "bg-warn-100 text-warn-600",
  },
  { value: "livre", label: "Livré", badgeClass: "bg-ok-100 text-ok-600" },
];

// Bascule rapide du statut, utilisée dans le header projet côté agence.
// Une seule pastille est visible à la fois : celle du statut courant. Cliquer
// dessus ouvre un petit menu pour choisir un des trois statuts.
export function StatusToggle({
  projectId,
  status,
}: {
  projectId: string;
  status: ProjectStatus;
}) {
  const [current, setCurrent] = useState(status);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleSelect(next: ProjectStatus) {
    setOpen(false);
    if (next === current || isPending) return;
    const previous = current;
    setError(null);
    setCurrent(next);
    startTransition(async () => {
      const result = await updateProjectStatus(projectId, next);
      if (result.error) {
        setError(result.error);
        setCurrent(previous);
      }
    });
  }

  const currentOption = STATUS_OPTIONS.find((option) => option.value === current)!;

  return (
    <div ref={containerRef} className="relative flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className={`text-[11px] font-semibold rounded-full px-2.5 py-[3.5px] transition-colors cursor-pointer disabled:cursor-wait ${currentOption.badgeClass}`}
      >
        {isPending ? "..." : currentOption.label}
      </button>

      {open && (
        <div className="animate-pop-in absolute top-full right-0 mt-1.5 z-10 bg-ink-900 border border-white/12 rounded-field shadow-[0_20px_40px_-18px_rgba(23,22,26,0.7)] overflow-hidden min-w-[180px]">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full text-left text-xs px-3 py-2 transition-colors ${
                option.value === current
                  ? "text-white font-medium"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* StatusToggle ne vit que dans le header sombre de la fiche projet :
          err-600 y serait illisible, on prend la variante claire. */}
      {error && <p className="text-[11px] text-err-300">{error}</p>}
    </div>
  );
}

// Barre de progression à 5 checkpoints. En mode éditable (agence), chaque
// checkpoint est cliquable pour avancer ou reculer l'étape. En lecture seule
// (client), elle affiche juste l'état courant.
export function ProgressBar({
  projectId,
  progressStep,
  editable = false,
  variant = "dark",
}: {
  projectId: string;
  progressStep: ProgressStep;
  editable?: boolean;
  variant?: "dark" | "light";
}) {
  const [current, setCurrent] = useState<ProgressStep>(progressStep);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSelect(next: ProgressStep) {
    if (!editable || next === current || isPending) return;
    const previous = current;
    setError(null);
    setCurrent(next);
    startTransition(async () => {
      const result = await updateProjectProgress(projectId, next);
      if (result.error) {
        setError(result.error);
        setCurrent(previous);
      }
    });
  }

  const isDark = variant === "dark";
  const lineBase = isDark ? "bg-white/15" : "bg-white/55";
  const dotBase = isDark
    ? "border-white/30 bg-ink-900 text-white/45"
    : "border-white/70 bg-white/80 text-ink-400";
  const dotDone = "border-clay-500 bg-gradient-terracotta text-white";
  const dotCurrent = isDark
    ? "border-white bg-white text-ink-900"
    : "border-clay-500 bg-white text-clay-600";
  const labelBase = isDark ? "text-white/45" : "text-ink-400";
  const labelActive = isDark ? "text-white" : "text-ink-900";
  const errorTone = isDark ? "text-err-300" : "text-err-600";

  return (
    <div className="w-full">
      <div className="relative">
        <div className={`absolute top-3 left-3 right-3 h-0.5 ${lineBase}`} />
        <div
          className="absolute top-3 left-3 h-0.5 bg-gradient-terracotta transition-all duration-300"
          style={{ width: `calc((100% - 1.5rem) * ${current / 4})` }}
        />
        <div className="relative flex justify-between">
          {PROGRESS_STEPS.map((key, index) => {
            const step = index as ProgressStep;
            const done = step < current;
            const isCurrent = step === current;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelect(step)}
                disabled={!editable || isPending}
                className={`flex flex-col items-center gap-2 ${
                  editable ? "cursor-pointer" : "cursor-default"
                } disabled:cursor-wait`}
              >
                <span
                  className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-medium shrink-0 transition-colors ${
                    done ? dotDone : isCurrent ? dotCurrent : dotBase
                  }`}
                >
                  {index + 1}
                </span>
                <span
                  className={`text-[10px] whitespace-nowrap ${
                    step <= current ? labelActive : labelBase
                  }`}
                >
                  {STEP_LABELS[key]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {error && <p className={`text-[11px] mt-2 ${errorTone}`}>{error}</p>}
    </div>
  );
}
