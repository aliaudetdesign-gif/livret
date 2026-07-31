"use client";

// Tuile déclencheur en pointillés (façon "Nouveau logo / Ajouter une nouvelle
// version" de la maquette) : ouvre la modale d'ajout correspondante au clic.
// Trois variantes pour s'adapter aux différentes grilles/listes existantes.
export function AddTile({
  title,
  subtitle,
  onClick,
  variant = "square",
}: {
  title: string;
  subtitle?: string;
  onClick: () => void;
  variant?: "square" | "row" | "wide";
}) {
  const baseClass =
    "group flex items-center justify-center gap-3 border-2 border-dashed border-white/60 rounded-lg text-ink-500 hover:border-[var(--color-terracotta)] hover:text-[var(--color-terracotta)] transition-colors";

  if (variant === "row") {
    return (
      <button type="button" onClick={onClick} className={`${baseClass} p-4`}>
        <span className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-dashed border-current text-lg leading-none shrink-0">
          +
        </span>
        <span className="text-sm font-medium truncate">{title}</span>
      </button>
    );
  }

  const contentClass =
    variant === "wide"
      ? "flex flex-col items-center justify-center gap-1.5 p-6 min-h-[10rem]"
      : "flex flex-col items-center justify-center gap-1.5 aspect-square p-4";

  return (
    <button type="button" onClick={onClick} className={`${baseClass} ${contentClass}`}>
      <span className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-dashed border-current text-xl leading-none">
        +
      </span>
      <span className="text-sm font-medium text-center">{title}</span>
      {subtitle && <span className="text-xs text-ink-400 text-center">{subtitle}</span>}
    </button>
  );
}
