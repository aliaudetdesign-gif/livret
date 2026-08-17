// Utilitaires purs (pas de "use server") pour retrouver les chemins de
// storage à partir d'URLs publiques Supabase. Partagés par les actions qui
// suppriment des fichiers (édition, corbeille).

import type { AssetType, LogoFormatExtra } from "@/lib/types";

const FILE_TYPES: AssetType[] = ["logo", "moodboard", "guide"];

// Retrouve le chemin de storage (ex: "projectId/logo/123-fichier.png") à partir
// d'une public URL Supabase, pour pouvoir supprimer le fichier sous-jacent.
export function extractStoragePath(url: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length));
}

// Regroupe tous les chemins de storage liés à un brand_asset (fichier principal,
// police pour la typographie, ou déclinaisons SVG/PNG/PDF pour un logo) afin de
// tout nettoyer au moment de la suppression définitive.
export function collectAssetStoragePaths(asset: {
  type: string;
  value: string;
  metadata: Record<string, unknown> | null;
}): string[] {
  const paths = new Set<string>();

  if (FILE_TYPES.includes(asset.type as AssetType)) {
    const path = extractStoragePath(asset.value, "brand-assets");
    if (path) paths.add(path);
  }

  const fileUrl = asset.metadata?.fileUrl;
  if (typeof fileUrl === "string") {
    const path = extractStoragePath(fileUrl, "brand-assets");
    if (path) paths.add(path);
  }

  const formats = asset.metadata?.formats as Record<string, unknown> | undefined;
  if (formats) {
    for (const url of Object.values(formats)) {
      if (typeof url === "string") {
        const path = extractStoragePath(url, "brand-assets");
        if (path) paths.add(path);
      }
    }
  }

  const generatedPreview = asset.metadata?.generatedPreview;
  if (typeof generatedPreview === "string") {
    const path = extractStoragePath(generatedPreview, "brand-assets");
    if (path) paths.add(path);
  }

  const extraFormats = asset.metadata?.extraFormats as LogoFormatExtra[] | undefined;
  if (Array.isArray(extraFormats)) {
    for (const item of extraFormats) {
      if (item && typeof item.url === "string") {
        const path = extractStoragePath(item.url, "brand-assets");
        if (path) paths.add(path);
      }
    }
  }

  return Array.from(paths);
}

// Regroupe tous les chemins de storage liés à un section_asset (fichier
// principal, aperçu PDF, formats PDF/PNG/SVG déposés en mode "Plusieurs
// formats" et formats supplémentaires libres) afin de tout nettoyer au moment
// de la suppression définitive. Même principe que collectAssetStoragePaths,
// mais pour le bucket "project-sections" et la forme de SectionAsset (pas de
// champ `type`, `file_url` toujours renseigné qu'il s'agisse d'un fichier
// simple ou du format principal choisi en mode multi-format).
export function collectSectionAssetStoragePaths(asset: {
  file_url: string;
  preview_url: string | null;
  metadata: Record<string, unknown> | null;
}): string[] {
  const paths = new Set<string>();
  const bucket = "project-sections";

  const filePath = extractStoragePath(asset.file_url, bucket);
  if (filePath) paths.add(filePath);

  if (asset.preview_url) {
    const previewPath = extractStoragePath(asset.preview_url, bucket);
    if (previewPath) paths.add(previewPath);
  }

  const formats = asset.metadata?.formats as Record<string, unknown> | undefined;
  if (formats) {
    for (const url of Object.values(formats)) {
      if (typeof url === "string") {
        const path = extractStoragePath(url, bucket);
        if (path) paths.add(path);
      }
    }
  }

  const generatedPreview = asset.metadata?.generatedPreview;
  if (typeof generatedPreview === "string") {
    const path = extractStoragePath(generatedPreview, bucket);
    if (path) paths.add(path);
  }

  const extraFormats = asset.metadata?.extraFormats as LogoFormatExtra[] | undefined;
  if (Array.isArray(extraFormats)) {
    for (const item of extraFormats) {
      if (item && typeof item.url === "string") {
        const path = extractStoragePath(item.url, bucket);
        if (path) paths.add(path);
      }
    }
  }

  return Array.from(paths);
}
