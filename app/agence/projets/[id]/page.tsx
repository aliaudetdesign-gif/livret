import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatShortDate } from "@/lib/format";
import { ProgressBar, StatusToggle } from "@/components/ProjectProgressControls";
import { ProjectBriefForm } from "@/components/ProjectBriefForm";
import { DocumentGrid } from "@/components/DocumentGrid";
import { DocumentUploadTrigger } from "@/components/DocumentUploadTrigger";
import { DesignGrid, type DesignCardData } from "@/components/DesignGrid";
import { AddSectionForm } from "@/components/AddSectionForm";
import { SectionAssetGrid } from "@/components/SectionAssetGrid";
import { SectionAssetUploadTrigger } from "@/components/SectionAssetUploadTrigger";
import { AssetGrid } from "@/components/AssetGrid";
import { ColorGrid } from "@/components/ColorGrid";
import { AssetUploadTrigger } from "@/components/AssetUploadTrigger";
import { ProjectSettingsForm } from "@/components/ProjectSettingsForm";
import { ProjectClientInvites } from "@/components/ProjectClientInvites";
import type { AssetType, ProjectSection } from "@/lib/types";

const ESSENTIEL: { key: AssetType; label: string; icon: string }[] = [
  { key: "logo", label: "Logos", icon: "🖼️" },
  { key: "couleur", label: "Couleurs", icon: "🎨" },
  { key: "typographie", label: "Typographies", icon: "Aa" },
  { key: "guide", label: "Guide d'utilisation", icon: "📘" },
];
const ESSENTIEL_KEYS = ESSENTIEL.map((e) => e.key) as string[];

const tabs = [
  { key: "infos", label: "Infos" },
  { key: "administratif", label: "Administratif" },
  { key: "design", label: "Design" },
];

