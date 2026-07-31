import { createClient } from "@/lib/supabase/server";
import type { Project, Message } from "@/lib/types";
import { MessagerieSearch } from "@/components/MessagerieSearch";
import { NewDiscussionButton } from "@/components/NewDiscussionButton";
import { DiscussionRow } from "@/components/DiscussionRow";

type Discussion = {
  project: Project;
  lastMessage: Message | null;
  unreadCount: number;
};

export default async function MessagerieAgencePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const supabase = await createClient();

  const [{ data: projects }, { data: messages }] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase.from("messages").select("*").order("created_at", { ascending: true }),
  ]);

  const allProjects = (projects ?? []) as Project[];
  const allMessages = (messages ?? []) as Message[];

  const discussions: Discussion[] = allProjects.map((project) => {
    const projectMessages = allMessages.filter((m) => m.project_id === project.id);
    const lastMessage = projectMessages[projectMessages.length - 1] ?? null;
    const unreadCount = projectMessages.filter(
      (m) => !m.read && m.sender_profile_id === project.client_profile_id
    ).length;
    return { project, lastMessage, unreadCount };
  });

  const term = q.trim().toLowerCase();
  const filtered = term
    ? discussions.filter(
        (d) =>
          d.project.name.toLowerCase().includes(term) ||
          (d.lastMessage?.content ?? "").toLowerCase().includes(term)
      )
    : discussions;

  const byLastActivity = (a: Discussion, b: Discussion) => {
    const aDate = a.lastMessage?.created_at ?? a.project.created_at;
    const bDate = b.lastMessage?.created_at ?? b.project.created_at;
    return aDate < bDate ? 1 : -1;
  };

  const active = filtered.filter((d) => !d.project.archived).sort(byLastActivity);
  const archived = filtered.filter((d) => d.project.archived).sort(byLastActivity);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Messagerie</h1>
          <p className="text-sm text-zinc-500">Échanger avec vos clients</p>
        </div>
        <div className="flex items-center gap-3">
          <MessagerieSearch defaultValue={q} />
          <NewDiscussionButton projects={allProjects.filter((p) => !p.archived)} />
        </div>
      </div>

      <Section
        title="Discussions"
        discussions={active}
        emptyLabel={
          term
            ? "Aucune discussion ne correspond à ta recherche."
            : "Aucune discussion pour l'instant."
        }
      />

      {archived.length > 0 && <Section title="Archivés" discussions={archived} muted />}
    </div>
  );
}

function Section({
  title,
  discussions,
  emptyLabel,
  muted = false,
}: {
  title: string;
  discussions: Discussion[];
  emptyLabel?: string;
  muted?: boolean;
}) {
  return (
    <div className="mb-8">
      <h2
        className={`text-xs uppercase tracking-wide mb-3 ${
          muted ? "text-zinc-400" : "text-zinc-500 font-medium"
        }`}
      >
        {title}
      </h2>

      {discussions.length === 0 ? (
        <p className="text-sm text-zinc-400">{emptyLabel}</p>
      ) : (
        <div className="bg-white rounded-lg border border-zinc-100 divide-y divide-zinc-100">
          {discussions.map(({ project, lastMessage, unreadCount }) => (
            <DiscussionRow
              key={project.id}
              project={project}
              lastMessage={lastMessage}
              unreadCount={unreadCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
