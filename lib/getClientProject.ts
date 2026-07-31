import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";

// Récupère le projet rattaché au client actuellement connecté.
// Retourne null si personne n'est connecté ou si aucun projet n'est rattaché.
export async function getClientProject(): Promise<Project | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("client_profile_id", user.id)
    .is("deleted_at", null)
    .single();

  return project ?? null;
}
