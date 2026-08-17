import Link from "next/link";
import { formatShortDate } from "@/lib/format";
import { getProjectColor } from "@/lib/projectColor";
import type { Project } from "@/lib/types";

const COLUMNS: { status: Project["status"]; label: string; badge: string }[] = [
  { status: "en_cours", label: "En cours", badge: "bg-clay-100 text-clay-700" },
  { status: "attente_validation", label: "À valider", badge: "bg-warn-100 text-warn-600" },
  { status: "livre", label: "Livrés", badge: "bg-ok-100 text-ok-600" },
];

export function StatusKanban({ projects }: { projects: Project[] }) {
  return (
    <div className="glass rounded-card p-[19px]">
      <h2 className="text-[12.5px] font-semibold mb-4">Projets par statut</h2>
      <div className="grid grid-cols-3 gap-3.5">
        {COLUMNS.map((col) => {
          const items = projects.filter((p) => p.status === col.status);
          return (
            <div key={col.status}>
              <div
                className={`inline-flex items-center gap-1.5 text-[10.5px] font-semibold rounded-full px-2.5 py-1 mb-3 ${col.badge}`}
              >
                {col.label}
                <span className="opacity-70">{items.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {items.length === 0 ? (
                  <p className="text-[11px] text-ink-400">Aucun projet.</p>
                ) : (
                  items.map((project) => {
                    const avatarColor = getProjectColor(project.id);
                    return (
                      <Link
                        key={project.id}
                        href={`/agence/projets/${project.id}`}
                        className="glass-soft rounded-chip p-2.5 flex items-center gap-2 hover-lift"
                      >
                        <div
                          className="w-6 h-6 rounded-chip text-[9px] flex items-center justify-center font-semibold shrink-0"
                          style={{
                            backgroundColor: avatarColor.background,
                            color: avatarColor.text,
                          }}
                        >
                          {project.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11.5px] font-medium truncate">
                            {project.name}
                          </div>
                          <div className="text-[10px] text-ink-400 truncate">
                            {formatShortDate(project.end_date)}
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
