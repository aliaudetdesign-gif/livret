"use client";

import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

// Popup d'aide inline, déclenché au clic (contrairement à FormatHint qui
// n'apparaissait qu'au survol). Se ferme au clic en dehors ou avec Échap.
//
// Contrairement à une version en overlay/portail, le texte apparaît en flux
// normal, directement à droite de l'icône (i), sur la même ligne que
// l'élément commenté (badge, valeur...) — voir maquette de référence. La
// transition de largeur utilise l'astuce grid-template-columns 0fr → 1fr,
// qui permet d'animer en douceur une largeur "auto" (contenu variable) sans
// à-coup, contrairement à `width`/`max-width`. Cette apparition peut pousser
// le contenu suivant à la ligne (`flex-wrap`) : c'est le comportement voulu,
// pas un bug de mise en page.
export function InfoPopover({
  text,
  children,
}: {
  text: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointer(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <span ref={ref} className="inline-flex items-center gap-1.5 align-middle">
      {children}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={`inline-flex items-center justify-center w-4 h-4 rounded-full transition-colors shrink-0 ${
          open ? "text-clay-600" : "text-ink-400 hover:text-clay-600"
        }`}
        aria-label="Plus d'informations"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      <span
        className={`grid transition-[grid-template-columns] duration-300 ease-out ${
          open ? "grid-cols-[1fr]" : "grid-cols-[0fr]"
        }`}
      >
        <span className="overflow-hidden">
          <span className="inline-block whitespace-nowrap rounded-full bg-white/70 border border-white/60 px-2.5 py-1 text-[11px] text-ink-600 leading-snug">
            {text}
          </span>
        </span>
      </span>
    </span>
  );
}
