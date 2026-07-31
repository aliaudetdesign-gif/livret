"use client";

import type { ReactNode } from "react";

// Overlay d'aide au survol, réutilisé pour expliquer en une phrase l'usage
// d'un format de fichier (SVG/PNG/PDF).
export function FormatHint({ text, children }: { text: string; children: ReactNode }) {
  return (
    <span className="relative inline-flex group/hint">
      {children}
      <span className="pointer-events-none absolute bottom-full left-0 mb-2 w-56 rounded-md bg-[var(--color-noir-doux)] text-white text-[11px] leading-snug px-2.5 py-1.5 opacity-0 group-hover/hint:opacity-100 transition-opacity z-30">
        {text}
      </span>
    </span>
  );
}

// Libellé de champ ("Fichier SVG"...) accompagné d'une pastille "i" qui
// affiche l'explication du format au survol.
export function FormatLabelWithHint({
  label,
  description,
}: {
  label: string;
  description: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {label}
      <FormatHint text={description}>
        <span className="w-3.5 h-3.5 rounded-full border border-white/70 text-ink-400 text-[9px] leading-none flex items-center justify-center cursor-help">
          i
        </span>
      </FormatHint>
    </span>
  );
}
