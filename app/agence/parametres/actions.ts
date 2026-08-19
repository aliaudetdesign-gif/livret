"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createRealAccount } from "@/lib/accountCreation";

export type AgencyProfileActionState = { error: string | null };
export type InviteActionState = { error: string | null; inviteLink?: string };

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

  // Le client admin (clé service-role) contourne la RLS : on vérifie donc
  // nous-mêmes que l'appelant est bien côté agence avant de créer un compte.
  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (callerProfile?.role !== "agence") {
    return { error: "Action réservée à l'agence." };
  }

  const result = await createRealAccount(email, fullName, "agence");

  if (!result.ok) {
    return { error: result.error };
  }

  const { error: inviteRowError } = await supabase.from("agency_invites").insert({
    email,
    full_name: fullName,
    status: "acceptee",
    profile_id: result.userId,
    invited_by: user.id,
  });

  if (inviteRowError) {
    return { error: inviteRowError.message };
  }

  revalidatePath("/agence/parametres");

  return { error: null, inviteLink: result.inviteLink };
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
