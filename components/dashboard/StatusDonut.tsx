import type { DashboardStatusCounts } from "./types";

const SEGMENTS: { key: keyof DashboardStatusCounts; label: string; color: string }[] = [
  { key: "en_cours", label: "En cours", color: "var(--clay-500)" },
  { key: "attente_validation", label: "À valider", color: "var(--warn-600)" },
  { key: "livre", label: "Livrés", color: "var(--ok-600)" },
];

export function StatusDonut({ counts }: { counts: DashboardStatusCounts }) {
  const total = counts.en_cours + counts.attente_validation + counts.livre;

  const cumulative = SEGMENTS.reduce<number[]>((acc, s, i) => {
    const pct = total > 0 ? (counts[s.key] / total) * 100 : 0;
    acc.push((i === 0 ? 0 : acc[i - 1]) + pct);
    return acc;
  }, []);
  const stops = SEGMENTS.map((s, i) => {
    const start = i === 0 ? 0 : cumulative[i - 1];
    return `${s.color} ${start}% ${cumulative[i]}%`;
  }).join(", ");

  return (
    <div className="glass rounded-card p-[19px] h-full flex flex-col">
      <h2 className="text-[12.5px] font-semibold mb-4">Répartition par statut</h2>
      {total === 0 ? (
        <p className="text-xs text-ink-400">Aucun projet actif.</p>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 flex-1">
          <div className="relative w-[128px] h-[128px] shrink-0">
            <div
              className="w-full h-full rounded-full"
              style={{ background: `conic-gradient(${stops})` }}
            />
            <div className="absolute inset-[21px] rounded-full bg-white/75 flex items-center justify-center">
              <span className="text-[21px] font-semibold">{total}</span>
            </div>
          </div>
          <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs">
            {SEGMENTS.map((s) => (
              <li key={s.key} className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-ink-700">{s.label}</span>
                <span className="text-ink-400">
                  {total > 0 ? Math.round((counts[s.key] / total) * 100) : 0}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
