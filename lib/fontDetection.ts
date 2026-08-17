// Détection automatique de la graisse d'un fichier de police, entièrement
// côté navigateur (opentype.js lit les tables OpenType/TrueType directement
// depuis l'ArrayBuffer, pas besoin de passer par le serveur).
//
// Ordre de priorité :
// 1. Table `name` (sous-famille typographique / sous-famille), la plus fiable
//    car c'est le libellé choisi par le fondeur ("Semi Bold", "Bold Italic"...).
// 2. À défaut, `OS/2.usWeightClass` mappé sur un libellé standard, complété
//    par l'italique détecté via `head.macStyle`.
// 3. En dernier recours, "Regular".
//
// Best effort : une police malformée ou un format non supporté ne doit
// jamais bloquer l'ajout, on retombe simplement sur "Regular".

const WEIGHT_CLASS_LABELS: Record<number, string> = {
  100: "Thin",
  200: "Extra Light",
  300: "Light",
  400: "Regular",
  500: "Medium",
  600: "Semi Bold",
  700: "Bold",
  800: "Extra Bold",
  900: "Black",
};

function firstLocalizedValue(record: Record<string, string> | undefined): string | undefined {
  if (!record) return undefined;
  return record.en ?? Object.values(record)[0];
}

export async function detectFontWeight(file: File): Promise<string> {
  try {
    const opentype = await import("opentype.js");
    const buffer = await file.arrayBuffer();
    const font = opentype.parse(buffer);

    const names = font.names as unknown as Record<string, Record<string, string> | undefined>;
    const fromTable =
      firstLocalizedValue(names.preferredSubfamily) ?? firstLocalizedValue(names.fontSubfamily);

    if (fromTable && fromTable.trim() && fromTable.trim().toLowerCase() !== "regular") {
      return fromTable.trim();
    }

    const os2 = font.tables?.os2 as { usWeightClass?: number } | undefined;
    const head = font.tables?.head as { macStyle?: number } | undefined;
    const weightClass = os2?.usWeightClass;
    const isItalic = !!(head?.macStyle && head.macStyle & 2);
    const base = (weightClass && WEIGHT_CLASS_LABELS[weightClass]) || fromTable?.trim() || "Regular";

    return isItalic ? `${base} Italic` : base;
  } catch {
    return "Regular";
  }
}

export const FONT_FILE_EXTENSIONS = [".woff2", ".woff", ".ttf", ".otf"];

// Traduit un libellé de graisse ("Semi Bold", "Bold Italic"...) en descripteurs
// CSS pour une déclaration @font-face : en enregistrant chaque fichier sous la
// même font-family avec le bon `font-weight`/`font-style`, le navigateur
// choisit automatiquement le bon fichier selon le poids demandé par le texte
// (ex: une classe Tailwind `font-bold` ira chercher la variante 700).
const CSS_WEIGHT_BY_LABEL: Record<string, number> = {
  thin: 100,
  hairline: 100,
  "extra light": 200,
  "ultra light": 200,
  light: 300,
  regular: 400,
  normal: 400,
  book: 400,
  medium: 500,
  "semi bold": 600,
  semibold: 600,
  "demi bold": 600,
  bold: 700,
  "extra bold": 800,
  "ultra bold": 800,
  black: 900,
  heavy: 900,
};

export function weightLabelToCssDescriptor(label: string): { weight: number; style: "italic" | "normal" } {
  const normalized = label.toLowerCase().trim();
  const isItalic = normalized.includes("italic") || normalized.includes("oblique");
  const base = normalized.replace(/italic|oblique/g, "").replace(/\s+/g, " ").trim();

  const weight = CSS_WEIGHT_BY_LABEL[base] ?? 400;
  return { weight, style: isItalic ? "italic" : "normal" };
}
