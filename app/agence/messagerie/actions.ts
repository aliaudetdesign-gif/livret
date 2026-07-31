"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SendMessageState = { error: string | null };

// Marque tous les messages envoyés par le client d'un projet comme lus.
// Appelé automatiquement à l'ouverture d'une conversation.
export async function markThreadRead(projectId: string) {
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("client_profile_id")
    .eq("id", projectId)
    .single();

  if (!project?.client_profile_id) return;

  await supabase
    .from("messages")
    .update({ read: true })
    .eq("project_id", projectId)
    .eq("sender_profile_id", project.client_profile_id)
    .eq("read", false);

  revalidatePath("/agence/messagerie");
  revalidatePath("/agence/dashboard");
}

// Remet le dernier message du client en "non lu" (action manuelle depuis la liste).
export async function markThreadUnread(projectId: string) {
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("client_profile_id")
    .eq("id", projectId)
    .single();

  if (!project?.client_profile_id) return;

  const { data: lastClientMessage } = await supabase
    .from("messages")
    .select("id")
    .eq("project_id", projectId)
    .eq("sender_profile_id", project.client_profile_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (lastClientMessage) {
    await supabase.from("messages").update({ read: false }).eq("id", lastClientMessage.id);
  }

  revalidatePath("/agence/messagerie");
  revalidatePath("/agence/dashboard");
}

export async function toggleArchiveProject(projectId: string, archived: boolean) {
  const supabase = await createClient();

  await supabase.from("projects").update({ archived }).eq("id", projectId);

  revalidatePath("/agence/messagerie");
  revalidatePath("/agence/projets");
  revalidatePath("/agence/dashboard");
}

export async function sendMessage(
  _prevState: SendMessageState,
  formData: FormData
): Promise<SendMessageState> {
  const projectId = formData.get("project_id") as string;
  const content = (formData.get("content") as string)?.trim();

  if (!content) {
    return { error: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tu dois être connecté pour envoyer un message." };
  }

  const { error } = await supabase.from("messages").insert({
    project_id: projectId,
    sender_profile_id: user.id,
    content,
  });

  if (error) {
    return { error: error.message };
  }

  // Pas de redirect ici : ce composant est partagé entre l'agence (qui
  // navigue vers /agence/messagerie/[id]) et le client (qui reste sur
  // /espace/messagerie). revalidatePath suffit à rafraîchir la conversation
  // affichée, quelle que soit la route d'où l'appel a été fait.
  revalidatePath(`/agence/messagerie/${projectId}`);
  revalidatePath("/agence/messagerie");
  revalidatePath("/agence/dashboard");
  revalidatePath("/espace/messagerie");

  return { error: null };
}
