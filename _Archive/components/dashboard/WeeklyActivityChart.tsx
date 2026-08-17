export function WeeklyActivityChart({ days }: { days: { label: string; count: number }[] }) {
  const max = Math.max(1, ...days.map((d) => d.count));

  return (
    <div className="glass rounded-card p-[19px] h-full flex flex-col">
      <h2 className="text-[12.5px] font-semibold mb-4">Activité — 7 derniers jours</h2>
      <div className="flex items-end justify-between gap-2 flex-1">
        {days.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
            <div className="w-full flex items-end justify-center h-[70px]">
              <div
                className="w-full max-w-[18px] rounded-t-chip bg-gradient-terracotta"
                style={{ height: `${Math.max(6, (d.count / max) * 70)}px` }}
              />
            </div>
            <span className="text-[9.5px] text-ink-400 font-semibold uppercase">
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
