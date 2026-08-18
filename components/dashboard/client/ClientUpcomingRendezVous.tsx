import Link from "next/link";
import { Calendar, Clock, MapPin } from "lucide-react";
import type { RendezVousMetadata } from "@/lib/types";

// Dernière proposition de rendez-vous du fil de discussion (une recontre-
// proposition crée un nouveau message, donc le plus récent représente
// toujours l'état courant — voir RendezVousCard). Refusé : on n'encombre pas
// le dashboard, l'historique reste consultable dans la messagerie.
export function ClientUpcomingRendezVous({
  metadata,
  isMine,
}: {
  metadata: RendezVousMetadata | null;
  isMine: boolean;
}) {
  const show = metadata && metadata.status !== "declined";

  return (
    <div className="glass rounded-card p-[19px] h-full flex flex-col">
      <h2 className="text-[12.5px] font-semibold mb-4">Prochain rendez-vous</h2>
      {!show ? (
        <p className="text-xs text-ink-400">Aucun rendez-vous prévu pour l&apos;instant.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs text-ink-900 capitalize">
            <Calendar className="w-3.5 h-3.5 text-ink-400 shrink-0" />
            {formatDateLisible(metadata.date)}
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-900">
            <Clock className="w-3.5 h-3.5 text-ink-400 shrink-0" />
            {metadata.heure}
          </div>
          {metadata.lieu && (
            <div className="flex items-center gap-2 text-xs text-ink-900">
              <MapPin className="w-3.5 h-3.5 text-ink-400 shrink-0" />
              {metadata.lieu}
            </div>
          )}

          <StatusBadge status={metadata.status} />

          {metadata.status === "pending" && !isMine && (
            <Link
              href="/espace/messagerie"
              className="text-xs font-medium text-clay-600 hover:underline mt-1 w-fit"
            >
              Répondre
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "accepted" | "declined" }) {
  if (status === "accepted") {
    return (
      <span className="inline-flex w-fit items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-ok-100 text-ok-600 text-[11px] font-medium">
        Confirmé
      </span>
    );
  }
  return (
    <span className="inline-flex w-fit items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-warn-100 text-warn-600 text-[11px] font-medium">
      En attente
    </span>
  );
}

function formatDateLisible(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
