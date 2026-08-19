"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateThemePreference } from "@/app/profil/actions";
import { THEME_LABELS, type ThemePreference } from "@/lib/types";

const OPTIONS: ThemePreference[] = ["light", "dark", "auto"];

// Sombre et automatique désactivés temporairement (soucis de contraste à
// régler, voir CLAUDE.md) : seul Clair est sélectionnable. Les deux autres
// options restent visibles mais grisées, en attendant leur réactivation.
const ENABLED_OPTIONS: ThemePreference[] = ["light"];

// Contrôle segmenté à 3 options (Clair/Sombre/Automatique), page profil
// agence et client. router.refresh() après l'action : la classe .dark vit
// sur <html> dans app/layout.tsx (Server Component), donc le nouveau thème
// ne s'applique qu'après un re-rendu serveur, pas seulement un changement
// d'état local.
export function ThemeToggle({ current }: { current: ThemePreference }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSelect(next: ThemePreference) {
    if (!ENABLED_OPTIONS.includes(next) || next === current || isPending) return;
    startTransition(async () => {
      const result = await updateThemePreference(next);
      if (!result.error) {
        router.refresh();
      }
    });
  }

  return (
    <div
      role="radiogroup"
      aria-label="Thème d'affichage"
      className="inline-flex items-center gap-1 rounded-chip bg-shell-deep p-1 border border-line"
    >
      {OPTIONS.map((option) => {
        const isEnabled = ENABLED_OPTIONS.includes(option);
        const isActive = isEnabled && option === current;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-disabled={!isEnabled}
            disabled={isPending || !isEnabled}
            title={isEnabled ? undefined : "Bientôt disponible"}
            onClick={() => handleSelect(option)}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-full transition-colors ${
              !isEnabled
                ? "text-ink-400/50 cursor-not-allowed"
                : isActive
                  ? "btn-clay"
                  : "text-ink-500 hover:text-ink-900 cursor-pointer disabled:cursor-wait"
            }`}
          >
            {THEME_LABELS[option]}
          </button>
        );
      })}
    </div>
  );
}
