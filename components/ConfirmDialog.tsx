"use client";

import { useEffect } from "react";

// Confirmation de suppression, centrée à l'écran, dans le même code graphique
// que Modal.tsx (fond assombri/flouté, dalle de verre, animate-pop-in) plutôt
// que le window.confirm() natif du navigateur. Fermeture au clic sur le fond,
// à la touche Échap, ou via "Annuler".
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Supprimer",
  cancelLabel = "Annuler",
  danger = true,
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-ink-900/35 backdrop-blur-[3px] p-4"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="animate-pop-in glass relative w-full max-w-sm rounded-panel p-6 text-center"
        style={{ transformOrigin: "center" }}
      >
        <p className="text-[15px] font-semibold text-ink-900 mb-2">{title}</p>
        <p className="text-sm text-ink-500 leading-relaxed mb-6">{message}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-full text-sm font-medium text-ink-500 hover:text-ink-900 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={
              danger
                ? "px-4 py-2 rounded-full text-sm font-semibold bg-err-600 text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                : "btn-clay text-sm font-semibold px-4 py-2 disabled:opacity-60"
            }
          >
            {pending ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
