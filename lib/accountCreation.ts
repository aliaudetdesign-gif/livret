import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/siteUrl";

export type CreateAccountResult =
  | { ok: true; userId: string; inviteLink: string }
  | { ok: false; error: string };

// Crée un compte Supabase Auth réel (aucun email envoyé : le lien est
// retourné pour être transmis à la main par l'agence, voir CLAUDE.md section
// "Création de compte") + sa ligne `profiles`. Point d'entrée unique utilisé
// depuis les 3 endroits où l'agence crée un compte : elle-même (Réglages >
// Accès), un nouveau client (création de projet), un contact supplémentaire
// sur un projet existant.
export async function createRealAccount(
  email: string,
  fullName: string,
  role: "agence" | "client"
): Promise<CreateAccountResult> {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      ok: false,
      error:
        "Clé service-role non configurée (SUPABASE_SERVICE_ROLE_KEY manquante dans .env.local).",
    };
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo: `${getSiteUrl()}/auth/confirm` },
  });

  if (linkError || !linkData.user) {
    return {
      ok: false,
      error:
        linkError?.message === "A user with this email address has already been registered"
          ? "Un compte existe déjà avec cet email."
          : linkError?.message ?? "Impossible de créer le compte.",
    };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: linkData.user.id,
    role,
    full_name: fullName,
  });

  if (profileError) {
    return { ok: false, error: profileError.message };
  }

  const inviteLink = `${getSiteUrl()}/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=invite&next=/connexion/definir-mot-de-passe`;

  return { ok: true, userId: linkData.user.id, inviteLink };
}
