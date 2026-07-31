import { createClient } from "@/lib/supabase/server";
import { getClientProject } from "@/lib/getClientProject";
import { DocumentGrid } from "@/components/DocumentGrid";

export default async function AdministratifClientPage() {
  const project = await getClientProject();

  if (!project) {
    return (
      <p className="text-sm text-zinc-500">
        Aucun projet rattaché à ton compte pour l&apos;instant.
      </p>
    );
  }

  const supabase = await createClient();
  const { data: documents } = await supabase
    .from("project_documents")
    .select("*")
    .eq("project_id", project.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Administratif</h1>
      <p className="text-sm text-zinc-500 mb-6">
        Devis, factures et brief partagés par ton agence.
      </p>

      <DocumentGrid documents={documents ?? []} />
    </div>
  );
}
