import { createClient } from "@/lib/supabase/server";
import { getClientProject } from "@/lib/getClientProject";
import { getBadges } from "@/components/ProjectCard";
import { ProgressBar } from "@/components/ProjectProgressControls";

export default async function EspaceDashboardPage() {
  const project = await getClientProject();

  if (!project) {
    return (
      <p className="text-sm text-zinc-500">
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
      <div className="bg-[var(--color-noir-doux)] text-white rounded-xl p-8 mb-6">
        <div className="text-xs uppercase tracking-wide text-[var(--color-terracotta)] mb-2">
          Identité de marque
        </div>
        <h1 className="text-3xl font-serif mb-3">{project.name}</h1>
        <div className="flex gap-8 text-sm text-white/70 border-t border-white/10 pt-4 mt-4">
          <div>
            <div className="text-white/40 text-xs">Secteur</div>
            {project.sector}
          </div>
          <div>
            <div className="text-white/40 text-xs mb-1">Statut</div>
            <div className="flex gap-1 flex-wrap">
              {getBadges(project.status).map((badge) => (
                <span
                  key={badge.label}
                  className={`text-xs rounded-full px-2 py-0.5 ${badge.style}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10">
          <ProgressBar projectId={project.id} progressStep={project.progress_step} variant="dark" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
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
    <div className="bg-white rounded-lg p-4 border border-zinc-100">
      <div className="text-xs text-zinc-500 mb-1">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
