import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProjectColor } from "@/lib/projectColor";
import { formatTime } from "@/lib/format";
import { MessageForm } from "@/components/MessageForm";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!project) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Marque les messages du client comme lus à l'ouverture de la conversation.
  if (project.client_profile_id) {
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("project_id", id)
      .eq("sender_profile_id", project.client_profile_id)
      .eq("read", false);
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: true });

  const avatarColor = getProjectColor(project.id);
  const allMessages = messages ?? [];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <Link
        href="/agence/messagerie"
        className="text-sm text-ink-500 hover:text-clay-600 mb-4"
      >
        ← Retour à la Messagerie
      </Link>

      <div className="glass rounded-card flex flex-col flex-1 min-h-0">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/55 shrink-0">
          <div
            className="w-9 h-9 rounded-full text-xs flex items-center justify-center font-semibold shrink-0"
            style={{ backgroundColor: avatarColor.background, color: avatarColor.text }}
          >
            {project.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold">{project.name}</div>
            <div className="text-xs text-ink-400">
              {project.sector} · {project.city}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {allMessages.length === 0 ? (
            <p className="text-sm text-ink-400 m-auto">
              Aucun message pour l&apos;instant. Écris le premier message ci-dessous.
            </p>
          ) : (
            allMessages.map((message) => {
              const isMine = message.sender_profile_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`max-w-[70%] flex flex-col gap-1 ${
                    isMine ? "self-end items-end" : "self-start items-start"
                  }`}
                >
                  <div
                    className={`rounded-field px-3.5 py-2.5 text-sm ${
                      isMine
                        ? "bg-gradient-terracotta text-white shadow-[0_8px_18px_-10px_var(--clay-glow)]"
                        : "bg-white/75 border border-white/60 text-ink-900"
                    }`}
                  >
                    {message.content}
                  </div>
                  <span className="text-[10px] text-ink-400">
                    {formatTime(message.created_at)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <MessageForm projectId={project.id} />
      </div>
    </div>
  );
}
