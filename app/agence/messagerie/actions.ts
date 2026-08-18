"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { RendezVousStatus } from "@/lib/types";

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

export type ProposeRendezVousState = { error: string | null };

function formatDateLisible(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// Propose un rendez-vous dans le fil de discussion (agence ou client). Même
// principe qu'une contre-offre Vinted : chaque proposition est un nouveau
// message de type "rendezvous", indépendant des précédents.
export async function proposeRendezVous(
  _prevState: ProposeRendezVousState,
  formData: FormData
): Promise<ProposeRendezVousState> {
  const projectId = formData.get("project_id") as string;
  const date = (formData.get("date") as string)?.trim();
  const heure = (formData.get("heure") as string)?.trim();
  const lieu = (formData.get("lieu") as string)?.trim() || null;

  if (!date || !heure) {
    return { error: "Indique une date et une heure." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tu dois être connecté pour proposer un rendez-vous." };
  }

  const { error } = await supabase.from("messages").insert({
    project_id: projectId,
    sender_profile_id: user.id,
    content: `Proposition de rendez-vous le ${formatDateLisible(date)} à ${heure}${lieu ? ` — ${lieu}` : ""}`,
    type: "rendezvous",
    metadata: { date, heure, lieu, status: "pending" },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/agence/messagerie/${projectId}`);
  revalidatePath("/agence/messagerie");
  revalidatePath("/agence/dashboard");
  revalidatePath("/espace/messagerie");

  return { error: null };
}

// Accepte ou refuse une proposition de rendez-vous existante. Pas de
// formulaire ici : appelé directement depuis RendezVousCard.
export async function respondToRendezVous(
  messageId: string,
  projectId: string,
  response: Extract<RendezVousStatus, "accepted" | "declined">
) {
  const supabase = await createClient();

  const { data: message } = await supabase
    .from("messages")
    .select("metadata")
    .eq("id", messageId)
    .single();

  if (!message?.metadata) return;

  await supabase
    .from("messages")
    .update({ metadata: { ...message.metadata, status: response } })
    .eq("id", messageId);

  revalidatePath(`/agence/messagerie/${projectId}`);
  revalidatePath("/agence/messagerie");
  revalidatePath("/agence/dashboard");
  revalidatePath("/espace/messagerie");
}
