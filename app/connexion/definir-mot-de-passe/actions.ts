"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SetPasswordActionState = { error: string | null };

export async function setPasswordAfterInvite(
  _prevState: SetPasswordActionState,
  formData: FormData
): Promise<SetPasswordActionState> {
  const password = (formData.get("password") as string) ?? "";
  const passwordConfirm = (formData.get("password_confirm") as string) ?? "";

  if (password.length < 8) {
    return { error: "Le mot de passe doit faire au moins 8 caractères." };
  }
  if (password !== passwordConfirm) {
    return { error: "Les deux mots de passe ne correspondent pas." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Session expirée, redemande un lien d'invitation." };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError) {
    return { error: updateError.message };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  redirect(profile?.role === "agence" ? "/agence/dashboard" : "/espace/dashboard");
}
