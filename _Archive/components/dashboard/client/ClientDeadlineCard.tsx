import { formatWeekdayDate } from "@/lib/format";

// Échéance du projet client (project.end_date), avec un badge "Dans X jours"
// tant que la date n'est pas dépassée. Volontairement compact : un seul
// projet côté client, pas besoin de la timeline multi-projets de l'agence
// (DeadlinesTimeline).
//
// Archivé le 19 août 2026 : remplacé par ClientDashboardCalendar
// (components/dashboard/client/ClientDashboardCalendar.tsx) sur le dashboard
// client, à la demande d'Alexandre (maquette "Goodlands"). Conservé ici au
// cas où, non supprimé.
export function ClientDeadlineCard({ endDate }: { endDate: string | null }) {
  const daysRemaining = endDate ? computeDaysRemaining(endDate) : null;

  return (
    <div className="glass rounded-card p-[19px] h-full flex flex-col">
      <h2 className="text-[12.5px] font-semibold mb-4">Échéance du projet</h2>
      {!endDate ? (
        <p className="text-xs text-ink-400">Aucune échéance définie pour l&apos;instant.</p>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="text-xs font-semibold">{formatWeekdayDate(endDate)}</div>
          {daysRemaining !== null && daysRemaining >= 0 && (
            <span className="inline-flex w-fit items-center gap-1 px-2 py-0.5 rounded-full bg-clay-100 text-clay-700 text-[11px] font-medium">
              {daysRemaining === 0 ? "Aujourd'hui" : `Dans ${daysRemaining} jour${daysRemaining > 1 ? "s" : ""}`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function computeDaysRemaining(endDate: string): number {
  const end = new Date(`${endDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - today.getTime()) / 86400000);
}
