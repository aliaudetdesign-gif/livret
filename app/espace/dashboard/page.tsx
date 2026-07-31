import { createClient } from "@/lib/supabase/server";
import { getClientProject } from "@/lib/getClientProject";
import { getBadges } from "@/components/ProjectCard";
import { ProgressBar } from "@/components/ProjectProgressControls";

export default async function EspaceDashboardPage() {
  const project = await getClientProject();

  if (!project) {
    return (
      <p className="text-sm text-ink-500">
        Aucun projet rattaché à ton compte pour l&apos;instant.
      </p>
    );
  }

  const supabase = await createClient();
  const { data: assets } = await supabase
    .from("brand_assets")
    .select("type")
    .eq("project_id", project.id)
    .is("deleted_at", null);

  const count = (type: string) =>
    (assets ?? []).filter((a) => a.type === type).length;

  return (
    <div>
      <div className="relative overflow-hidden bg-ink-900 text-white rounded-panel p-9 mb-3.5 shadow-[0_28px_60px_-28px_rgba(23,22,26,0.55)]">
        <div
          className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-clay-500 opacity-40 blur-[90px] pointer-events-none"
          aria-hidden
        />
        <div className="relative">
          <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-clay-400 mb-2.5">
            Identité de marque
          </div>
          <h1 className="text-[34px] font-semibold tracking-[-0.035em] leading-none mb-3">
            {project.name}
          </h1>
          <div className="flex gap-10 text-sm text-white/75 border-t border-white/10 pt-4 mt-5">
          <div>
            <div className="text-white/45 text-[11px] uppercase tracking-[0.09em] font-semibold mb-1">
              Secteur
            </div>
            {project.sector}
          </div>
          <div>
            <div className="text-white/45 text-[11px] uppercase tracking-[0.09em] font-semibold mb-1">
              Statut
            </div>
            <div className="flex gap-1 flex-wrap">
              {getBadges(project.status).map((badge) => (
                <span
                  key={badge.label}
                  className={`text-[11px] font-semibold rounded-full px-2.5 py-[3.5px] ${badge.style}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10">
            <ProgressBar
              projectId={project.id}
              progressStep={project.progress_step}
              variant="dark"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3.5">
        <StatCard label="Logos" value={count("logo")} />
        <StatCard label="Couleurs" value={count("couleur")} />
        <StatCard label="Typographies" value={count("typographie")} />
        <StatCard label="Visuels & Moodboard" value={count("moodboard")} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass rounded-card p-[19px]">
      <div className="text-[12.5px] font-medium text-ink-700 mb-2.5">{label}</div>
      <div className="text-[28px] font-semibold tracking-[-0.04em] leading-none">{value}</div>
    </div>
  );
}
