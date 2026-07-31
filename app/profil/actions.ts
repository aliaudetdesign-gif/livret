"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileActionState = { error: string | null };

export async function updateProfile(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const fullName = ((formData.get("full_name") as string) ?? "").trim();
  const phone = ((formData.get("phone") as string) ?? "").trim();

  if (!fullName) {
    return { error: "Le nom complet est requis." };
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
    .update({ full_name: fullName, phone: phone || null })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/agence/profil");
  revalidatePath("/espace/profil");
  revalidatePath("/agence/parametres");

  return { error: null };
}

export async function changePassword(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const password = (formData.get("password") as string) ?? "";
  const confirmation = (formData.get("password_confirmation") as string) ?? "";

  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  if (password !== confirmation) {
    return { error: "Les deux mots de passe ne correspondent pas." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Session expirée, reconnecte-toi." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function updateNotificationPreferences(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const notifyNewMessage = formData.get("notify_new_message") === "on";
  const notifyNewDocument = formData.get("notify_new_document") === "on";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Session expirée, reconnecte-toi." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      notify_new_message: notifyNewMessage,
      notify_new_document: notifyNewDocument,
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/agence/profil");
  revalidatePath("/espace/profil");

  return { error: null };
}

export async function updateProfessionalLink(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const professionalLink = ((formData.get("professional_link") as string) ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Session expirée, reconnecte-toi." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ professional_link: professionalLink || null })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/agence/profil");

  return { error: null };
}

export async function uploadAvatar(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const file = formData.get("avatar") as File | null;

  if (!file || file.size === 0) {
    return { error: "Sélectionne une image." };
  }

  if (!file.type.startsWith("image/")) {
    return { error: "Seules les images sont acceptées." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Session expirée, reconnecte-toi." };
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${user.id}/${Date.now()}-${cleanName}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrlData.publicUrl })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/agence/profil");
  revalidatePath("/espace/profil");
  revalidatePath("/agence/parametres");

  return { error: null };
}
