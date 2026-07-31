"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  AssetType,
  ColorCategory,
  ColorInputFormat,
  ColorMetadata,
  DocumentCategory,
  LogoBackground,
  LogoFormatExtra,
  LogoMetadata,
  ProgressStep,
  ProjectStatus,
} from "@/lib/types";
import { briefFieldKeys } from "@/lib/briefFields";
import { buildColorRepresentations, type ColorRepresentations } from "@/lib/color";

export type AssetActionState = { error: string | null };
export type BriefActionState = { error: string | null };
export type DocumentActionState = { error: string | null };
export type SectionActionState = { error: string | null };
export type SectionAssetActionState = { error: string | null };

const FILE_TYPES: AssetType[] = ["logo", "moodboard"];
const DOCUMENT_CATEGORIES: DocumentCategory[] = ["devis", "facture", "brief"];
const TYPOGRAPHY_CATEGORIES = ["titrage", "corps_de_texte", "accent"];
const FONT_EXTENSIONS = [".woff2", ".woff", ".ttf", ".otf"];
const COLOR_CATEGORIES: ColorCategory[] = ["primaire", "secondaire"];
const COLOR_FORMATS: ColorInputFormat[] = ["hex", "rgb", "cmyk"];

// Lit la saisie de couleur (format + valeurs) depuis le formulaire et calcule
// les trois représentations (hex/rgb/cmjn) via lib/color.ts.
function readColorInput(formData: FormData): ColorRepresentations | { error: string } {
  const format = (formData.get("color_format") as string)?.trim() as ColorInputFormat;
  if (!COLOR_FORMATS.includes(format)) {
    return { error: "Sélectionne un format de saisie (HEX, RGB ou CMJN)." };
  }

  if (format === "hex") {
    return buildColorRepresentations("hex", { hex: (formData.get("hex_value") as string) ?? "" });
  }

  if (format === "rgb") {
    return buildColorRepresentations("rgb", {
      r: Number(formData.get("rgb_r")),
      g: Number(formData.get("rgb_g")),
      b: Number(formData.get("rgb_b")),
    });
  }

  return buildColorRepresentations("cmyk", {
    c: Number(formData.get("cmyk_c")),
    m: Number(formData.get("cmyk_m")),
    y: Number(formData.get("cmyk_y")),
    k: Number(formData.get("cmyk_k")),
  });
}

function slugify(label: string): string {
  // normalize() décompose les accents (é -> e + accent), le replace suivant
  // élimine ensuite l'accent en même temps que tout caractère non alphanumérique.
  const slug = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || `section-${Date.now()}`;
}