export default async function ProjetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; section?: string }>;
}) {
  const { id } = await params;
  const { tab = "infos", section } = await searchParams;

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  const isEssentielSection = tab === "design" && !!section && ESSENTIEL_KEYS.includes(section);
  const isComplementSection = tab === "design" && !!section && !isEssentielSection;

  const { data: assets } = isEssentielSection
    ? await supabase
        .from("brand_assets")
        .select("*")
        .eq("project_id", id)
        .eq("type", section)
        .is("deleted_at", null)
    : { data: [] };

  const { data: documents } =
    tab === "administratif"
      ? await supabase
          .from("project_documents")
          .select("*")
          .eq("project_id", id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
      : { data: [] };

  // Onglet Design (vue d'ensemble) : compte des éléments Essentiel + sections
  // complémentaires activées sur ce projet, avec leur nombre de fichiers.
  const { data: brandAssetTypes } =
    tab === "design" && !section
      ? await supabase.from("brand_assets").select("type").eq("project_id", id).is("deleted_at", null)
      : { data: [] };

  const { data: projectSections } =
    tab === "design" && !section
      ? await supabase
          .from("project_sections")
          .select("*, section_types(*), section_assets(id, deleted_at)")
          .eq("project_id", id)
          .is("deleted_at", null)
      : { data: [] };

  const { data: allSectionTypes } =
    tab === "design" && !section
      ? await supabase.from("section_types").select("*").order("label")
      : { data: [] };

  // Détail d'une section complémentaire : la section elle-même + ses fichiers.
  const { data: currentSection } = isComplementSection
    ? await supabase
        .from("project_sections")
        .select("*, section_types(*)")
        .eq("id", section)
        .eq("project_id", id)
        .is("deleted_at", null)
        .single()
    : { data: null };

  const { data: sectionAssets } = isComplementSection
    ? await supabase
        .from("section_assets")
        .select("*")
        .eq("project_section_id", section)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
    : { data: [] };

  const { data: clientInvites } =
    tab === "reglages"
      ? await supabase
          .from("project_client_invites")
          .select("*")
          .eq("project_id", id)
          .order("created_at", { ascending: false })
      : { data: [] };

  const essentielCards: DesignCardData[] = ESSENTIEL.map((e) => ({
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
    sectionTypeId: ps.section_type_id,
  }));

  const usedTypeIds = new Set((projectSections ?? []).map((ps) => ps.section_type_id));
  const availableSectionTypes = (allSectionTypes ?? []).filter((t) => !usedTypeIds.has(t.id));

  return (
    <div>
      {/* Bloc sombre assumé, en contrepoint du verre clair : c'est le seul
          endroit de la page où l'on inverse le contraste, donc les couleurs de
          texte y sont exprimées en blanc translucide et non en tokens d'encre. */}
      <div className="relative overflow-hidden bg-ink-900 text-white rounded-panel p-9 mb-3.5 shadow-[0_28px_60px_-28px_rgba(23,22,26,0.55)]">
        <div
          className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-clay-500 opacity-40 blur-[90px] pointer-events-none"
          aria-hidden
        />
        {project ? (
          <div className="relative flex items-start justify-between gap-10">
            <div className="max-w-xl">
              <h1 className="text-[34px] font-semibold tracking-[-0.035em] leading-none text-white mb-3.5">
                {project.name}
              </h1>
              {project.description && (
                <p className="text-sm text-white/75 leading-relaxed">{project.description}</p>
              )}
            </div>

            <div className="flex flex-col items-end gap-6 shrink-0">
              <Link
                href={`/agence/projets/${id}?tab=reglages`}
                className="text-[13px] font-semibold text-clay-400 hover:text-white transition-colors"
              >
                Gérer le projet
              </Link>
              <div className="grid grid-cols-2 gap-x-10 gap-y-4 text-right">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.09em] font-semibold text-white/45 mb-1">
                    Secteur
                  </p>
                  <p className="text-sm text-white">{project.sector || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.09em] font-semibold text-white/45 mb-1">
                    Statut
                  </p>
                  <StatusToggle projectId={project.id} status={project.status} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.09em] font-semibold text-white/45 mb-1">
                    Début projet
                  </p>
                  <p className="text-sm text-white">{formatShortDate(project.start_date)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.09em] font-semibold text-white/45 mb-1">
                    Fin de projet
                  </p>
                  <p className="text-sm text-white">{formatShortDate(project.end_date)}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="relative text-sm text-white/70">Projet introuvable.</p>
        )}

        {project && (
          <div className="relative mt-8 pt-6 border-t border-white/10">
            <ProgressBar
              projectId={project.id}
              progressStep={project.progress_step}
              editable
              variant="dark"
            />
          </div>
        )}
      </div>

      <div className="flex gap-6 border-b border-white/55 mb-6 text-[13.5px]">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/agence/projets/${id}?tab=${t.key}`}
            className={`pb-3 -mb-px border-b-2 transition-colors ${
              tab === t.key
                ? "border-clay-500 text-ink-900 font-semibold"
                : "border-transparent text-ink-500 hover:text-ink-900"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "infos" ? (
        project ? (
          <ProjectBriefForm
            projectId={project.id}
            brief={(project.brief ?? {}) as Record<string, string>}
          />
        ) : (
          <p className="text-sm text-ink-500">Projet introuvable.</p>
        )
      ) : tab === "administratif" ? (
        project ? (
          <div>
            <DocumentGrid
              documents={documents ?? []}
              projectId={project.id}
              addSlot={<DocumentUploadTrigger projectId={project.id} />}
            />
          </div>
        ) : (
          <p className="text-sm text-ink-500">Projet introuvable.</p>
        )
      ) : tab === "reglages" ? (
        project ? (
          <div className="flex flex-col gap-8">
            <div className="glass rounded-card p-5">
              <p className="text-sm font-medium mb-4">Paramètres généraux</p>
              <ProjectSettingsForm project={project} />
            </div>
            <div className="glass rounded-card p-5">
              <p className="text-sm font-medium mb-4">Personnes côté client</p>
              <ProjectClientInvites invites={clientInvites ?? []} projectId={project.id} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-500">Projet introuvable.</p>
        )
      ) : tab === "design" ? (
        project ? (
          !section ? (
            <DesignGrid
              essentiel={essentielCards}
              complements={complementCards}
              sectionHrefTemplate={`/agence/projets/${id}?tab=design&section={key}`}
              addSectionSlot={
                <AddSectionForm projectId={project.id} availableSectionTypes={availableSectionTypes} />
              }
              projectId={project.id}
            />
          ) : isEssentielSection ? (
            <div>
              <Link
                href={`/agence/projets/${id}?tab=design`}
                className="text-sm text-ink-500 hover:text-clay-600 mb-4 inline-block"
              >
                ← Design
              </Link>
              {section === "couleur" ? (
                <ColorGrid
                  assets={assets ?? []}
                  projectId={project.id}
                  addSlot={<AssetUploadTrigger projectId={project.id} type="couleur" />}
                />
              ) : (
                <AssetGrid
                  assets={assets ?? []}
                  type={section as AssetType}
                  projectId={project.id}
                  addSlot={<AssetUploadTrigger projectId={project.id} type={section as AssetType} />}
                />
              )}
            </div>
          ) : currentSection ? (
            <div>
              <Link
                href={`/agence/projets/${id}?tab=design`}
                className="text-sm text-ink-500 hover:text-clay-600 mb-4 inline-block"
              >
                ← Design
              </Link>
              <p className="text-sm font-medium mb-4">
                {currentSection.section_types.icon} {currentSection.section_types.label}{" "}
                <span className="text-ink-400 font-normal">
                  ({(sectionAssets ?? []).length})
                </span>
              </p>
              <SectionAssetGrid
                assets={sectionAssets ?? []}
                projectId={project.id}
                projectSectionId={currentSection.id}
                template={currentSection.section_types.template}
                addSlot={
                  <SectionAssetUploadTrigger
                    projectId={project.id}
                    projectSectionId={currentSection.id}
                  />
                }
              />
            </div>
          ) : (
            <p className="text-sm text-ink-500">Section introuvable.</p>
          )
        ) : (
          <p className="text-sm text-ink-500">Projet introuvable.</p>
        )
      ) : null}
    </div>
  );
}
