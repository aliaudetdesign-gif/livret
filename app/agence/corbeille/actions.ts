"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { collectAssetStoragePaths, extractStoragePath } from "@/lib/storagePaths";

export type TrashItemType =
  | "brand_asset"
  | "project_document"
  | "project_section"
  | "section_asset"
  | "project";

const TABLE_BY_TYPE: Record<TrashItemType, string> = {
  brand_asset: "brand_assets",
  project_document: "project_documents",
  project_section: "project_sections",
  section_asset: "section_assets",
  project: "projects",
};

function revalidateAll() {
  revalidatePath("/agence/corbeille");
  revalidatePath("/agence/dashboard");
  revalidatePath("/agence/projets");
  revalidatePath("/agence/messagerie");
  revalidatePath("/espace/dashboard");
  revalidatePath("/espace/logos");
  revalidatePath("/espace/moodboard");
  revalidatePath("/espace/typographies");
  revalidatePath("/espace/couleurs");
  revalidatePath("/espace/design");
  revalidatePath("/espace/administratif");
  revalidatePath("/espace/messagerie");
}

// Sort d'un élément de la corbeille (annule la suppression douce).
export async function restoreItem(
  type: TrashItemType,
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const table = TABLE_BY_TYPE[type];

  const { error } = await supabase.from(table).update({ deleted_at: null }).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  // Restaurer une section restaure aussi les fichiers qui avaient été
  // déplacés dans la corbeille en même temps qu'elle.
  if (type === "project_section") {
    await supabase.from("section_assets").update({ deleted_at: null }).eq("project_section_id", id);
  }

  revalidateAll();
  return { error: null };
}

// Nettoie le fichier storage associé à un élément, puis supprime la ligne
// pour de bon. Aucune restauration possible après cet appel.
async function purgeItem(
  supabase: Awaited<ReturnType<typeof createClient>>,
  type: TrashItemType,
  id: string
): Promise<{ error: string | null }> {
  const table = TABLE_BY_TYPE[type];

  if (type === "brand_asset") {
    const { data: asset, error: fetchError } = await supabase
      .from("brand_assets")
      .select("type, value, metadata")
      .eq("id", id)
      .single();

    if (fetchError || !asset) {
      return { error: fetchError?.message ?? "Élément introuvable." };
    }

    const paths = collectAssetStoragePaths(asset);
    if (paths.length > 0) {
      await supabase.storage.from("brand-assets").remove(paths);
    }
  } else if (type === "project_document") {
    const { data: document, error: fetchError } = await supabase
      .from("project_documents")
      .select("file_url")
      .eq("id", id)
      .single();

    if (fetchError || !document) {
      return { error: fetchError?.message ?? "Document introuvable." };
    }

    const path = extractStoragePath(document.file_url, "project-documents");
    if (path) {
      await supabase.storage.from("project-documents").remove([path]);
    }
  } else if (type === "section_asset") {
    const { data: asset, error: fetchError } = await supabase
      .from("section_assets")
      .select("file_url")
      .eq("id", id)
      .single();

    if (fetchError || !asset) {
      return { error: fetchError?.message ?? "Fichier introuvable." };
    }

    const path = extractStoragePath(asset.file_url, "project-sections");
    if (path) {
      await supabase.storage.from("project-sections").remove([path]);
    }
  } else if (type === "project_section") {
    const { data: assets, error: fetchError } = await supabase
      .from("section_assets")
      .select("file_url")
      .eq("project_section_id", id);

    if (fetchError) {
      return { error: fetchError.message };
    }

    const paths = (assets ?? [])
      .map((asset) => extractStoragePath(asset.file_url, "project-sections"))
      .filter((path): path is string => !!path);

    if (paths.length > 0) {
      await supabase.storage.from("project-sections").remove(paths);
    }
    // Le cascade en base supprime automatiquement les lignes section_assets
    // restantes liées à cette section.
  } else if (type === "project") {
    // Purger un projet entier : contrairement aux autres types, ses fichiers
    // n'ont pas forcément été marqués supprimés individuellement (le projet
    // lui-même a pu être mis à la corbeille sans que chaque élément le soit).
    // On nettoie donc tout le storage du projet, tous statuts confondus,
    // avant de laisser le cascade en base supprimer les lignes.
    const { data: assets } = await supabase
      .from("brand_assets")
      .select("type, value, metadata")
      .eq("project_id", id);

    for (const asset of assets ?? []) {
      const paths = collectAssetStoragePaths(asset);
      if (paths.length > 0) {
        await supabase.storage.from("brand-assets").remove(paths);
      }
    }

    const { data: documents } = await supabase
      .from("project_documents")
      .select("file_url")
      .eq("project_id", id);

    const documentPaths = (documents ?? [])
      .map((d) => extractStoragePath(d.file_url, "project-documents"))
      .filter((path): path is string => !!path);

    if (documentPaths.length > 0) {
      await supabase.storage.from("project-documents").remove(documentPaths);
    }

    const { data: sections } = await supabase
      .from("project_sections")
      .select("id")
      .eq("project_id", id);

    const sectionIds = (sections ?? []).map((s) => s.id);

    if (sectionIds.length > 0) {
      const { data: sectionAssets } = await supabase
        .from("section_assets")
        .select("file_url")
        .in("project_section_id", sectionIds);

      const sectionAssetPaths = (sectionAssets ?? [])
        .map((a) => extractStoragePath(a.file_url, "project-sections"))
        .filter((path): path is string => !!path);

      if (sectionAssetPaths.length > 0) {
        await supabase.storage.from("project-sections").remove(sectionAssetPaths);
      }
    }
    // Le cascade en base supprime ensuite brand_assets, project_documents,
    // project_sections (et donc section_assets) et messages liés au projet.
  }

  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

// Supprime définitivement un élément de la corbeille (fichier storage +
// ligne). Irréversible.
export async function permanentlyDeleteItem(
  type: TrashItemType,
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const result = await purgeItem(supabase, type, id);
  if (result.error) {
    return result;
  }

  revalidateAll();
  return { error: null };
}

// Vide entièrement la corbeille : supprime pour de bon tous les éléments
// actuellement marqués comme supprimés, tous types confondus. Irréversible.
export async function emptyTrash(): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const [
    { data: sectionAssets },
    { data: sections },
    { data: brandAssets },
    { data: documents },
    { data: projects },
  ] = await Promise.all([
    supabase.from("section_assets").select("id").not("deleted_at", "is", null),
    supabase.from("project_sections").select("id").not("deleted_at", "is", null),
    supabase.from("brand_assets").select("id").not("deleted_at", "is", null),
    supabase.from("project_documents").select("id").not("deleted_at", "is", null),
    supabase.from("projects").select("id").not("deleted_at", "is", null),
  ]);

  // Ordre important : les fichiers des section_assets sont nettoyés avant que
  // le cascade de suppression des project_sections ne retire leurs lignes.
  for (const item of sectionAssets ?? []) {
    await purgeItem(supabase, "section_asset", item.id);
  }
  for (const item of sections ?? []) {
    await purgeItem(supabase, "project_section", item.id);
  }
  for (const item of brandAssets ?? []) {
    await purgeItem(supabase, "brand_asset", item.id);
  }
  for (const item of documents ?? []) {
    await purgeItem(supabase, "project_document", item.id);
  }
  // Les projets sont purgés en dernier : leur propre nettoyage couvre déjà
  // tout ce qui n'aurait pas été supprimé individuellement au-dessus.
  for (const item of projects ?? []) {
    await purgeItem(supabase, "project", item.id);
  }

  revalidateAll();
  return { error: null };
}
