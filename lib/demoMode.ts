import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// Nom du cookie qui fait basculer le compte agence réel entre ses vraies
// données (absent / "0") et le jeu de données démo (présent / "1"). N'a
// aucun effet sur le compte recruteur : lui est toujours scopé is_demo=true
// par la RLS (voir supabase/migrations/028_demo_mode.sql), quoi que fasse le cookie.
export const DEMO_MODE_COOKIE = "livret_demo_mode";

// Détermine si la session courante doit lire/écrire les projets marqués
// is_demo = true (démo) ou is_demo = false (réel). Mémorisé par requête
// (React cache) pour éviter de refaire la requête profiles à chaque appel.
export const getDemoScope = cache(async (): Promise<boolean> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_demo_account")
    .eq("id", user.id)
    .single();

  // Le compte recruteur est toujours scopé démo, indépendamment du cookie.
  if (profile?.is_demo_account) return true;

  const cookieStore = await cookies();
  return cookieStore.get(DEMO_MODE_COOKIE)?.value === "1";
});