// Lit les lignes "nom + fichier" envoyées par ExtraFormatFields
// (extra_label_0/extra_file_0, extra_label_1/...) et upload chaque fichier
// dans le bucket brand-assets. S'arrête au premier index manquant.
async function collectExtraFormats(
  formData: FormData,
  projectId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<{ extraFormats: LogoFormatExtra[]; error?: string }> {
  const extraFormats: LogoFormatExtra[] = [];
  let i = 0;

  while (formData.has(`extra_label_${i}`)) {
    const label = ((formData.get(`extra_label_${i}`) as string) ?? "").trim();
    const file = formData.get(`extra_file_${i}`) as File | null;
    i++;

    if (!label && (!file || file.size === 0)) continue; // ligne laissée vide

    if (!label) {
      return { extraFormats, error: "Indique un nom pour chaque format supplémentaire." };
    }
    if (!file || file.size === 0) {
      return { extraFormats, error: `Sélectionne un fichier pour le format "${label}".` };
    }

    const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${projectId}/logo/extra/${Date.now()}-${cleanName}`;

    const { error: uploadError } = await supabase.storage
      .from("brand-assets")
      .upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      return { extraFormats, error: uploadError.message };
    }

    const { data: publicUrlData } = supabase.storage.from("brand-assets").getPublicUrl(path);
    extraFormats.push({ label, url: publicUrlData.publicUrl });
  }

  return { extraFormats };
}

// Ajoute un élément de marque à un projet : upload d'image pour logo/moodboard,
// simple valeur texte pour typographie/couleur.
export async function addBrandAsset(
  _prevState: AssetActionState,
  formData: FormData
): Promise<AssetActionState> {
  const projectId = formData.get("project_id") as string;
  const type = formData.get("type") as AssetType;
  const label = (formData.get("label") as string)?.trim();

  if (!projectId || !type) {
    return { error: "Projet ou type manquant." };
  }
  if (!label) {
    return { error: "Le nom est requis." };
  }

  const supabase = await createClient();

  let value: string;
  let metadata: Record<string, unknown> | null = null;

  if (type === "typographie") {
    const category = (formData.get("category") as string)?.trim();
    if (!TYPOGRAPHY_CATEGORIES.includes(category)) {
      return { error: "Sélectionne une catégorie." };
    }

    const source = (formData.get("source") as string)?.trim();
    const previewText = (formData.get("preview_text") as string)?.trim();
    const previewSubtext = (formData.get("preview_subtext") as string)?.trim();
    const weights = ((formData.get("weights") as string) ?? "")
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);

    if (!previewText) {
      return { error: "Le texte d'aperçu est requis." };
    }

    let fileUrl: string | null = null;
    const file = formData.get("file") as File | null;

    if (file && file.size > 0) {
      const lowerName = file.name.toLowerCase();
      const hasValidExtension = FONT_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
      if (!hasValidExtension) {
        return { error: "Formats acceptés : WOFF2, WOFF, TTF, OTF." };
      }

      const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `${projectId}/typographie/${Date.now()}-${cleanName}`;

      const { error: uploadError } = await supabase.storage
        .from("brand-assets")
        .upload(path, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        return { error: uploadError.message };
      }

      const { data: publicUrlData } = supabase.storage.from("brand-assets").getPublicUrl(path);
      fileUrl = publicUrlData.publicUrl;
    }

    value = category;
    metadata = {
      source: source || null,
      previewText,
      previewSubtext: previewSubtext || null,
      weights,
      fileUrl,
    };
  } else if (type === "logo") {
    const background = (formData.get("background") as string)?.trim() as LogoBackground;
    if (!["dark", "light", "color"].includes(background)) {
      return { error: "Sélectionne un fond." };
    }
    const subtitle = (formData.get("subtitle") as string)?.trim();

    const formatInputs: { key: keyof LogoMetadata["formats"]; field: string; fallbackMime: string }[] = [
      { key: "svg", field: "svg_file", fallbackMime: "image/svg+xml" },
      { key: "png", field: "png_file", fallbackMime: "image/png" },
      { key: "pdf", field: "pdf_file", fallbackMime: "application/pdf" },
    ];

    const formats: LogoMetadata["formats"] = {};

    for (const { key, field, fallbackMime } of formatInputs) {
      const file = formData.get(field) as File | null;
      if (!file || file.size === 0) continue;

      const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `${projectId}/logo/${key}/${Date.now()}-${cleanName}`;

      const { error: uploadError } = await supabase.storage
        .from("brand-assets")
        .upload(path, file, { contentType: file.type || fallbackMime, upsert: false });

      if (uploadError) {
        return { error: uploadError.message };
      }

      const { data: publicUrlData } = supabase.storage.from("brand-assets").getPublicUrl(path);
      formats[key] = publicUrlData.publicUrl;
    }

    if (!formats.svg && !formats.png && !formats.pdf) {
      return { error: "Dépose au moins un fichier (SVG, PNG ou PDF)." };
    }

    // Si seul un PDF a été déposé, le navigateur a pu générer un aperçu PNG de
    // sa première page (voir AssetUploadForm) : on le stocke pour l'affichage.
    // Best effort : un échec ici ne bloque pas la création du logo.
    let generatedPreview: string | null = null;
    if (!formats.svg && !formats.png && formats.pdf) {
      const previewFile = formData.get("pdf_preview_file") as File | null;
      if (previewFile && previewFile.size > 0) {
        const previewPath = `${projectId}/logo/preview/${Date.now()}-preview.png`;
        const { error: previewUploadError } = await supabase.storage
          .from("brand-assets")
          .upload(previewPath, previewFile, { contentType: "image/png", upsert: false });

        if (!previewUploadError) {
          const { data: previewUrlData } = supabase.storage
            .from("brand-assets")
            .getPublicUrl(previewPath);
          generatedPreview = previewUrlData.publicUrl;
        }
      }
    }

    const { extraFormats, error: extraFormatsError } = await collectExtraFormats(
      formData,
      projectId,
      supabase
    );
    if (extraFormatsError) {
      return { error: extraFormatsError };
    }

    value = (formats.svg ?? formats.png ?? formats.pdf) as string;
    metadata = {
      background,
      subtitle: subtitle || null,
      formats,
      extraFormats: extraFormats.length > 0 ? extraFormats : undefined,
      generatedPreview,
    } satisfies LogoMetadata;
  } else if (type === "moodboard") {
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return { error: "Sélectionne un fichier." };
    }
    if (!file.type.startsWith("image/")) {
      return { error: "Seules les images sont acceptées." };
    }

    const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${projectId}/${type}/${Date.now()}-${cleanName}`;

    const { error: uploadError } = await supabase.storage
      .from("brand-assets")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      return { error: uploadError.message };
    }

    const { data: publicUrlData } = supabase.storage.from("brand-assets").getPublicUrl(path);
    value = publicUrlData.publicUrl;
  } else if (type === "couleur") {
    const category = (formData.get("color_category") as string)?.trim() as ColorCategory;
    if (!COLOR_CATEGORIES.includes(category)) {
      return { error: "Sélectionne une catégorie (primaire ou secondaire)." };
    }

    const result = readColorInput(formData);
    if ("error" in result) {
      return { error: result.error };
    }

    value = result.hex;
    metadata = {
      category,
      rgb: result.rgb,
      cmyk: result.cmyk,
    } satisfies ColorMetadata;
  } else {
    const textValue = (formData.get("value") as string)?.trim();
    if (!textValue) {
      return { error: "La valeur est requise." };
    }
    value = textValue;
  }

  const { error } = await supabase.from("brand_assets").insert({
    project_id: projectId,
    type,
    label,
    value,
    metadata,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/agence/projets/${projectId}`);
  revalidatePath("/agence/dashboard");
  revalidatePath("/espace/logos");
  revalidatePath("/espace/moodboard");
  revalidatePath("/espace/typographies");
  revalidatePath("/espace/couleurs");
  revalidatePath("/espace/dashboard");
  revalidatePath("/espace/design");

  return { error: null };
}

// Modifie un élément de marque existant (édition en direct depuis la carte).
// Le fichier lui-même n'est pas remplaçable ici, seulement le nom et la valeur
// (couleur, texte, infos d'aperçu typographie) — remplacer un fichier passe par
// une suppression + un nouvel ajout.
export async function updateBrandAsset(
  _prevState: AssetActionState,
  formData: FormData
): Promise<AssetActionState> {
  const assetId = formData.get("asset_id") as string;
  const projectId = formData.get("project_id") as string;
  const type = formData.get("type") as AssetType;
  const label = (formData.get("label") as string)?.trim();

  if (!assetId || !projectId || !type) {
    return { error: "Élément, projet ou type manquant." };
  }
  if (!label) {
    return { error: "Le nom est requis." };
  }

  const supabase = await createClient();
  const updates: Record<string, unknown> = { label };

  if (type === "typographie") {
    const source = (formData.get("source") as string)?.trim();
    const previewText = (formData.get("preview_text") as string)?.trim();
    const previewSubtext = (formData.get("preview_subtext") as string)?.trim();
    const weights = ((formData.get("weights") as string) ?? "")
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);

    if (!previewText) {
      return { error: "Le texte d'aperçu est requis." };
    }

    const { data: existing } = await supabase
      .from("brand_assets")
      .select("metadata")
      .eq("id", assetId)
      .single();

    updates.metadata = {
      ...((existing?.metadata as Record<string, unknown> | null) ?? {}),
      source: source || null,
      previewText,
      previewSubtext: previewSubtext || null,
      weights,
    };
  } else if (type === "logo") {
    // Édition d'un logo : nom, fond, sous-titre, et possibilité de joindre de
    // nouveaux formats supplémentaires (les formats SVG/PNG/PDF déjà déposés
    // restent en revanche non remplaçables ici).
    const background = (formData.get("background") as string)?.trim() as LogoBackground;
    if (!["dark", "light", "color"].includes(background)) {
      return { error: "Sélectionne un fond." };
    }
    const subtitle = (formData.get("subtitle") as string)?.trim();

    const { data: existing } = await supabase
      .from("brand_assets")
      .select("metadata")
      .eq("id", assetId)
      .single();

    const { extraFormats: newExtraFormats, error: extraFormatsError } = await collectExtraFormats(
      formData,
      projectId,
      supabase
    );
    if (extraFormatsError) {
      return { error: extraFormatsError };
    }

    const existingMetadata = (existing?.metadata as LogoMetadata | null) ?? null;
    const existingExtraFormats = existingMetadata?.extraFormats ?? [];

    updates.metadata = {
      ...(existingMetadata ?? {}),
      background,
      subtitle: subtitle || null,
      extraFormats: [...existingExtraFormats, ...newExtraFormats],
    };
  } else if (type === "couleur") {
    const category = (formData.get("color_category") as string)?.trim() as ColorCategory;
    if (!COLOR_CATEGORIES.includes(category)) {
      return { error: "Sélectionne une catégorie (primaire ou secondaire)." };
    }

    const result = readColorInput(formData);
    if ("error" in result) {
      return { error: result.error };
    }

    updates.value = result.hex;
    updates.metadata = {
      category,
      rgb: result.rgb,
      cmyk: result.cmyk,
    } satisfies ColorMetadata;
  } else if (!FILE_TYPES.includes(type)) {
    const textValue = (formData.get("value") as string)?.trim();
    if (!textValue) {
      return { error: "La valeur est requise." };
    }
    updates.value = textValue;
  }
  // Pour logo/moodboard, seul le nom est modifiable en édition rapide.

  const { error } = await supabase.from("brand_assets").update(updates).eq("id", assetId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/agence/projets/${projectId}`);
  revalidatePath("/espace/logos");
  revalidatePath("/espace/moodboard");
  revalidatePath("/espace/typographies");
  revalidatePath("/espace/couleurs");
  revalidatePath("/espace/dashboard");
  revalidatePath("/espace/design");

  return { error: null };
}

// Déplace un élément de marque dans la corbeille (suppression douce).
// Le fichier reste dans le storage tant que l'élément n'est pas supprimé
// définitivement, pour permettre une restauration.
export async function deleteBrandAsset(
  assetId: string,
  projectId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("brand_assets")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", assetId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/agence/projets/${projectId}`);
  revalidatePath("/agence/corbeille");
  revalidatePath("/espace/logos");
  revalidatePath("/espace/moodboard");
  revalidatePath("/espace/typographies");
  revalidatePath("/espace/couleurs");
  revalidatePath("/espace/dashboard");
  revalidatePath("/espace/design");

  return { error: null };
}

// Variante multiple pour la sélection groupée (checkbox sur les cartes).
export async function deleteBrandAssets(
  assetIds: string[],
  projectId: string
): Promise<{ error: string | null }> {
  if (assetIds.length === 0) {
    return { error: null };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("brand_assets")
    .update({ deleted_at: new Date().toISOString() })
    .in("id", assetIds);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/agence/projets/${projectId}`);
  revalidatePath("/agence/corbeille");
  revalidatePath("/espace/logos");
  revalidatePath("/espace/moodboard");
  revalidatePath("/espace/typographies");
  revalidatePath("/espace/couleurs");
  revalidatePath("/espace/dashboard");
  revalidatePath("/espace/design");

  return { error: null };
}

// Enregistre les réponses du brief (onglet Infos), modifiable à tout moment
// par l'agence. Toutes les réponses sont stockées dans projects.brief (jsonb).
export async function updateProjectBrief(
  _prevState: BriefActionState,
  formData: FormData
): Promise<BriefActionState> {
  const projectId = formData.get("project_id") as string;

  if (!projectId) {
    return { error: "Projet manquant." };
  }

  const brief: Record<string, string> = {};
  for (const key of briefFieldKeys) {
    brief[key] = ((formData.get(key) as string) ?? "").trim();
  }

  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ brief }).eq("id", projectId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/agence/projets/${projectId}`);

  return { error: null };
}

export type ProjectSettingsActionState = { error: string | null };

// Met à jour les paramètres généraux d'un projet (modifiables uniquement après
// création : nom, secteur, ville, statut, dates, archivage).
export async function updateProjectSettings(
  _prevState: ProjectSettingsActionState,
  formData: FormData
): Promise<ProjectSettingsActionState> {
  const projectId = formData.get("project_id") as string;
  const name = ((formData.get("name") as string) ?? "").trim();

  if (!projectId) {
    return { error: "Projet manquant." };
  }
  if (!name) {
    return { error: "Le nom du projet est requis." };
  }

  const sector = ((formData.get("sector") as string) ?? "").trim();
  const city = ((formData.get("city") as string) ?? "").trim();
  const description = ((formData.get("description") as string) ?? "").trim();
  const status = formData.get("status") as string;
  const startDate = (formData.get("start_date") as string) || null;
  const endDate = (formData.get("end_date") as string) || null;
  const archived = formData.get("archived") === "on";

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({
      name,
      sector,
      city,
      description: description || null,
      status,
      start_date: startDate,
      end_date: endDate,
      archived,
    })
    .eq("id", projectId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/agence/projets/${projectId}`);
  revalidatePath("/agence/projets");
  revalidatePath("/agence/dashboard");

  return { error: null };
}

const QUICK_STATUSES: ProjectStatus[] = ["en_cours", "attente_validation", "livre"];

// Bascule rapide du statut depuis le header du projet (agence), les trois
// statuts sont accessibles directement depuis la pastille unique.
export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus
): Promise<{ error: string | null }> {
  if (!projectId) {
    return { error: "Projet manquant." };
  }
  if (!QUICK_STATUSES.includes(status)) {
    return { error: "Statut invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ status }).eq("id", projectId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/agence/projets/${projectId}`);
  revalidatePath("/agence/projets");
  revalidatePath("/agence/dashboard");
  revalidatePath("/espace/dashboard");

  return { error: null };
}

// Déplace un projet entier dans la corbeille (suppression douce), depuis le
// menu rapide d'une carte projet. Restauration possible depuis /agence/corbeille
// tant que la suppression n'est pas définitive (voir app/agence/corbeille/actions.ts).
export async function deleteProject(projectId: string): Promise<{ error: string | null }> {
  if (!projectId) {
    return { error: "Projet manquant." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", projectId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/agence/projets/${projectId}`);
  revalidatePath("/agence/projets");
  revalidatePath("/agence/dashboard");
  revalidatePath("/agence/messagerie");
  revalidatePath("/agence/corbeille");
  revalidatePath("/espace/dashboard");

  return { error: null };
}

// Avance ou recule l'étape d'avancement du projet (0 = orientation, 4 = fin de projet).
export async function updateProjectProgress(
  projectId: string,
  step: ProgressStep
): Promise<{ error: string | null }> {
  if (!projectId) {
    return { error: "Projet manquant." };
  }
  if (step < 0 || step > 4) {
    return { error: "Étape invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ progress_step: step })
    .eq("id", projectId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/agence/projets/${projectId}`);
  revalidatePath("/agence/projets");
  revalidatePath("/agence/dashboard");
  revalidatePath("/espace/dashboard");

  return { error: null };
}

// Dépose un document administratif (devis, facture, brief) sur un projet.
// Toujours un fichier PDF, visible par l'agence et le client une fois ajouté.
export async function addProjectDocument(
  _prevState: DocumentActionState,
  formData: FormData
): Promise<DocumentActionState> {
  const projectId = formData.get("project_id") as string;
  const category = formData.get("category") as DocumentCategory;
  const label = (formData.get("label") as string)?.trim();
  const file = formData.get("file") as File | null;

  if (!projectId || !DOCUMENT_CATEGORIES.includes(category)) {
    return { error: "Projet ou catégorie manquant." };
  }
  if (!label) {
    return { error: "Le nom est requis." };
  }
  if (!file || file.size === 0) {
    return { error: "Sélectionne un fichier." };
  }
  if (file.type !== "application/pdf") {
    return { error: "Seuls les fichiers PDF sont acceptés." };
  }

  const supabase = await createClient();

  const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${projectId}/${category}/${Date.now()}-${cleanName}`;

  const { error: uploadError } = await supabase.storage
    .from("project-documents")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data: publicUrlData } = supabase.storage.from("project-documents").getPublicUrl(path);

  const { error } = await supabase.from("project_documents").insert({
    project_id: projectId,
    category,
    label,
    file_url: publicUrlData.publicUrl,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/agence/projets/${projectId}`);
  revalidatePath("/espace/administratif");

  return { error: null };
}

// Déplace un document administratif dans la corbeille (suppression douce).
export async function deleteProjectDocument(
  documentId: string,
  projectId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("project_documents")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", documentId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/agence/projets/${projectId}`);
  revalidatePath("/agence/corbeille");
  revalidatePath("/espace/administratif");

  return { error: null };
}

// Variante multiple pour la sélection groupée de documents.
export async function deleteProjectDocuments(
  documentIds: string[],
  projectId: string
): Promise<{ error: string | null }> {
  if (documentIds.length === 0) {
    return { error: null };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("project_documents")
    .update({ deleted_at: new Date().toISOString() })
    .in("id", documentIds);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/agence/projets/${projectId}`);
  revalidatePath("/agence/corbeille");
  revalidatePath("/espace/administratif");

  return { error: null };
}

// Active une section complémentaire sur un projet (onglet Design). Soit à
// partir d'une section déjà existante dans la bibliothèque, soit en créant
// une nouvelle entrée de bibliothèque (réutilisable sur d'autres projets).
export async function createProjectSection(
  _prevState: SectionActionState,
  formData: FormData
): Promise<SectionActionState> {
  const projectId = formData.get("project_id") as string;
  const mode = formData.get("mode") as string;

  if (!projectId) {
    return { error: "Projet manquant." };
  }

  const supabase = await createClient();
  let sectionTypeId: string;

  if (mode === "existing") {
    sectionTypeId = formData.get("section_type_id") as string;
    if (!sectionTypeId) {
      return { error: "Sélectionne une section." };
    }
  } else {
    const label = (formData.get("label") as string)?.trim();
    const icon = (formData.get("icon") as string)?.trim() || "📁";

    if (!label) {
      return { error: "Le nom de la section est requis." };
    }

    const { data: newType, error: createError } = await supabase
      .from("section_types")
      .insert({ key: slugify(label), label, icon })
      .select("id")
      .single();

    if (createError || !newType) {
      return { error: createError?.message ?? "Impossible de créer la section." };
    }

    sectionTypeId = newType.id;
  }

  const { error } = await supabase
    .from("project_sections")
    .insert({ project_id: projectId, section_type_id: sectionTypeId });

  if (error && error.code !== "23505") {
    // 23505 = déjà activée sur ce projet, on ignore silencieusement
    return { error: error.message };
  }

  revalidatePath(`/agence/projets/${projectId}`);
  revalidatePath("/espace/design");

  return { error: null };
}

// Dépose un document (image ou PDF) dans une section complémentaire.
export async function addSectionAsset(
  _prevState: SectionAssetActionState,
  formData: FormData
): Promise<SectionAssetActionState> {
  const projectId = formData.get("project_id") as string;
  const projectSectionId = formData.get("project_section_id") as string;
  const label = (formData.get("label") as string)?.trim();
  const file = formData.get("file") as File | null;

  if (!projectId || !projectSectionId) {
    return { error: "Section manquante." };
  }
  if (!label) {
    return { error: "Le nom est requis." };
  }
  if (!file || file.size === 0) {
    return { error: "Sélectionne un fichier." };
  }
  const allowed = file.type.startsWith("image/") || file.type === "application/pdf";
  if (!allowed) {
    return { error: "Formats acceptés : PNG, SVG, PDF." };
  }

  const supabase = await createClient();

  const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${projectId}/${projectSectionId}/${Date.now()}-${cleanName}`;

  const { error: uploadError } = await supabase.storage
    .from("project-sections")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data: publicUrlData } = supabase.storage.from("project-sections").getPublicUrl(path);

  const { error } = await supabase.from("section_assets").insert({
    project_section_id: projectSectionId,
    label,
    file_url: publicUrlData.publicUrl,
    file_type: file.type,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/agence/projets/${projectId}`);
  revalidatePath("/espace/design");

  return { error: null };
}

// Déplace un fichier d'une section complémentaire dans la corbeille.
export async function deleteSectionAsset(
  assetId: string,
  projectId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("section_assets")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", assetId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/agence/projets/${projectId}`);
  revalidatePath("/agence/corbeille");
  revalidatePath("/espace/design");

  return { error: null };
}

// Variante multiple pour la sélection groupée de fichiers d'une section.
export async function deleteSectionAssets(
  assetIds: string[],
  projectId: string
): Promise<{ error: string | null }> {
  if (assetIds.length === 0) {
    return { error: null };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("section_assets")
    .update({ deleted_at: new Date().toISOString() })
    .in("id", assetIds);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/agence/projets/${projectId}`);
  revalidatePath("/agence/corbeille");
  revalidatePath("/espace/design");

  return { error: null };
}

// Déplace une section complémentaire entière dans la corbeille, ainsi que
// tous ses section_assets enfants (pour qu'une restauration de la section
// restaure aussi ses fichiers).
export async function deleteProjectSection(
  projectSectionId: string,
  projectId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const deletedAt = new Date().toISOString();

  const { error: assetsError } = await supabase
    .from("section_assets")
    .update({ deleted_at: deletedAt })
    .eq("project_section_id", projectSectionId)
    .is("deleted_at", null);

  if (assetsError) {
    return { error: assetsError.message };
  }

  const { error } = await supabase
    .from("project_sections")
    .update({ deleted_at: deletedAt })
    .eq("id", projectSectionId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/agence/projets/${projectId}`);
  revalidatePath("/agence/corbeille");
  revalidatePath("/espace/design");

  return { error: null };
}

export type ProjectClientInviteActionState = { error: string | null };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Suivi d'une personne côté client à inviter sur ce projet, en plus du client
// principal. Pas de création de compte Supabase Auth automatique (nécessiterait
// une clé service-role côté serveur) : le compte est créé manuellement ensuite.
export async function inviteProjectClient(
  _prevState: ProjectClientInviteActionState,
  formData: FormData
): Promise<ProjectClientInviteActionState> {
  const projectId = formData.get("project_id") as string;
  const email = ((formData.get("email") as string) ?? "").trim();
  const fullName = ((formData.get("full_name") as string) ?? "").trim();

  if (!projectId) {
    return { error: "Projet manquant." };
  }
  if (!fullName || !email) {
    return { error: "Nom et email sont requis." };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Adresse email invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("project_client_invites").insert({
    project_id: projectId,
    email,
    full_name: fullName,
    invited_by: user?.id ?? null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/agence/projets/${projectId}`);

  return { error: null };
}

export async function removeProjectClientInvite(
  inviteId: string,
  projectId: string
): Promise<{ error: string | null }> {
  if (!inviteId) {
    return { error: "Invitation manquante." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("project_client_invites").delete().eq("id", inviteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/agence/projets/${projectId}`);

  return { error: null };
}
