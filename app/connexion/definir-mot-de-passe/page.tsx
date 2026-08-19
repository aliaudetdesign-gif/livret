import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DefinirMotDePasseForm } from "./DefinirMotDePasseForm";

// Atterrissage après un lien d'invitation (app/auth/confirm) : la session est
// déjà ouverte à ce stade (token vérifié), il ne reste qu'à choisir un mot de
// passe. Sans session valide, pas de lien d'invitation en cours : retour à la
// connexion classique.
export default async function DefinirMotDePassePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="glass w-full max-w-sm rounded-panel p-9">
        <div className="mb-7">
          <span className="text-[23px] font-semibold tracking-[-0.02em] text-ink-900">
            livret<span className="text-gradient-terracotta">.</span>
          </span>
          <p className="text-[13.5px] text-ink-500 mt-1.5">
            Choisis un mot de passe pour activer ton compte.
          </p>
        </div>

        <DefinirMotDePasseForm />
      </div>
    </div>
  );
}
