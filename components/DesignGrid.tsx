import Link from "next/link";
import type { ReactNode } from "react";

export interface DesignCardData {
  key: string;
  label: string;
  icon: string;
  count: number;
}

function DesignCard({ card, href }: { card: DesignCardData; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 bg-white border border-zinc-100 rounded-lg p-4 hover-lift"
    >
      <span className="text-2xl leading-none">{card.icon}</span>
      <span>
        <span className="block text-xs text-zinc-500">{card.label}</span>
        <span className="block text-xl font-semibold">{card.count}</span>
      </span>
    </Link>
  );
}

export function DesignGrid({
  essentiel,
  complements,
  sectionHref,
  addSectionSlot,
}: {
  essentiel: DesignCardData[];
  complements: DesignCardData[];
  sectionHref: (key: string) => string;
  addSectionSlot?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-zinc-400 mb-3">Essentiel</p>
        <div className="grid grid-cols-4 gap-4">
          {essentiel.map((card) => (
            <DesignCard key={card.key} card={card} href={sectionHref(card.key)} />
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-zinc-400 mb-3">Compléments</p>
        <div className="grid grid-cols-4 gap-4">
          {complements.map((card) => (
            <DesignCard key={card.key} card={card} href={sectionHref(card.key)} />
          ))}
          {addSectionSlot}
        </div>
        {complements.length === 0 && !addSectionSlot && (
          <p className="text-sm text-zinc-400 mt-1">Aucune section complémentaire pour l&apos;instant.</p>
        )}
      </div>
    </div>
  );
}
