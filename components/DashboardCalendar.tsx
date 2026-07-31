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
    <div className="glass rounded-card p-[19px] h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="font-semibold text-[13px]">{capitalizedLabel}</div>
        <div className="flex gap-[5px]">
          <button
            type="button"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="w-[25px] h-[25px] rounded-full bg-white/60 border border-white/60 text-ink-500 flex items-center justify-center transition-colors hover:bg-white/85"
            aria-label="Mois précédent"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="w-[25px] h-[25px] rounded-full bg-white/60 border border-white/60 text-ink-500 flex items-center justify-center transition-colors hover:bg-white/85"
            aria-label="Mois suivant"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-[3px] text-center text-[9.5px] font-semibold uppercase tracking-[0.09em] text-ink-400 mb-1.5">
        {WEEKDAYS.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-[3px]">
        {cells.map((day, i) => (
          <div
            key={i}
            className={`aspect-square flex items-center justify-center text-xs rounded-chip transition-colors ${
              isToday(day)
                ? "bg-gradient-terracotta text-white font-semibold shadow-[0_4px_12px_-4px_var(--clay-glow)]"
                : "text-ink-700 hover:bg-white/60"
            }`}
          >
            {day ?? ""}
          </div>
        ))}
      </div>

      <p className="text-[11px] text-ink-400 mt-4">
        Aucun événement pour l&apos;instant. Les rendez-vous et échéances viendront
        s&apos;afficher ici.
      </p>
    </div>
  );
}
