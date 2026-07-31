import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getClientProject } from "@/lib/getClientProject";
import { ColorGrid } from "@/components/ColorGrid";
import { SectionAssetGrid } from "@/components/SectionAssetGrid";
import { TypographyCard } from "@/components/TypographyCard";
import { LogoGrid } from "@/components/LogoGrid";
import type { AssetType } from "@/lib/types";

const FILE_TYPES: AssetType[] = ["logo", "moodboard"];
const ESSENTIEL_LABELS: Record<AssetType, string> = {
  logo: "Logos",
  couleur: "Couleurs",
  typographie: "Typographies",
  moodboard: "Visuels & Moodboard",
};
const ESSENTIEL_KEYS = Object.keys(ESSENTIEL_LABELS);

export default async function DesignSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const project = await getClientProject();

  if (!project) {
    return (
      <p className="text-sm text-zinc-500">
        Aucun projet rattaché à ton compte pour l&apos;instant.
      </p>
    );
  }

  const supabase = await createClient();
  const isEssentiel = ESSENTIEL_KEYS.includes(section);

  const backLink = (
    <Link
      href="/espace/design"
      className="text-sm text-zinc-500 hover:text-[var(--color-terracotta)] mb-4 inline-block"
    >
      ← Design
    </Link>
  );

  if (isEssentiel) {
    const type = section as AssetType;
    const { data: assets } = await supabase
      .from("brand_assets")
      .select("*")
      .eq("project_id", project.id)
      .eq("type", type)
      .is("deleted_at", null);

    return (
      <div>
        {backLink}
        <h1 className="text-2xl font-semibold mb-6">{ESSENTIEL_LABELS[type]}</h1>

        {(assets ?? []).length === 0 ? (
          <p className="text-sm text-zinc-400">
            Rien à afficher pour l&apos;instant, ton agence n&apos;a pas encore ajouté d&apos;éléments ici.
          </p>
        ) : type === "couleur" ? (
          <ColorGrid assets={assets ?? []} />
        ) : type === "typographie" ? (
          <div className="flex flex-col gap-4 max-w-2xl">
            {(assets ?? []).map((asset) => (
              <TypographyCard key={asset.id} asset={asset} />
            ))}
          </div>
        ) : type === "logo" ? (
          <LogoGrid assets={assets ?? []} />
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {(assets ?? []).map((asset) => (
              <div key={asset.id} className="bg-white border border-zinc-100 rounded-lg p-4">
                {FILE_TYPES.includes(type) ? (
                  <div className="aspect-square w-full mb-2 rounded-md overflow-hidden bg-zinc-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset.value}
                      alt={asset.label}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : null}
                <div className="font-medium text-sm">{asset.label}</div>
                {!FILE_TYPES.includes(type) && (
                  <div className="text-xs text-zinc-500">{asset.value}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const { data: projectSection } = await supabase
    .from("project_sections")
    .select("*, section_types(*)")
    .eq("id", section)
    .eq("project_id", project.id)
    .is("deleted_at", null)
    .single();

  if (!projectSection) {
    return <p className="text-sm text-zinc-500">Section introuvable.</p>;
  }

  const { data: sectionAssets } = await supabase
    .from("section_assets")
    .select("*")
    .eq("project_section_id", section)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <div>
      {backLink}
      <h1 className="text-2xl font-semibold mb-6">
        {projectSection.section_types.icon} {projectSection.section_types.label}
      </h1>
      <SectionAssetGrid assets={sectionAssets ?? []} />
    </div>
  );
}
