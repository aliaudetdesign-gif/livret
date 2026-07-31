import Link from "next/link";
import {
  ArrowUp,
  ArrowUpRight,
  FileText,
  MessageCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProjectColor } from "@/lib/projectColor";
import { ProjectCard } from "@/components/ProjectCard";
import { DashboardCalendar } from "@/components/DashboardCalendar";
import { formatRelativeDate, formatWeekdayDate } from "@/lib/format";

export default async function AgenceDashboardPage() {
  const supabase = await createClient();

  const [{ data: projects }, { data: recentAssets }, { data: recentMessages }, { data: clientProfiles }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("brand_assets")
        .select("*, projects(id, name)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("messages")
        .select("*, projects(id, name)")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("profiles").select("id, created_at").eq("role", "client"),
    ]);

  const allProjects = projects ?? [];
  const activeProjects = allProjects.filter((p) => !p.archived);
  const clients = clientProfiles ?? [];

  const since = new Date();
  since.setDate(since.getDate() - 7);
  const sinceIso = since.toISOString();

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const since30Iso = since30.toISOString();

  const trendProjetsActifs = activeProjects.filter((p) => p.created_at >= sinceIso).length;
  const trendProjetsTotaux = allProjects.filter((p) => p.created_at >= sinceIso).length;
  const trendClientsTotaux = clients.filter((c) => c.created_at >= sinceIso).length;
  const nouveauxClients30j = clients.filter((c) => c.created_at >= since30Iso).length;

  type Activity = {
    id: string;
    type: "asset" | "message";
    title: string;
    projectName: string;
    projectId: string | null;
    createdAt: string;
  };

  const assetActivities: Activity[] = (recentAssets ?? []).map((asset) => ({
    id: `asset-${asset.id}`,
    type: "asset",
    title: `Téléchargement de ${asset.label}`,
    projectName: asset.projects?.name ?? "Projet supprimé",
    projectId: asset.projects?.id ?? null,
    createdAt: asset.created_at,
  }));

  const messageActivities: Activity[] = (recentMessages ?? []).slice(0, 5).map((message) => ({
    id: `message-${message.id}`,
    type: "message",
    title: `Nouveau message de ${message.projects?.name ?? "un client"}`,
    projectName: message.projects?.name ?? "Projet supprimé",
    projectId: message.projects?.id ?? null,
    createdAt: message.created_at,
  }));

  const activities = [...assetActivities, ...messageActivities]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 4);

  const todayIso = new Date().toISOString().slice(0, 10);
  const upcomingDeadlines = activeProjects
    .filter((p) => p.end_date && p.end_date >= todayIso)
    .sort((a, b) => (a.end_date! < b.end_date! ? -1 : 1))
    .slice(0, 2);

  const seenProjects = new Set<string>();
  const messagePreview = (recentMessages ?? [])
    .filter((m) => {
      if (!m.projects?.id || seenProjects.has(m.projects.id)) return false;
      seenProjects.add(m.projects.id);
      return true;
    })
    .slice(0, 4);

  return (
    <div>
      <div className="mb-[22px] px-1">
        <h1 className="text-[27px] font-semibold tracking-[-0.028em]">Dashboard</h1>
        <p className="text-ink-500 text-[13.5px] mt-0.5">
          Gérez, visualisez et personnalisez votre aperçu global
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3.5 mb-3.5">
        <StatTrendCard
          label="Projets actifs"
          value={activeProjects.length}
          trend={trendProjetsActifs}
          href="/agence/projets"
        />
        <StatTrendCard
          label="Clients totaux"
          value={clients.length}
          trend={trendClientsTotaux}
          href="/agence/projets"
        />
        <StatTrendCard
          label="Projets totaux"
          value={allProjects.length}
          trend={trendProjetsTotaux}
          href="/agence/projets"
        />
        <StatTrendCard
          label="Nouveaux clients (30j)"
          value={nouveauxClients30j}
          trend={0}
          href="/agence/projets"
        />
      </div>

      <div className="grid grid-cols-4 gap-3.5 mb-[26px]">
        <div className="col-span-2">
          <DashboardCalendar />
        </div>

        <div className="glass rounded-card p-[19px] h-full">
          <h2 className="text-[12.5px] font-semibold mb-4">Dernières activités</h2>
          {activities.length === 0 ? (
            <p className="text-xs text-ink-400">Aucune activité pour l&apos;instant.</p>
          ) : (
            <ul className="flex flex-col gap-3.5">
              {activities.map((activity) => (
                <li key={activity.id} className="flex items-start gap-2.5">
                  <div className="w-[29px] h-[29px] rounded-chip bg-white/65 border border-white/60 text-ink-500 flex items-center justify-center shrink-0 mt-0.5">
                    {activity.type === "asset" ? (
                      <FileText className="w-[13px] h-[13px]" strokeWidth={1.8} />
                    ) : (
                      <MessageCircle className="w-[13px] h-[13px]" strokeWidth={1.8} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-ink-700 leading-[1.4]">
                      {activity.title}
                    </div>
                    {activity.type === "asset" && activity.projectId && (
                      <Link
                        href={`/agence/projets/${activity.projectId}`}
                        className="text-[11px] text-ink-400 hover:text-clay-600"
                      >
                        chez {activity.projectName}
                      </Link>
                    )}
                    <div className="text-[10px] text-ink-400/80 mt-0.5">
                      {formatRelativeDate(activity.createdAt)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="glass rounded-card p-[19px]">
            <h2 className="text-[12.5px] font-semibold mb-3">Échéances proches</h2>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-ink-400">Aucune échéance à venir.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {upcomingDeadlines.map((project) => (
                  <div key={project.id}>
                    <div className="text-sm font-semibold">{project.name}</div>
                    <div className="text-xs text-ink-500 mb-2">Fin de projet</div>
                    <Link
                      href={`/agence/projets/${project.id}`}
                      className="btn-clay block text-xs font-semibold px-3 py-2 text-center"
                    >
                      {formatWeekdayDate(project.end_date)}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-card p-[19px] flex-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[12.5px] font-semibold">Messagerie</h2>
              <Link
                href="/agence/messagerie"
                className="text-xs font-medium text-clay-600 hover:underline"
              >
                + Nouveau
              </Link>
            </div>
            {messagePreview.length === 0 ? (
              <p className="text-xs text-ink-400">Aucun message pour l&apos;instant.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {messagePreview.map((message) => {
                  const projectId = message.projects?.id;
                  const avatarColor = getProjectColor(projectId ?? message.id);
                  return (
                    <li key={message.id}>
                      <Link
                        href={projectId ? `/agence/messagerie/${projectId}` : "/agence/messagerie"}
                        className="flex items-start gap-2.5"
                      >
                        <div
                          className="w-7 h-7 rounded-full text-[10px] flex items-center justify-center font-semibold shrink-0"
                          style={{
                            backgroundColor: avatarColor.background,
                            color: avatarColor.text,
                          }}
                        >
                          {(message.projects?.name ?? "??").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium truncate">
                            {message.projects?.name ?? "Client"}
                          </div>
                          <div className="text-[11px] text-ink-400 truncate">
                            {message.content}
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-[10px] uppercase tracking-[0.13em] text-ink-400 font-medium mb-3 px-1">
          Projets actifs
        </h2>
        {activeProjects.length === 0 ? (
          <p className="text-sm text-ink-400">
            Aucun projet pour l&apos;instant. Crée ton premier projet client pour
            voir cette section se remplir.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3.5">
            {activeProjects.slice(0, 3).map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatTrendCard({
  label,
  value,
  trend,
  href,
}: {
  label: string;
  value: number;
  trend: number;
  href: string;
}) {
  return (
    <Link href={href} className="glass hover-lift rounded-card p-[19px] block">
      <div className="flex items-start justify-between mb-[22px]">
        <div className="text-[12.5px] font-medium text-ink-700 max-w-[110px] leading-[1.35]">
          {label}
        </div>
        <div className="w-7 h-7 rounded-full bg-ink-900/90 text-white flex items-center justify-center shrink-0">
          <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
        </div>
      </div>
      <div className="text-[34px] font-semibold tracking-[-0.04em] leading-none mb-[11px]">
        {value}
      </div>
      {trend > 0 && (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ok-600 bg-ok-100 rounded-full px-2.5 py-[3.5px]">
          <ArrowUp className="w-[11px] h-[11px]" strokeWidth={2.4} />
          {trend}
        </span>
      )}
    </Link>
  );
}
