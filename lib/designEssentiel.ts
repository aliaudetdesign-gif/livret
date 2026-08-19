import type { AssetType } from "@/lib/types";

// Source unique pour les 4 catégories "Essentiel" du design (Logos, Couleurs,
// Typographies, Guide). Utilisée par la grille /espace/design, la page de
// détail /espace/design/[section] (labels/clés) et la sidebar client (liens
// rapides une fois dans une section). "moodboard" reste un AssetType valide
// mais n'est plus une catégorie Essentiel (voir migration 024) : basculé en
// section Compléments.
export const ESSENTIEL_SECTIONS: {
  key: Exclude<AssetType, "moodboard">;
  label: string;
  icon: string;
}[] = [
  { key: "logo", label: "Logos", icon: "🖼️" },
  { key: "couleur", label: "Couleurs", icon: "🎨" },
  { key: "typographie", label: "Typographies", icon: "Aa" },
  { key: "guide", label: "Guide d'utilisation", icon: "📘" },
];
