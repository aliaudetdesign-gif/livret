"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateThemePreference } from "@/app/profil/actions";
import { THEME_LABELS, type ThemePreference } from "@/lib/types";

const OPTIONS: ThemePreference[] = ["light", "dark", "auto"];

// Contrôle segmenté à 3 options (Clair/Sombre/Automatique), page profil
// agence et client. router.refresh() après l'action : la classe .dark vit
// sur <html> dans app/layout.tsx (Server Component), donc le nouveau thème
// ne s'applique qu'après un re-rendu serveur, pas seulement un changement
// d'état local.
export function ThemeToggle({ current }: { current: ThemePreference }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSelect(next: ThemePreference) {
    if (next === current || isPending) return;
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
        const isActive = option === current;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={isPending}
            onClick={() => handleSelect(option)}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-full transition-colors disabled:cursor-wait ${
              isActive
                ? "btn-clay"
                : "text-ink-500 hover:text-ink-900 cursor-pointer"
            }`}
          >
            {THEME_LABELS[option]}
          </button>
        );
      })}
    </div>
  );
}
