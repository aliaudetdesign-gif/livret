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
          <h1 className="text-2xl font-semibold">Projets clients</h1>
          <p className="text-zinc-500 text-sm">Visualisez et gérez vos projets</p>
        </div>
        <div className="flex items-center gap-3">
          <ProjectSearch defaultValue={q} />
          <Link
            href="/agence/projets/nouveau"
            className="bg-white border border-zinc-200 rounded-md px-4 py-2 text-sm font-medium hover:bg-zinc-50 transition-colors whitespace-nowrap"
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
    <div className="bg-white rounded-lg p-4 border border-zinc-100 flex items-center gap-3 hover-lift">
      <div className="w-10 h-10 shrink-0 rounded-lg bg-[var(--color-terracotta-tint)] text-[var(--color-terracotta-deep)] flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xs text-zinc-500 mb-0.5">{label}</div>
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
        className={`text-xs uppercase tracking-wide mb-3 ${
          muted ? "text-zinc-400" : "text-zinc-500 font-medium"
        }`}
      >
        {title}
      </h2>

      {projects.length === 0 && !showAddCard ? (
        <p className="text-sm text-zinc-400">Aucun projet pour l&apos;instant.</p>
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
      className="border border-dashed border-zinc-200 rounded-lg p-4 flex flex-col items-center justify-center text-center min-h-[168px] text-zinc-400 hover:border-[var(--color-terracotta)] hover:text-[var(--color-terracotta)] transition-colors"
    >
      <Plus className="w-5 h-5 mb-2" />
      <div className="text-sm font-medium">Nouveau projet</div>
      <div className="text-xs">Créer un espace client</div>
    </Link>
  );
}
