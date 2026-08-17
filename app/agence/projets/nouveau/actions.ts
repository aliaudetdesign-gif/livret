"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDemoScope } from "@/lib/demoMode";
import {
  duplicateBrandAssetsForNewProject,
  duplicateDocumentsForNewProject,
} from "@/lib/projectDuplication";

export type ActionState = { error: string | null };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createProject(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const name = (formData.get("name") as string)?.trim();
  if (!name) {
    return { error: "Le nom du projet est requis." };
  }

  const supabase = await createClient();
  const scope = await getDemoScope();

  const sector = (formData.get("sector") as string)?.trim() || null;
  const city = (formData.get("city") as string)?.trim() || null;
  const status = (formData.get("status") as string) || "en_cours";
  const start_date = (formData.get("start_date") as string) || null;
  const end_date = (formData.get("end_date") as string) || null;
  const client_profile_id = (formData.get("client_profile_id") as string) || null;
  const client_email = (formData.get("client_email") as string)?.trim() || null;
  const client_full_name_input = (formData.get("client_full_name") as string)?.trim() || null;

  // Email du client (optionnel) : saisi maintenant pour éviter de repasser par
  // Réglages ensuite. Pour un nouveau client il faut aussi son nom (le compte
  // n'existe pas encore). Pour un client existant, on récupère son nom déjà
  // enregistré.
  let inviteFullName: string | null = null;
  if (client_email) {
    if (!EMAIL_PATTERN.test(client_email)) {
      return { error: "Adresse email du client invalide." };
    }
    if (client_profile_id) {
      const { data: existingClient } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", client_profile_id)
        .single();
      inviteFullName = existingClient?.full_name ?? null;
    } else {
      if (!client_full_name_input) {
        return { error: "Indique le nom du client pour l'inviter par email." };
      }
      inviteFullName = client_full_name_input;
    }
  }

  // Client existant : on récupère ses projets précédents avant de créer le
  // nouveau, pour dupliquer charte graphique et administratif (devis/facture).
  // Limité au même scope (réel/démo) que le nouveau projet, pour ne jamais
  // mélanger les deux populations de données.
  let priorProjectIds: string[] = [];
  if (client_profile_id) {
    const { data: priorProjects } = await supabase
      .from("projects")
      .select("id")
      .eq("client_profile_id", client_profile_id)
      .eq("is_demo", scope)
      .is("deleted_at", null);
    priorProjectIds = (priorProjects ?? []).map((p) => p.id as string);
  }

  const { data: newProject, error } = await supabase
    .from("projects")
    .insert({
      name,
      sector,
      city,
      status,
      start_date,
      end_date,
      client_profile_id,
      is_demo: scope,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  if (priorProjectIds.length > 0 && newProject) {
    await duplicateBrandAssetsForNewProject(supabase, priorProjectIds, newProject.id);
    await duplicateDocumentsForNewProject(supabase, priorProjectIds, newProject.id);
  }

  if (client_email && inviteFullName && newProject) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("project_client_invites").insert({
      project_id: newProject.id,
      email: client_email,
      full_name: inviteFullName,
      invited_by: user?.id ?? null,
    });
  }

  revalidatePath("/agence/projets");
  revalidatePath("/agence/dashboard");
  redirect("/agence/projets");
}
