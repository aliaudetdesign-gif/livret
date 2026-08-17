import Link from "next/link";
import { getProjectColor } from "@/lib/projectColor";
import { getBadges } from "@/components/ProjectCard";
import type { Project } from "@/lib/types";

// Liste compacte des projets les plus récents (au lieu d'une seule grosse
// carte pour un unique projet, qui occupait toute la hauteur du widget pour
// rien dès qu'il n'y en avait qu'un). `projects` est déjà trié du plus
// récent au plus ancien et tronqué côté page (voir app/agence/dashboard/page.tsx).
export function RecentProjectQuickAccess({ projects }: { projects: Project[] }) {
  return (
    <div className="glass rounded-card p-[19px] h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[12.5px] font-semibold">Accès rapide</h2>
        {projects.length > 0 && (
          <Link href="/agence/projets" className="text-xs font-medium text-clay-600 hover:underline">
            Voir tout
          </Link>
        )}
      </div>
      {projects.length === 0 ? (
        <p className="text-xs text-ink-400">Aucun projet actif.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {projects.map((project) => (
            <li key={project.id}>
              <ProjectQuickAccessRow project={project} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProjectQuickAccessRow({ project }: { project: Project }) {
  const avatarColor = getProjectColor(project.id);
  const badge = getBadges(project.status)[0];

  return (
    <Link
      href={`/agence/projets/${project.id}`}
      className="hover-lift flex items-center gap-2.5 -m-1 p-1 rounded-chip"
    >
      <div
        className="w-7 h-7 rounded-chip text-[10px] flex items-center justify-center font-semibold shrink-0"
        style={{ backgroundColor: avatarColor.background, color: avatarColor.text }}
      >
        {project.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-ink-900 truncate">{project.name}</div>
        <div className="text-[10.5px] text-ink-400 truncate">{project.city}</div>
      </div>
      <span
        className={`shrink-0 text-[10px] font-semibold rounded-full px-2 py-[3px] ${badge.style}`}
      >
        {badge.label}
      </span>
    </Link>
  );
}
