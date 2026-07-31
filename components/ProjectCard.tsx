import Link from "next/link";
import { PROGRESS_STEPS, type Project } from "@/lib/types";
import { getProjectColor } from "@/lib/projectColor";
import { formatShortDate } from "@/lib/format";
import { ProjectCardMenu } from "@/components/ProjectCardMenu";

const MAX_PROGRESS_STEP = PROGRESS_STEPS.length - 1;

// Pastilles de statut : uniquement des couleurs de la charte, chacune vérifiée
// au-dessus de 4,5:1 sur son propre fond teinté.
const badgeStyle = {
  livre: "bg-ok-100 text-ok-600",
  attente_validation: "bg-warn-100 text-warn-600",
  en_cours: "bg-clay-100 text-clay-700",
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
  const accent =
    project.status === "en_cours" ? "bg-gradient-terracotta" : "bg-ok-600";

  return (
    <Link
      href={`/agence/projets/${project.id}`}
      className={`glass rounded-card p-[19px] ${
        muted ? "opacity-70" : "hover-lift"
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-chip text-xs flex items-center justify-center font-semibold shrink-0"
          style={{ backgroundColor: avatarColor.background, color: avatarColor.text }}
        >
          {project.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[13.5px] truncate">{project.name}</div>
          <div className="text-xs text-ink-500 truncate">
            {project.sector} · {project.city}
          </div>
        </div>
        <ProjectCardMenu project={project} />
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {badges.map((badge) => (
          <span
            key={badge.label}
            className={`text-[11px] font-semibold rounded-full px-2.5 py-[3.5px] ${badge.style}`}
          >
            {badge.label}
          </span>
        ))}
      </div>

      <div className="h-1 rounded-full bg-white/55 mb-3.5 overflow-hidden">
        <div
          className={`h-full rounded-full ${accent}`}
          style={{ width: `${(project.progress_step / MAX_PROGRESS_STEP) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <div className="text-[9.5px] uppercase tracking-[0.09em] font-semibold text-ink-400 mb-1">
            Début du proj.
          </div>
          <div className="text-xs text-ink-700">{formatShortDate(project.start_date)}</div>
        </div>
        <div>
          <div className="text-[9.5px] uppercase tracking-[0.09em] font-semibold text-ink-400 mb-1">
            Fin du proj.
          </div>
          <div className="text-xs text-ink-700">{formatShortDate(project.end_date)}</div>
        </div>
        <div>
          <div className="text-[9.5px] uppercase tracking-[0.09em] font-semibold text-ink-400 mb-1">
            MAJ.
          </div>
          <div className="text-xs text-ink-700">{formatShortDate(project.updated_at)}</div>
        </div>
      </div>
    </Link>
  );
}
