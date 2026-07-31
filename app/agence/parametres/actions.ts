"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AgencyProfileActionState = { error: string | null };
export type InviteActionState = { error: string | null };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function updateAgencyProfile(
  _prevState: AgencyProfileActionState,
  formData: FormData
): Promise<AgencyProfileActionState> {
  const fullName = ((formData.get("full_name") as string) ?? "").trim();

  if (!fullName) {
    return { error: "Le nom de l'agence est requis." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Session expirée, reconnecte-toi." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/agence/parametres");

  return { error: null };
}

export async function inviteAgencyMember(
  _prevState: InviteActionState,
  formData: FormData
): Promise<InviteActionState> {
  const email = ((formData.get("email") as string) ?? "").trim();
  const fullName = ((formData.get("full_name") as string) ?? "").trim();

  if (!fullName || !email) {
    return { error: "Nom et email sont requis." };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Adresse email invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Session expirée, reconnecte-toi." };
  }

  const { error } = await supabase.from("agency_invites").insert({
    email,
    full_name: fullName,
    invited_by: user.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/agence/parametres");

  return { error: null };
}

export async function removeAgencyInvite(inviteId: string): Promise<{ error: string | null }> {
  if (!inviteId) {
    return { error: "Invitation manquante." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("agency_invites").delete().eq("id", inviteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/agence/parametres");

  return { error: null };
}
