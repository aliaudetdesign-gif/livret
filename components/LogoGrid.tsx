import { LogoCard, FORMAT_LABELS, type FormatKey } from "@/components/LogoCard";
import type { BrandAsset, LogoMetadata } from "@/lib/types";

const RECENT_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

function isRecentlyAdded(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < RECENT_THRESHOLD_MS;
}

function joinFr(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}

// Sous-titre d'en-tête façon PDF : "6 déclinaisons disponibles - SVG, PNG et PDF".
export function describeLogoFormats(assets: BrandAsset[]): string {
  if (assets.length === 0) {
    return "Toutes les déclinaisons de ton logo, prêtes à télécharger.";
  }

  const formatSet = new Set<FormatKey>();
  for (const asset of assets) {
    const metadata = asset.metadata as unknown as LogoMetadata | null;
    if (!metadata?.formats) continue;
    for (const key of Object.keys(metadata.formats) as FormatKey[]) {
      if (metadata.formats[key]) formatSet.add(key);
    }
  }

  const count = assets.length;
  const label = count > 1 ? "déclinaisons disponibles" : "déclinaison disponible";
  const formatsList = joinFr(Array.from(formatSet).map((key) => FORMAT_LABELS[key]));

  return formatsList ? `${count} ${label} - ${formatsList}` : `${count} ${label}`;
}

// Grille de logos en lecture seule, côté client (pas de projectId : ni édition,
// ni suppression, ni sélection).
export function LogoGrid({ assets }: { assets: BrandAsset[] }) {
  if (assets.length === 0) {
    return (
      <p className="text-sm text-zinc-400">
        Rien à afficher pour l&apos;instant, ton agence n&apos;a pas encore ajouté
        d&apos;éléments ici.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {assets.map((asset) => (
        <LogoCard key={asset.id} asset={asset} recentlyAdded={isRecentlyAdded(asset.created_at)} />
      ))}
    </div>
  );
}
