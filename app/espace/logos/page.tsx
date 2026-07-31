import { createClient } from "@/lib/supabase/server";
import { getClientProject } from "@/lib/getClientProject";
import { LogoGrid, describeLogoFormats } from "@/components/LogoGrid";

export default async function LogosPage() {
  const project = await getClientProject();

  if (!project) {
    return (
      <p className="text-sm text-ink-500">
        Aucun projet rattaché à ton compte pour l&apos;instant.
      </p>
    );
  }

  const supabase = await createClient();
  const { data: assets } = await supabase
    .from("brand_assets")
    .select("*")
    .eq("project_id", project.id)
    .eq("type", "logo")
    .is("deleted_at", null);

  return (
    <div>
      <h1 className="text-[27px] font-semibold tracking-[-0.028em] mb-1">Logos</h1>
      <p className="text-sm text-ink-500 mb-6">{describeLogoFormats(assets ?? [])}</p>

      <LogoGrid assets={assets ?? []} />
    </div>
  );
}
