"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DEMO_MODE_COOKIE } from "@/lib/demoMode";
import { THEME_COOKIE } from "@/lib/themeMode";
import type { ThemePreference } from "@/lib/types";

export type ProfileActionState = { error: string | null };

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}

// Bascule le compte agence réel sur le jeu de données démo (widget "Modifier
// la démo" du profil). Réservé au compte agence réel : le compte recruteur
// (is_demo_account) est déjà scopé démo en permanence par la RLS et n'a pas
// besoin de ce cookie.
export async function enterDemoMode() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_demo_account")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "agence" || profile.is_demo_account) {
    redirect("/agence/profil");
  }

  const cookieStore = await cookies();
  cookieStore.set(DEMO_MODE_COOKIE, "1", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });

  redirect("/agence/dashboard");
}

export async function exitDemoMode() {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_MODE_COOKIE);
  redirect("/agence/profil");
}

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

// Met à jour la préférence de thème (Clair/Sombre/Automatique), persistée en
// base pour suivre l'utilisateur d'un appareil à l'autre, et son cookie
// miroir pour un rendu SSR sans flash (voir lib/themeMode.ts). Appelée
// directement avec la valeur choisie (pas de FormData) : c'est un contrôle
// segmenté à 3 boutons, même principe que updateProjectStatus.
export async function updateThemePreference(
  value: ThemePreference
): Promise<ProfileActionState> {
  if (value !== "light" && value !== "dark" && value !== "auto") {
    return { error: "Préférence de thème invalide." };
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
    .update({ theme_preference: value })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  const cookieStore = await cookies();
  cookieStore.set(THEME_COOKIE, value, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/agence/parametres");
  revalidatePath("/espace/profil");
  revalidatePath("/", "layout");

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
