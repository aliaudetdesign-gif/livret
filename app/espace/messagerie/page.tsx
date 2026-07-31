import { createClient } from "@/lib/supabase/server";
import { getClientProject } from "@/lib/getClientProject";
import { getProjectColor } from "@/lib/projectColor";
import { formatTime } from "@/lib/format";
import { MessageForm } from "@/components/MessageForm";

// Même rendu de conversation que côté agence (app/agence/messagerie/[id]/page.tsx) :
// seule la liste des discussions (propre à l'agence, qui gère plusieurs
// projets) n'a pas d'équivalent ici, le client n'ayant qu'une seule
// conversation, la sienne.
export default async function MessagerieClientPage() {
  const project = await getClientProject();

  if (!project) {
    return (
      <p className="text-sm text-zinc-500">
        Aucun projet rattaché à ton compte pour l&apos;instant.
      </p>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Marque les messages envoyés par l'agence comme lus à l'ouverture de la
  // conversation (symétrique de markThreadRead côté agence).
  await supabase
    .from("messages")
    .update({ read: true })
    .eq("project_id", project.id)
    .neq("sender_profile_id", user?.id ?? "")
    .eq("read", false);

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: true });

  const avatarColor = getProjectColor(project.id);
  const allMessages = messages ?? [];

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <h1 className="text-2xl font-semibold mb-1">Messagerie</h1>
      <p className="text-sm text-zinc-500 mb-4">
        Échange avec ton agence à propos de {project.name}.
      </p>

      <div className="bg-white rounded-lg border border-zinc-100 flex flex-col flex-1 min-h-0">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 shrink-0">
          <div
            className="w-9 h-9 rounded-full text-xs flex items-center justify-center font-semibold shrink-0"
            style={{ backgroundColor: avatarColor.background, color: avatarColor.text }}
          >
            {project.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold">{project.name}</div>
            <div className="text-xs text-zinc-400">
              {project.sector} · {project.city}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {allMessages.length === 0 ? (
            <p className="text-sm text-zinc-400 m-auto">
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
                    className={`rounded-lg px-3 py-2 text-sm ${
                      isMine ? "bg-gradient-terracotta text-white" : "bg-zinc-100 text-zinc-800"
                    }`}
                  >
                    {message.content}
                  </div>
                  <span className="text-[10px] text-zinc-300">
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
