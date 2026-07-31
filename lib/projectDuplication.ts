import { createClient } from "@/lib/supabase/server";
import type { AssetType, LogoFormatExtra } from "@/lib/types";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// Extrait le chemin de stockage (ex: "projectId/logo/svg/xxx.svg") depuis une
// URL publique Supabase Storage, pour pouvoir copier le fichier vers un autre
// chemin dans le même bucket.
function extractStoragePath(publicUrl: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}

// Copie un fichier existant vers un nouveau chemin (nouveau projet) dans le
// même bucket, pour obtenir une copie indépendante : la suppression
// définitive d'un fichier dans un projet ne casse pas l'autre.
async function copyStorageFile(
  supabase: SupabaseClient,
  bucket: string,
  sourceUrl: string,
  newProjectId: string,
  subfolder: string
): Promise<string | null> {
  const sourcePath = extractStoragePath(sourceUrl, bucket);
  if (!sourcePath) return null;

  const fileName = sourcePath.split("/").pop() ?? `${Date.now()}`;
  const newPath = `${newProjectId}/${subfolder}/${Date.now()}-${fileName}`;

  const { error } = await supabase.storage.from(bucket).copy(sourcePath, newPath);
  if (error) return null;

  const { data } = supabase.storage.from(bucket).getPublicUrl(newPath);
  return data.publicUrl;
}

// Duplique la charte graphique (logo, couleur, typographie, moodboard) de
// plusieurs projets sources vers un nouveau projet, pour un même client.
// Chaque fichier est réellement copié dans le storage (pas de simple partage
// d'URL), afin que les deux projets restent indépendants.
export async function duplicateBrandAssetsForNewProject(
  supabase: SupabaseClient,
  sourceProjectIds: string[],
  newProjectId: string
): Promise<void> {
  if (sourceProjectIds.length === 0) return;

  const { data: assets } = await supabase
    .from("brand_assets")
    .select("*")
    .in("project_id", sourceProjectIds)
    .is("deleted_at", null);

  for (const asset of assets ?? []) {
    const type = asset.type as AssetType;
    let value = asset.value as string;
    let metadata = (asset.metadata as Record<string, unknown> | null) ?? null;

    if (type === "logo" && metadata) {
      const formats = (metadata.formats as Record<string, string>) ?? {};
      const newFormats: Record<string, string> = {};

      for (const key of ["svg", "png", "pdf"] as const) {
        const url = formats[key];
        if (!url) continue;
        const copied = await copyStorageFile(supabase, "brand-assets", url, newProjectId, `logo/${key}`);
        if (copied) newFormats[key] = copied;
      }

      const extraFormats = (metadata.extraFormats as LogoFormatExtra[] | undefined) ?? [];
      const newExtraFormats: LogoFormatExtra[] = [];
      for (const extra of extraFormats) {
        const copied = await copyStorageFile(supabase, "brand-assets", extra.url, newProjectId, "logo/extra");
        if (copied) newExtraFormats.push({ label: extra.label, url: copied });
      }

      let generatedPreview = (metadata.generatedPreview as string | null | undefined) ?? null;
      if (generatedPreview) {
        generatedPreview = await copyStorageFile(
          supabase,
          "brand-assets",
          generatedPreview,
          newProjectId,
          "logo/preview"
        );
      }

      value = newFormats.svg ?? newFormats.png ?? newFormats.pdf ?? value;
      metadata = {
        ...metadata,
        formats: newFormats,
        extraFormats: newExtraFormats.length > 0 ? newExtraFormats : undefined,
        generatedPreview,
      };
    } else if (type === "typographie" && metadata) {
      const fileUrl = metadata.fileUrl as string | null;
      let newFileUrl: string | null = null;
      if (fileUrl) {
        newFileUrl = await copyStorageFile(supabase, "brand-assets", fileUrl, newProjectId, "typographie");
      }
      metadata = { ...metadata, fileUrl: newFileUrl };
    } else if (type === "moodboard") {
      const copied = await copyStorageFile(supabase, "brand-assets", value, newProjectId, "moodboard");
      if (copied) value = copied;
    }
    // type "couleur" : aucun fichier, la valeur (hex) et les metadata (rgb/cmjn)
    // sont réutilisées telles quelles.

    await supabase.from("brand_assets").insert({
      project_id: newProjectId,
      type,
      label: asset.label,
      value,
      metadata,
    });
  }
}

// Duplique les documents administratifs de type devis/facture (pas les
// briefs déposés) de plusieurs projets sources vers un nouveau projet.
export async function duplicateDocumentsForNewProject(
  supabase: SupabaseClient,
  sourceProjectIds: string[],
  newProjectId: string
): Promise<void> {
  if (sourceProjectIds.length === 0) return;

  const { data: documents } = await supabase
    .from("project_documents")
    .select("*")
    .in("project_id", sourceProjectIds)
    .in("category", ["devis", "facture"])
    .is("deleted_at", null);

  for (const doc of documents ?? []) {
    const copiedUrl = await copyStorageFile(
      supabase,
      "project-documents",
      doc.file_url as string,
      newProjectId,
      doc.category as string
    );
    if (!copiedUrl) continue;

    await supabase.from("project_documents").insert({
      project_id: newProjectId,
      category: doc.category,
      label: doc.label,
      file_url: copiedUrl,
    });
  }
}
