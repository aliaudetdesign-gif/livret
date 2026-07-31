import Link from "next/link";
import { Lightbulb, Wrench, Camera, CircleCheckBig, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectSearch } from "@/components/ProjectSearch";

export default async function ProjetsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("projects")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const term = q.trim().replace(/[%,]/g, "");
  if (term) {
    query = query.or(
      `name.ilike.%${term}%,sector.ilike.%${term}%,city.ilike.%${term}%`
    );
  }

  const { data: projects } = await query;

  const activeProjects = (projects ?? []).filter((p) => !p.archived);
  const archivedProjects = (projects ?? []).filter((p) => p.archived);
  const waitingValidation = activeProjects.filter(
    (p) => p.status === "attente_validation"
  ).length;
  const inProgress = activeProjects.filter((p) => p.status === "en_cours").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[27px] font-semibold tracking-[-0.028em]">Projets clients</h1>
          <p className="text-ink-500 text-sm">Visualisez et gérez vos projets</p>
        </div>
        <div className="flex items-center gap-3">
          <ProjectSearch defaultValue={q} />
          <Link
            href="/agence/projets/nouveau"
            className="btn-clay px-4 py-2.5 text-sm font-semibold whitespace-nowrap"
          >
            + Nouveau projet
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-10">
        <StatIconCard icon={Lightbulb} label="Projets actifs" value={activeProjects.length} />
        <StatIconCard icon={Wrench} label="En attente de validation" value={waitingValidation} />
        <StatIconCard icon={Camera} label="Travail en cours" value={inProgress} />
        <StatIconCard icon={CircleCheckBig} label="Total des projets" value={(projects ?? []).length} />
      </div>

      <Section title="Projets actifs" projects={activeProjects} showAddCard />
      <Section title="Archives" projects={archivedProjects} muted />
    </div>
  );
}

function StatIconCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Lightbulb;
  label: string;
  value: number;
}) {
  return (
    <div className="glass rounded-card p-4 flex items-center gap-3 hover-lift">
      <div className="w-10 h-10 shrink-0 rounded-field bg-clay-100 text-clay-700 flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xs text-ink-500 mb-0.5">{label}</div>
        <div className="text-xl font-semibold">{value}</div>
      </div>
    </div>
  );
}

function Section({
  title,
  projects,
  muted = false,
  showAddCard = false,
}: {
  title: string;
  projects: Project[];
  muted?: boolean;
  showAddCard?: boolean;
}) {
  return (
    <div className="mb-10">
      <h2
        className={`text-[10px] font-semibold uppercase tracking-[0.13em] mb-3 ${
          muted ? "text-ink-400/70" : "text-ink-400"
        }`}
      >
        {title}
      </h2>

      {projects.length === 0 && !showAddCard ? (
        <p className="text-sm text-ink-400">Aucun projet pour l&apos;instant.</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} muted={muted} />
          ))}
          {showAddCard && <NewProjectCard />}
        </div>
      )}
    </div>
  );
}

function NewProjectCard() {
  return (
    <Link
      href="/agence/projets/nouveau"
      className="border border-dashed border-white/60 rounded-card p-4 flex flex-col items-center justify-center text-center min-h-[168px] text-ink-400 hover:border-clay-500 hover:text-clay-600 transition-colors"
    >
      <Plus className="w-5 h-5 mb-2" />
      <div className="text-sm font-medium">Nouveau projet</div>
      <div className="text-xs">Créer un espace client</div>
    </Link>
  );
}
