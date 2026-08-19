import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getClientProject } from "@/lib/getClientProject";
import { ColorGrid } from "@/components/ColorGrid";
import { SectionAssetGrid } from "@/components/SectionAssetGrid";
import { TypographyCard } from "@/components/TypographyCard";
import { LogoGrid } from "@/components/LogoGrid";
import { DownloadableAssetImage } from "@/components/DownloadableAssetImage";
import { DownloadableGuidePreview } from "@/components/DownloadableGuidePreview";
import { ESSENTIEL_SECTIONS } from "@/lib/designEssentiel";
import type { AssetType, GuideMetadata } from "@/lib/types";

const FILE_TYPES: AssetType[] = ["logo", "moodboard"];
// Labels/clés dérivés de la source unique ESSENTIEL_SECTIONS (lib/designEssentiel.ts).
const ESSENTIEL_LABELS: Record<Exclude<AssetType, "moodboard">, string> = Object.fromEntries(
  ESSENTIEL_SECTIONS.map((s) => [s.key, s.label])
) as Record<Exclude<AssetType, "moodboard">, string>;
const ESSENTIEL_KEYS: string[] = ESSENTIEL_SECTIONS.map((s) => s.key);

export default async function DesignSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const project = await getClientProject();

  if (!project) {
    return (
      <p className="text-sm text-ink-500">
        Aucun projet rattaché à ton compte pour l&apos;instant.
      </p>
    );
  }

  const supabase = await createClient();
  const isEssentiel = ESSENTIEL_KEYS.includes(section);

  const backLink = (
    <Link
      href="/espace/design"
      className="text-sm text-ink-500 hover:text-clay-600 mb-4 inline-block"
    >
      ← Design
    </Link>
  );

  if (isEssentiel) {
    const type = section as Exclude<AssetType, "moodboard">;
    const { data: assets } = await supabase
      .from("brand_assets")
      .select("*")
      .eq("project_id", project.id)
      .eq("type", type)
      .is("deleted_at", null);

    return (
      <div>
        {backLink}
        <h1 className="text-[27px] font-semibold tracking-[-0.028em] mb-6">{ESSENTIEL_LABELS[type]}</h1>

        {(assets ?? []).length === 0 ? (
          <p className="text-sm text-ink-400">
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
        ) : type === "guide" ? (
          <div className="grid grid-cols-3 gap-4">
            {(assets ?? []).map((asset) => {
              const metadata = asset.metadata as unknown as GuideMetadata | null;
              return (
                <div key={asset.id} className="glass rounded-card p-4">
                  <DownloadableGuidePreview
                    previewUrl={metadata?.generatedPreview ?? null}
                    fileUrl={asset.value}
                    alt={asset.label}
                  />
                  <div className="font-medium text-sm">{asset.label}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {(assets ?? []).map((asset) => (
              <div key={asset.id} className="glass rounded-card p-4">
                {FILE_TYPES.includes(type) ? (
                  <DownloadableAssetImage src={asset.value} alt={asset.label} />
                ) : null}
                <div className="font-medium text-sm">{asset.label}</div>
                {!FILE_TYPES.includes(type) && (
                  <div className="text-xs text-ink-500">{asset.value}</div>
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
    return <p className="text-sm text-ink-500">Section introuvable.</p>;
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
      <h1 className="text-[27px] font-semibold tracking-[-0.028em] mb-6">
        {projectSection.section_types.icon} {projectSection.section_types.label}{" "}
        <span className="text-ink-400 font-normal">({(sectionAssets ?? []).length})</span>
      </h1>
      <SectionAssetGrid
        assets={sectionAssets ?? []}
        template={projectSection.section_types.template}
      />
    </div>
  );
}
