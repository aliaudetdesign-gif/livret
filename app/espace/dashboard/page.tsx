import { createClient } from "@/lib/supabase/server";
import { getClientProject } from "@/lib/getClientProject";
import { getBadges } from "@/components/ProjectCard";
import { ProgressBar } from "@/components/ProjectProgressControls";
import { ASSET_ICONS } from "@/components/dashboard/RecentActivityList";
import {
  ClientRecentActivity,
  type ClientActivityItem,
} from "@/components/dashboard/client/ClientRecentActivity";
import {
  ClientDashboardCalendar,
  type CalendarEvent,
} from "@/components/dashboard/client/ClientDashboardCalendar";
import {
  ClientMessagingPreview,
  type ClientMessagePreviewItem,
} from "@/components/dashboard/client/ClientMessagingPreview";
import { ClientUpcomingRendezVous } from "@/components/dashboard/client/ClientUpcomingRendezVous";
import {
  ClientRecentDocuments,
  type ClientDocumentItem,
} from "@/components/dashboard/client/ClientRecentDocuments";
import type { AssetType } from "@/lib/types";

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  logo: "Logos",
  couleur: "Couleurs",
  typographie: "Typographies",
  moodboard: "Visuels & Moodboard",
  guide: "Guide d'utilisation",
};

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: assets },
    { data: recentBrandAssets },
    { data: recentSectionAssets },
    { data: recentMessages },
    { count: unreadCount },
    { data: lastRendezvous },
    { data: recentDocuments },
  ] = await Promise.all([
    supabase.from("brand_assets").select("type").eq("project_id", project.id).is("deleted_at", null),
    supabase
      .from("brand_assets")
      .select("id, type, label, created_at")
      .eq("project_id", project.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("section_assets")
      .select("id, label, created_at, project_sections!inner(project_id, section_types(label))")
      .eq("project_sections.project_id", project.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("messages")
      .select("id, content, type, sender_profile_id, created_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("project_id", project.id)
      .eq("read", false)
      .neq("sender_profile_id", user?.id ?? ""),
    supabase
      .from("messages")
      .select("id, metadata, sender_profile_id, created_at")
      .eq("project_id", project.id)
      .eq("type", "rendezvous")
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("project_documents")
      .select("id, category, label, created_at")
      .eq("project_id", project.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const count = (type: string) =>
    (assets ?? []).filter((a) => a.type === type).length;

  const brandItems: ClientActivityItem[] = (recentBrandAssets ?? []).map((a) => ({
    id: `asset-${a.id}`,
    icon: ASSET_ICONS[a.type as AssetType],
    label: a.label,
    sublabel: ASSET_TYPE_LABELS[a.type as AssetType],
    createdAt: a.created_at,
  }));

  const sectionItems: ClientActivityItem[] = (
    (recentSectionAssets ?? []) as unknown as {
      id: string;
      label: string;
      created_at: string;
      project_sections: { section_types: { label: string } };
    }[]
  ).map((a) => ({
    id: `section-asset-${a.id}`,
    icon: "📄",
    label: a.label,
    sublabel: a.project_sections.section_types.label,
    createdAt: a.created_at,
  }));

  const activityItems = [...brandItems, ...sectionItems]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 6);

  const messagePreview: ClientMessagePreviewItem[] = (recentMessages ?? []).map((m) => ({
    id: m.id,
    content: m.type === "rendezvous" ? "📅 Proposition de rendez-vous" : m.content,
    isMine: m.sender_profile_id === user?.id,
    createdAt: m.created_at,
  }));

  const rendezvous = (lastRendezvous ?? [])[0] ?? null;

  const events: CalendarEvent[] = [];
  if (project.end_date) {
    events.push({ date: project.end_date, label: "Échéance du projet" });
  }
  if (rendezvous?.metadata && rendezvous.metadata.status !== "declined") {
    events.push({ date: rendezvous.metadata.date, label: "Rendez-vous" });
  }

  const documents: ClientDocumentItem[] = (recentDocuments ?? []).map((d) => ({
    id: d.id,
    category: d.category,
    label: d.label,
    createdAt: d.created_at,
  }));

  return (
    <div>
      <div className="relative overflow-hidden bg-ink-900 text-white rounded-panel p-7 mb-3.5 shadow-[0_28px_60px_-28px_rgba(23,22,26,0.55)]">
        <div
          className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-clay-500 opacity-40 blur-[90px] pointer-events-none"
          aria-hidden
        />
        <div className="relative flex items-start justify-between gap-6 mb-7">
          <div>
            <h1 className="text-[38px] font-bold tracking-[-0.03em] leading-none mb-3">
              {project.name}
            </h1>
            <div className="text-white/45 text-[10px] uppercase tracking-[0.09em] font-semibold mb-1">
              Secteur
            </div>
            <div className="text-sm text-white/75">{project.sector}</div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0 text-right">
            <div className="text-white/45 text-[10px] uppercase tracking-[0.09em] font-semibold mb-1">
              Statut
            </div>
            <div className="flex gap-1 flex-wrap justify-end">
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

        <ProgressBar
          projectId={project.id}
          progressStep={project.progress_step}
          variant="dark"
        />
      </div>

      <div className="grid grid-cols-4 gap-3.5 mb-3.5">
        <StatCard label="Logos" value={count("logo")} />
        <StatCard label="Couleurs" value={count("couleur")} />
        <StatCard label="Typographies" value={count("typographie")} />
        <StatCard label="Visuels & Moodboard" value={count("moodboard")} />
      </div>

      <div className="grid grid-cols-3 grid-rows-2 gap-3.5">
        <div className="col-start-1 row-start-1 row-span-2">
          <ClientRecentActivity items={activityItems} />
        </div>
        <div className="col-start-2 row-start-1">
          <ClientMessagingPreview messages={messagePreview} unreadCount={unreadCount ?? 0} />
        </div>
        <div className="col-start-3 row-start-1">
          <ClientDashboardCalendar projectId={project.id} events={events} />
        </div>
        <div className="col-start-2 row-start-2">
          <ClientUpcomingRendezVous
            metadata={rendezvous?.metadata ?? null}
            isMine={rendezvous?.sender_profile_id === user?.id}
          />
        </div>
        <div className="col-start-3 row-start-2">
          <ClientRecentDocuments documents={documents} />
        </div>
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
