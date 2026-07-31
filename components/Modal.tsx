"use client";

import { useEffect } from "react";

// Overlay générique : le fond est assombri à l'encre plutôt qu'au noir pur et
// légèrement flouté, pour que la dalle de verre du formulaire se détache sans
// que la page disparaisse complètement. Fermeture au clic sur le fond ou à la
// touche Échap. Utilisé pour ouvrir les formulaires d'ajout (logo,
// typographie, document, fichier de section...) en pop-up plutôt qu'en
// formulaire toujours visible.
export function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/35 backdrop-blur-[3px] p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-chip bg-white/85 border border-white/60 text-ink-500 hover:text-clay-600 transition-colors"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
