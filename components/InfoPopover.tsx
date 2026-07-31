"use client";

import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

// Popup d'aide en overlay, déclenché au clic (contrairement à FormatHint qui
// n'apparaissait qu'au survol). Se ferme au clic en dehors ou avec Échap.
export function InfoPopover({
  text,
  children,
}: {
  text: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
    <div className="relative inline-flex items-center" ref={ref}>
      {children}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-zinc-400 hover:text-[var(--color-terracotta-deep)] transition-colors"
        aria-label="Plus d'informations"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-2 w-64 bg-white border border-zinc-200 rounded-lg shadow-lg px-3 py-2.5 text-xs text-zinc-600 leading-relaxed">
          {text}
        </div>
      )}
    </div>
  );
}
