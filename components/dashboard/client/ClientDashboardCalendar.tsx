"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getProjectColor } from "@/lib/projectColor";

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

function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export type CalendarEvent = { date: string; label: string };

// Calendrier mensuel du dashboard client : même grille/navigation que
// DashboardCalendar (agence), avec en plus un point sous les jours portant
// un événement (échéance projet, rendez-vous). Un seul projet côté client,
// donc pas besoin de distinguer plusieurs couleurs : le point reprend la
// couleur du projet (getProjectColor), la même que le carré d'initiales
// utilisé partout ailleurs (ProjectCard, messagerie...).
export function ClientDashboardCalendar({
  projectId,
  events,
}: {
  projectId: string;
  events: CalendarEvent[];
}) {
  const [cursor, setCursor] = useState(() => new Date());
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const cells = getMonthCells(year, month);
  const today = new Date();
  const dotColor = getProjectColor(projectId).text;

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

  function eventForDay(day: number | null) {
    if (day === null) return undefined;
    const iso = toIsoDate(year, month, day);
    return events.find((e) => e.date === iso);
  }

  return (
    <div className="glass rounded-card p-3.5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-[12.5px]">Calendrier</div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-ink-400">{capitalizedLabel}</span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setCursor(new Date(year, month - 1, 1))}
              className="w-[18px] h-[18px] rounded-full bg-white/60 border border-white/60 text-ink-500 flex items-center justify-center transition-colors hover:bg-white/85"
              aria-label="Mois précédent"
            >
              <ChevronLeft className="w-2.5 h-2.5" />
            </button>
            <button
              type="button"
              onClick={() => setCursor(new Date(year, month + 1, 1))}
              className="w-[18px] h-[18px] rounded-full bg-white/60 border border-white/60 text-ink-500 flex items-center justify-center transition-colors hover:bg-white/85"
              aria-label="Mois suivant"
            >
              <ChevronRight className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-[1px] text-center text-[7.5px] font-semibold uppercase tracking-[0.06em] text-ink-400 mb-0.5">
        {WEEKDAYS.map((day) => (
          <div key={day}>{day[0]}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-[1px] flex-1">
        {cells.map((day, i) => {
          const event = eventForDay(day);
          return (
            <div
              key={i}
              title={event?.label}
              className={`flex flex-col items-center justify-center gap-[1px] text-[9.5px] rounded-chip transition-colors ${
                isToday(day)
                  ? "bg-gradient-terracotta text-white font-semibold"
                  : "text-ink-700 hover:bg-white/60"
              }`}
            >
              <span>{day ?? ""}</span>
              {event && !isToday(day) && (
                <span
                  className="w-[3.5px] h-[3.5px] rounded-full shrink-0"
                  style={{ backgroundColor: dotColor }}
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
