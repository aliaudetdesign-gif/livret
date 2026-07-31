import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NouveauProjetForm } from "@/components/NouveauProjetForm";

export default async function NouveauProjetPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "client")
    .order("full_name");

  return (
    <div>
      <Link
        href="/agence/projets"
        className="text-sm text-ink-500 hover:text-[var(--color-terracotta-deep)]"
      >
        ← Retour aux projets clients
      </Link>
      <h1 className="text-2xl font-semibold mt-2 mb-1">Nouveau projet</h1>
      <p className="text-sm text-ink-500 mb-6">Crée un nouvel espace client.</p>

      <NouveauProjetForm clients={clients ?? []} />
    </div>
  );
}
