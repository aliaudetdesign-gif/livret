"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function getMonthCells(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // lundi = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function DashboardCalendar() {
  const [cursor, setCursor] = useState(() => new Date());
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const cells = getMonthCells(year, month);
  const today = new Date();

  const label = cursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);

  function isToday(day: number | null) {
    return (
      day !== null &&
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  }

  return (
    <div className="glass rounded-card p-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <div className="font-semibold text-[12.5px]">{capitalizedLabel}</div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="w-[21px] h-[21px] rounded-full bg-white/60 border border-white/60 text-ink-500 flex items-center justify-center transition-colors hover:bg-white/85"
            aria-label="Mois précédent"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="w-[21px] h-[21px] rounded-full bg-white/60 border border-white/60 text-ink-500 flex items-center justify-center transition-colors hover:bg-white/85"
            aria-label="Mois suivant"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-[2px] text-center text-[8.5px] font-semibold uppercase tracking-[0.07em] text-ink-400 mb-1">
        {WEEKDAYS.map((day) => (
          <div key={day}>{day[0]}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-[2px]">
        {cells.map((day, i) => (
          <div
            key={i}
            className={`aspect-square flex items-center justify-center text-[11px] rounded-chip transition-colors ${
              isToday(day)
                ? "bg-gradient-terracotta text-white font-semibold shadow-[0_4px_12px_-4px_var(--clay-glow)]"
                : "text-ink-700 hover:bg-white/60"
            }`}
          >
            {day ?? ""}
          </div>
        ))}
      </div>
    </div>
  );
}
