import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Client Supabase "admin", avec la clé service-role : contourne la RLS et
// donne accès à l'API d'administration des comptes (auth.admin.*), utilisée
// pour créer un compte réel (agence ou client) directement depuis l'app au
// lieu de passer par Supabase Dashboard.
//
// IMPORTANT : SUPABASE_SERVICE_ROLE_KEY ne doit jamais être préfixée
// NEXT_PUBLIC_ et ne doit être importée que depuis du code serveur (Server
// Actions, Route Handlers) — jamais depuis un composant "use client".
// Récupérable dans Supabase Dashboard > Project Settings > API > service_role.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY manquante : ajoute-la dans .env.local (Supabase Dashboard > Project Settings > API > service_role)."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
