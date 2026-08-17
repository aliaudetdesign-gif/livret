import { createClient } from "@/lib/supabase/server";
import { ProjectCard } from "@/components/ProjectCard";
import { DashboardOverview, type DashboardStat } from "@/components/dashboard/DashboardOverview";
import type { DashboardActivity, DashboardData } from "@/components/dashboard/types";
import { getDemoScope } from "@/lib/demoMode";

export default async function AgenceDashboardPage() {
  const supabase = await createClient();
  const scope = await getDemoScope();

  const since7 = new Date();
  since7.setDate(since7.getDate() - 7);
  const since7Iso = since7.toISOString();

  const [
    { data: projects },
    { data: recentAssets },
    { data: recentMessages },
    { data: clientProfiles },
    { data: weeklyMessages },
    { data: weeklyAssets },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .is("deleted_at", null)
      .eq("is_demo", scope)
      .order("created_at", { ascending: false }),
    supabase
      .from("brand_assets")
      .select("*, projects!inner(id, name)")
      .is("deleted_at", null)
      .eq("projects.is_demo", scope)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("messages")
      .select("*, projects!inner(id, name, client_profile_id)")
      .eq("projects.is_demo", scope)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.from("profiles").select("id, created_at, full_name").eq("role", "client"),
    supabase
      .from("messages")
      .select("created_at, projects!inner(is_demo)")
      .eq("projects.is_demo", scope)
      .gte("created_at", since7Iso),
    supabase
      .from("brand_assets")
      .select("created_at, projects!inner(is_demo)")
      .is("deleted_at", null)
      .eq("projects.is_demo", scope)
      .gte("created_at", since7Iso),
  ]);

  const allProjects = projects ?? [];
  const activeProjects = allProjects.filter((p) => !p.archived);
  // Un client n'est compté que s'il a au moins un projet dans le scope courant
  // (réel ou démo), pour ne jamais mélanger les deux populations à l'écran.
  const scopedClientIds = new Set(allProjects.map((p) => p.client_profile_id));
  const clients = (clientProfiles ?? []).filter((c) => scopedClientIds.has(c.id));

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

  const assetActivities: DashboardActivity[] = (recentAssets ?? []).map((asset) => ({
    id: `asset-${asset.id}`,
    kind: "asset",
    assetType: asset.type,
    title: `Téléchargement de ${asset.label}`,
    projectName: asset.projects?.name ?? "Projet supprimé",
    projectId: asset.projects?.id ?? null,
    createdAt: asset.created_at,
  }));

  const messageActivities: DashboardActivity[] = (recentMessages ?? []).slice(0, 5).map((message) => ({
    id: `message-${message.id}`,
    kind: "message",
    title: `Nouveau message de ${message.projects?.name ?? "un client"}`,
    projectName: message.projects?.name ?? "Projet supprimé",
    projectId: message.projects?.id ?? null,
    createdAt: message.created_at,
  }));

  const activities = [...assetActivities, ...messageActivities]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 6);

  const todayIso = new Date().toISOString().slice(0, 10);
  const upcomingDeadlines = activeProjects
    .filter((p) => p.end_date && p.end_date >= todayIso)
    .sort((a, b) => (a.end_date! < b.end_date! ? -1 : 1))
    .slice(0, 4)
    .map((p) => ({ id: p.id, name: p.name, end_date: p.end_date as string }));

  const seenProjects = new Set<string>();
  const messagePreview = (recentMessages ?? [])
    .filter((m) => {
      if (!m.projects?.id || seenProjects.has(m.projects.id)) return false;
      seenProjects.add(m.projects.id);
      return true;
    })
    .slice(0, 4)
    .map((m) => ({
      id: m.id,
      projectId: m.projects?.id ?? null,
      projectName: m.projects?.name ?? "Client",
      content: m.content,
    }));

  const statusCounts = {
    en_cours: activeProjects.filter((p) => p.status === "en_cours").length,
    attente_validation: activeProjects.filter((p) => p.status === "attente_validation").length,
    livre: activeProjects.filter((p) => p.status === "livre").length,
  };

  const dayBuckets: { date: string; label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayBuckets.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 1).toUpperCase(),
      count: 0,
    });
  }
  function addToBucket(createdAt: string) {
    const key = createdAt.slice(0, 10);
    const bucket = dayBuckets.find((b) => b.date === key);
    if (bucket) bucket.count += 1;
  }
  (weeklyMessages ?? []).forEach((m) => addToBucket(m.created_at));
  (weeklyAssets ?? []).forEach((a) => addToBucket(a.created_at));
  const weeklyActivity = dayBuckets.map((b) => ({ label: b.label, count: b.count }));

  const clientLastActivity = new Map<string, string>();
  for (const m of recentMessages ?? []) {
    const cid = m.projects?.client_profile_id;
    if (!cid) continue;
    const prev = clientLastActivity.get(cid);
    if (!prev || m.created_at > prev) clientLastActivity.set(cid, m.created_at);
  }
  const projectCountByClient = new Map<string, number>();
  for (const p of activeProjects) {
    projectCountByClient.set(p.client_profile_id, (projectCountByClient.get(p.client_profile_id) ?? 0) + 1);
  }
  const topClients = Array.from(clientLastActivity.entries())
    .map(([clientId, lastActivity]) => {
      const profile = clients.find((c) => c.id === clientId);
      return {
        id: clientId,
        name: profile?.full_name ?? "Client",
        lastActivity,
        projectCount: projectCountByClient.get(clientId) ?? 0,
      };
    })
    .sort((a, b) => (a.lastActivity < b.lastActivity ? 1 : -1))
    .slice(0, 4);

  const stats: DashboardStat[] = [
    { label: "Projets actifs", value: activeProjects.length, trend: trendProjetsActifs, href: "/agence/projets" },
    { label: "Clients totaux", value: clients.length, trend: trendClientsTotaux, href: "/agence/projets" },
    { label: "Projets totaux", value: allProjects.length, trend: trendProjetsTotaux, href: "/agence/projets" },
    { label: "Nouveaux clients (30j)", value: nouveauxClients30j, trend: 0, href: "/agence/projets" },
  ];

  const dashboardData: DashboardData = {
    activeProjects,
    statusCounts,
    weeklyActivity,
    upcomingDeadlines,
    activities,
    messagePreview,
    topClients,
  };

  return (
    <div>
      <DashboardOverview stats={stats} data={dashboardData} />

      <div>
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-400 mb-3 px-1">
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
