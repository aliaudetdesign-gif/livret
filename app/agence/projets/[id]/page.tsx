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
import { DeleteSectionButton } from "@/components/DeleteSectionButton";
import { ProjectSettingsForm } from "@/components/ProjectSettingsForm";
import { ProjectClientInvites } from "@/components/ProjectClientInvites";
import type { AssetType, ProjectSection } from "@/lib/types";

const ESSENTIEL: { key: AssetType; label: string; icon: string }[] = [
  { key: "logo", label: "Logos", icon: "🖼️" },
  { key: "couleur", label: "Couleurs", icon: "🎨" },
  { key: "typographie", label: "Typographies", icon: "Aa" },
  { key: "moodboard", label: "Visuels & Moodboard", icon: "📷" },
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
  }));

  const usedTypeIds = new Set((projectSections ?? []).map((ps) => ps.section_type_id));
  const availableSectionTypes = (allSectionTypes ?? []).filter((t) => !usedTypeIds.has(t.id));

  return (
    <div>
      <div className="bg-[var(--color-noir-doux)] rounded-2xl p-8 mb-6">
        {project ? (
          <div className="flex items-start justify-between gap-10">
            <div className="max-w-xl">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-terracotta)] mb-3">
                Identité de marque
              </p>
              <h1 className="text-3xl font-semibold text-white mb-3">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-zinc-300 leading-relaxed">{project.description}</p>
              )}
            </div>

            <div className="flex flex-col items-end gap-6 shrink-0">
              <Link
                href={`/agence/projets/${id}?tab=reglages`}
                className="text-sm text-[var(--color-terracotta)] underline underline-offset-2 hover:text-white transition-colors"
              >
                Gérer le projet
              </Link>
              <div className="grid grid-cols-2 gap-x-10 gap-y-4 text-right">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">Secteur</p>
                  <p className="text-sm text-white">{project.sector || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">Statut</p>
                  <StatusToggle projectId={project.id} status={project.status} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">
                    Début projet
                  </p>
                  <p className="text-sm text-white">{formatShortDate(project.start_date)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">
                    Fin de projet
                  </p>
                  <p className="text-sm text-white">{formatShortDate(project.end_date)}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">Projet introuvable.</p>
        )}

        {project && (
          <div className="mt-8 pt-6 border-t border-white/10">
            <ProgressBar
              projectId={project.id}
              progressStep={project.progress_step}
              editable
              variant="dark"
            />
          </div>
        )}
      </div>

      <div className="flex gap-6 border-b border-zinc-200 mb-6 text-sm">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/agence/projets/${id}?tab=${t.key}`}
            className={`pb-3 -mb-px border-b-2 ${
              tab === t.key
                ? "border-[var(--color-noir-doux)] font-medium"
                : "border-transparent text-zinc-500"
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
          <p className="text-sm text-zinc-500">Projet introuvable.</p>
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
          <p className="text-sm text-zinc-500">Projet introuvable.</p>
        )
      ) : tab === "reglages" ? (
        project ? (
          <div className="flex flex-col gap-8">
            <div className="bg-white border border-zinc-100 rounded-lg p-5">
              <p className="text-sm font-medium mb-4">Paramètres généraux</p>
              <ProjectSettingsForm project={project} />
            </div>
            <div className="bg-white border border-zinc-100 rounded-lg p-5">
              <p className="text-sm font-medium mb-4">Personnes côté client</p>
              <ProjectClientInvites invites={clientInvites ?? []} projectId={project.id} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Projet introuvable.</p>
        )
      ) : tab === "design" ? (
        project ? (
          !section ? (
            <DesignGrid
              essentiel={essentielCards}
              complements={complementCards}
              sectionHref={(key) => `/agence/projets/${id}?tab=design&section=${key}`}
              addSectionSlot={
                <AddSectionForm projectId={project.id} availableSectionTypes={availableSectionTypes} />
              }
            />
          ) : isEssentielSection ? (
            <div>
              <Link
                href={`/agence/projets/${id}?tab=design`}
                className="text-sm text-zinc-500 hover:text-[var(--color-terracotta)] mb-4 inline-block"
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
              <div className="flex items-center justify-between mb-4">
                <Link
                  href={`/agence/projets/${id}?tab=design`}
                  className="text-sm text-zinc-500 hover:text-[var(--color-terracotta)] inline-block"
                >
                  ← Design
                </Link>
                <DeleteSectionButton
                  projectId={project.id}
                  projectSectionId={currentSection.id}
                  sectionLabel={currentSection.section_types.label}
                />
              </div>
              <p className="text-sm font-medium mb-4">
                {currentSection.section_types.icon} {currentSection.section_types.label}
              </p>
              <SectionAssetGrid
                assets={sectionAssets ?? []}
                projectId={project.id}
                addSlot={
                  <SectionAssetUploadTrigger
                    projectId={project.id}
                    projectSectionId={currentSection.id}
                  />
                }
              />
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Section introuvable.</p>
          )
        ) : (
          <p className="text-sm text-zinc-500">Projet introuvable.</p>
        )
      ) : null}
    </div>
  );
}
