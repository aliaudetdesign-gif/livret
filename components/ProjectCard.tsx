import Link from "next/link";
import { PROGRESS_STEPS, type Project } from "@/lib/types";
import { getProjectColor } from "@/lib/projectColor";
import { formatShortDate } from "@/lib/format";
import { ProjectCardMenu } from "@/components/ProjectCardMenu";

const MAX_PROGRESS_STEP = PROGRESS_STEPS.length - 1;

const badgeStyle = {
  livre: "bg-emerald-100 text-emerald-700",
  attente_validation: "bg-blue-100 text-blue-700",
  en_cours: "bg-amber-100 text-amber-700",
};

// Une seule pastille à la fois, celle qui correspond au statut courant.
export function getBadges(status: Project["status"]) {
  if (status === "attente_validation") {
    return [{ label: "Attente de validation", style: badgeStyle.attente_validation }];
  }
  if (status === "livre") {
    return [{ label: "Livré", style: badgeStyle.livre }];
  }
  return [{ label: "En cours", style: badgeStyle.en_cours }];
}

export function ProjectCard({ project, muted }: { project: Project; muted?: boolean }) {
  const avatarColor = getProjectColor(project.id);
  const badges = getBadges(project.status);
  const accent = project.status === "en_cours" ? "bg-[var(--color-terracotta)]" : "bg-emerald-500";

  return (
    <Link
      href={`/agence/projets/${project.id}`}
      className={`bg-white rounded-lg border p-4 hover-lift ${
        muted
          ? "border-zinc-100 opacity-70"
          : "border-zinc-100 hover:border-[var(--color-terracotta)]"
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-md text-xs flex items-center justify-center font-semibold shrink-0"
          style={{ backgroundColor: avatarColor.background, color: avatarColor.text }}
        >
          {project.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm truncate">{project.name}</div>
          <div className="text-xs text-zinc-500 truncate">
            {project.sector} · {project.city}
          </div>
        </div>
        <ProjectCardMenu project={project} />
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {badges.map((badge) => (
          <span
            key={badge.label}
            className={`text-xs rounded-full px-2 py-0.5 ${badge.style}`}
          >
            {badge.label}
          </span>
        ))}
      </div>

      <div className="h-0.5 rounded-full bg-zinc-100 mb-3 overflow-hidden">
        <div
          className={`h-full rounded-full ${accent}`}
          style={{ width: `${(project.progress_step / MAX_PROGRESS_STEP) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-zinc-400 mb-0.5">
            Début du proj.
          </div>
          <div className="text-xs text-zinc-700">{formatShortDate(project.start_date)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-zinc-400 mb-0.5">
            Fin du proj.
          </div>
          <div className="text-xs text-zinc-700">{formatShortDate(project.end_date)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-zinc-400 mb-0.5">MAJ.</div>
          <div className="text-xs text-zinc-700">{formatShortDate(project.updated_at)}</div>
        </div>
      </div>
    </Link>
  );
}
