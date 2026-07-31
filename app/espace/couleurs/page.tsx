import { createClient } from "@/lib/supabase/server";
import { getClientProject } from "@/lib/getClientProject";
import { ColorGrid } from "@/components/ColorGrid";

export default async function CouleursPage() {
  const project = await getClientProject();

  if (!project) {
    return (
      <p className="text-sm text-zinc-500">
        Aucun projet rattaché à ton compte pour l&apos;instant.
      </p>
    );
  }

  const supabase = await createClient();
  const { data: colors } = await supabase
    .from("brand_assets")
    .select("*")
    .eq("project_id", project.id)
    .eq("type", "couleur")
    .is("deleted_at", null);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Palette de couleurs</h1>
      <p className="text-sm text-zinc-500 mb-6">
        Cliquez sur une couleur pour copier le code hexadécimal
      </p>

      {(colors ?? []).length === 0 ? (
        <p className="text-sm text-zinc-400">
          Aucune couleur ajoutée pour l&apos;instant.
        </p>
      ) : (
        <ColorGrid assets={colors ?? []} />
      )}
    </div>
  );
}
