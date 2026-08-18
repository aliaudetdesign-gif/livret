// Types partagés, reflètent le schéma défini dans supabase/schema.sql

export type Role = "agence" | "client";

export type ProjectStatus = "en_cours" | "attente_validation" | "livre";

// Étape du projet dans son avancement global, indépendante du statut.
// 0 = orientation, 1 = idéation, 2 = création, 3 = déploiement, 4 = fin de projet.
export const PROGRESS_STEPS = [
  "orientation",
  "ideation",
  "creation",
  "deploiement",
  "fin_de_projet",
] as const;
export type ProgressStep = 0 | 1 | 2 | 3 | 4;

export interface Profile {
  id: string; // = auth.users.id
  role: Role;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  notify_new_message: boolean;
  notify_new_document: boolean;
  professional_link: string | null; // LinkedIn / site / portfolio, agence uniquement
  is_demo_account: boolean; // compte recruteur dédié, scopé is_demo=true par la RLS
  created_at: string;
}

export interface Project {
  id: string;
  client_profile_id: string; // profil du client rattaché à ce projet
  name: string; // ex: "Maison Léa"
  sector: string; // ex: "Décoration & Lifestyle"
  city: string;
  description: string | null; // courte description affichée dans le bloc d'identité de marque
  status: ProjectStatus;
  progress_step: ProgressStep;
  start_date: string | null;
  end_date: string | null;
  archived: boolean;
  is_demo: boolean; // projet de démonstration, isolé des vrais projets clients
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type AssetType = "logo" | "couleur" | "typographie" | "moodboard" | "guide";

// Groupe d'affichage d'une couleur dans la palette (mockup "Livret couleurs").
export type ColorCategory = "primaire" | "secondaire";

// Format dans lequel l'agence saisit la couleur de référence ; les deux autres
// représentations sont calculées automatiquement (voir lib/color.ts).
export type ColorInputFormat = "hex" | "rgb" | "cmyk";

// Contenu de BrandAsset.metadata quand type === "couleur". BrandAsset.value
// reste le code hexadécimal (calculé depuis la référence saisie par l'agence).
export interface ColorMetadata {
  category: ColorCategory;
  rgb: { r: number; g: number; b: number };
  cmyk: { c: number; m: number; y: number; k: number };
}

// Phrase d'explication affichée dans le popup d'aide pour chaque code couleur.
export const COLOR_FORMAT_DESCRIPTIONS: Record<ColorInputFormat, string> = {
  hex: "Code hexadécimal, format standard pour le web (CSS, HTML). Ex : #E07A5F.",
  rgb: "Rouge / Vert / Bleu, utilisé pour les écrans et le numérique (sites, applications, vidéos).",
  cmyk: "Cyan / Magenta / Jaune / Noir, utilisé pour l'impression (imprimeurs, packaging).",
};

export type TypographyCategory = "titrage" | "corps_de_texte" | "accent";

// Un fichier de police déposé, avec sa graisse détectée automatiquement
// (ou saisie manuellement en repli si la détection échoue).
export interface TypographyFile {
  weight: string; // ex: "Regular", "SemiBold", "Bold", "Italic"
  url: string;
  filename: string;
}

// Contenu de BrandAsset.metadata quand type === "typographie".
export interface TypographyMetadata {
  source: string | null; // ex: "Google Fonts - Libre", "Système"
  previewText: string;
  previewSubtext: string | null;
  weights: string[]; // ex: ["Regular", "SemiBold", "Bold", "Italic"], dérivé de `files`
  files: TypographyFile[]; // fichiers de police déposés par l'agence, un par graisse
  /** @deprecated conservé pour les entrées créées avant le passage au multi-fichiers */
  fileUrl?: string | null;
}

// Fond sur lequel une déclinaison de logo est prévue pour être utilisée.
export type LogoBackground = "dark" | "light" | "color";

// Phrase d'explication affichée en survol des formats standards (logo),
// pour aider à choisir le bon format selon l'usage.
export const LOGO_FORMAT_DESCRIPTIONS: Record<"svg" | "png" | "pdf", string> = {
  svg: "Format vectoriel, redimensionnable à l'infini sans perte de qualité : idéal pour l'impression grand format.",
  png: "Format avec fond transparent, adapté au web et aux usages numériques.",
  pdf: "Format universel, pratique pour l'impression et le partage rapide.",
};

// Format additionnel déclaré librement par l'agence (nom + fichier), en plus
// des trois formats standards (svg/png/pdf).
export interface LogoFormatExtra {
  label: string; // ex: "AI", "EPS", "Favicon ICO"
  url: string;
}

// Contenu de BrandAsset.metadata quand type === "logo". BrandAsset.value reste
// l'URL utilisée pour l'aperçu (le premier format déposé, par ordre svg > png > pdf).
export interface LogoMetadata {
  background: LogoBackground;
  subtitle: string | null; // ex: "Monogramme", "Version couleur"
  formats: {
    svg?: string;
    png?: string;
    pdf?: string;
  };
  extraFormats?: LogoFormatExtra[]; // formats supplémentaires ajoutés librement (à la création ou en édition)
  generatedPreview?: string | null; // aperçu PNG généré côté client depuis un PDF seul, pour l'affichage
}

// Contenu de BrandAsset.metadata quand type === "guide". BrandAsset.value
// reste l'URL du PDF déposé. Un élément = un PDF (comme le moodboard, mais
// pour des fichiers PDF plutôt que des images).
export interface GuideMetadata {
  generatedPreview: string | null; // aperçu PNG généré côté client depuis la 1re page du PDF
}

export interface BrandAsset {
  id: string;
  project_id: string;
  type: AssetType;
  label: string;
  value: string; // hex pour une couleur, catégorie pour une typo, URL de fichier pour logo/moodboard
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export type DocumentCategory = "devis" | "facture" | "brief";

export interface ProjectDocument {
  id: string;
  project_id: string;
  category: DocumentCategory;
  label: string;
  file_url: string;
  created_at: string;
}

export type SectionTemplate = "video" | "figma" | "mockup" | "moodboard" | "illustrations" | "packaging";

export interface SectionType {
  id: string;
  key: string;
  label: string;
  icon: string;
  template: SectionTemplate | null;
  created_at: string;
}

export interface ProjectSection {
  id: string;
  project_id: string;
  section_type_id: string;
  created_at: string;
  section_types: SectionType; // section jointe (embed Supabase)
}

// Contenu de SectionAsset.metadata quand le designer a choisi le mode
// "Plusieurs formats" à l'ajout (optionnel, décidé au cas par cas, pas lié au
// type de section). Même principe que LogoMetadata.formats/extraFormats,
// sans les champs fond/sous-titre qui n'ont pas de sens hors logo.
export interface SectionAssetMetadata {
  formats: {
    pdf?: string;
    png?: string;
    svg?: string;
  };
  extraFormats?: LogoFormatExtra[];
  generatedPreview?: string | null;
}

export interface SectionAsset {
  id: string;
  project_section_id: string;
  label: string;
  file_url: string;
  file_type: string;
  // Aperçu généré côté client pour les PDF (même principe que generatedPreview
  // sur les logos), affiché à la place de l'icône PDF générique quand présent.
  preview_url: string | null;
  // Renseigné uniquement pour un fichier ajouté en mode "Plusieurs formats"
  // (voir SectionAssetMetadata) ; null pour un fichier simple.
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export type MessageType = "text" | "rendezvous";

export type RendezVousStatus = "pending" | "accepted" | "declined";

export interface RendezVousMetadata {
  date: string; // format ISO (yyyy-mm-dd)
  heure: string; // format HH:mm
  lieu: string | null;
  status: RendezVousStatus;
}

export interface Message {
  id: string;
  project_id: string;
  sender_profile_id: string;
  content: string;
  read: boolean;
  type: MessageType;
  metadata: RendezVousMetadata | null;
  created_at: string;
}

export type SubscriptionStatus = "actif" | "en_pause" | "annule";

export interface Subscription {
  id: string;
  plan_name: string;
  status: SubscriptionStatus;
  price_label: string;
  renewal_date: string | null;
  created_at: string;
}

export type InviteStatus = "en_attente" | "acceptee";

export interface AgencyInvite {
  id: string;
  email: string;
  full_name: string;
  status: InviteStatus;
  invited_by: string | null;
  created_at: string;
}

export interface ProjectClientInvite {
  id: string;
  project_id: string;
  email: string;
  full_name: string;
  status: InviteStatus;
  invited_by: string | null;
  created_at: string;
}
