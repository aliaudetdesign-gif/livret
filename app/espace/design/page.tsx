import { createClient } from "@/lib/supabase/server";
import { getClientProject } from "@/lib/getClientProject";
import { DesignGrid, type DesignCardData } from "@/components/DesignGrid";
import { ESSENTIEL_SECTIONS } from "@/lib/designEssentiel";
import type { ProjectSection } from "@/lib/types";

export default async function DesignPage() {
  const project = await getClientProject();

  if (!project) {
    return (
      <p className="text-sm text-ink-500">
        Aucun projet rattaché à ton compte pour l&apos;instant.
      </p>
    );
  }

  const supabase = await createClient();

  const { data: brandAssetTypes } = await supabase
    .from("brand_assets")
    .select("type")
    .eq("project_id", project.id)
    .is("deleted_at", null);

  const { data: projectSections } = await supabase
    .from("project_sections")
    .select("*, section_types(*), section_assets(id, deleted_at)")
    .eq("project_id", project.id)
    .is("deleted_at", null);

  const essentielCards: DesignCardData[] = ESSENTIEL_SECTIONS.map((e) => ({
    key: e.key,
    label: e.label,
    icon: e.icon,
    count: (brandAssetTypes ?? []).filter((a) => a.type === e.key).length,
  }));

  const complementCards: DesignCardData[] = (
    (projectSections ?? []) as (ProjectSection & {
      section_assets: { id: string; deleted_at: string | null }[];
    })[]
  ).map((ps) => ({
    key: ps.id,
    label: ps.section_types.label,
    icon: ps.section_types.icon,
    count: (ps.section_assets ?? []).filter((a) => !a.deleted_at).length,
  }));

  return (
    <div>
      <h1 className="text-[27px] font-semibold tracking-[-0.028em] mb-1">Design</h1>
      <p className="text-sm text-ink-500 mb-6">
        Les éléments de marque partagés par ton agence.
      </p>
      <DesignGrid
        essentiel={essentielCards}
        complements={complementCards}
        sectionHrefTemplate="/espace/design/{key}"
      />
    </div>
  );
}
