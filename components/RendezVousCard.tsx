"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Calendar, Check, Clock, MapPin, X } from "lucide-react";
import {
  proposeRendezVous,
  respondToRendezVous,
  type ProposeRendezVousState,
} from "@/app/agence/messagerie/actions";
import type { Message } from "@/lib/types";

// Carte de proposition de rendez-vous affichée dans le fil de discussion, à
// la place d'une bulle de texte classique, quand message.type === "rendezvous".
// Reprend le principe de la négociation d'offre Vinted : la personne qui n'a
// pas fait la proposition peut Accepter, Refuser, ou Proposer un autre
// horaire (ce qui envoie une nouvelle proposition, indépendante de celle-ci).
export function RendezVousCard({
  message,
  projectId,
  isMine,
}: {
  message: Message;
  projectId: string;
  isMine: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [showCounter, setShowCounter] = useState(false);
  const metadata = message.metadata;

  if (!metadata) return null;

  const { date, heure, lieu, status } = metadata;
  const dateLisible = formatDateLisible(date);

  function respond(response: "accepted" | "declined") {
    startTransition(() => {
      respondToRendezVous(message.id, projectId, response);
    });
  }

  return (
    <div
      className={`max-w-[80%] sm:max-w-[70%] flex flex-col gap-1 ${
        isMine ? "self-end items-end" : "self-start items-start"
      }`}
    >
      <div className="w-full min-w-[240px] rounded-field bg-white/80 border border-white/60 overflow-hidden">
        <div className="bg-gradient-terracotta text-white px-3.5 py-2.5 flex items-center gap-2">
          <Calendar className="w-4 h-4 shrink-0" />
          <span className="text-sm font-semibold">Proposition de rendez-vous</span>
        </div>

        <div className="px-3.5 py-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-sm text-ink-900 capitalize">
            <Calendar className="w-3.5 h-3.5 text-ink-400 shrink-0" />
            {dateLisible}
          </div>
          <div className="flex items-center gap-2 text-sm text-ink-900">
            <Clock className="w-3.5 h-3.5 text-ink-400 shrink-0" />
            {heure}
          </div>
          {lieu && (
            <div className="flex items-center gap-2 text-sm text-ink-900">
              <MapPin className="w-3.5 h-3.5 text-ink-400 shrink-0" />
              {lieu}
            </div>
          )}

          <StatusBadge status={status} />

          {status === "pending" && !isMine && !showCounter && (
            <div className="flex flex-wrap gap-2 mt-1.5">
              <button
                type="button"
                disabled={pending}
                onClick={() => respond("accepted")}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-field bg-gradient-terracotta text-white hover-lift disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Check className="w-3.5 h-3.5" />
                Accepter
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => respond("declined")}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-field bg-white/70 border border-white/60 text-ink-700 hover:text-clay-600 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <X className="w-3.5 h-3.5" />
                Refuser
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setShowCounter(true)}
                className="px-3 py-1.5 text-xs font-medium rounded-field bg-white/70 border border-white/60 text-ink-700 hover:text-clay-600 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Proposer un autre horaire
              </button>
            </div>
          )}

          {showCounter && (
            <CounterForm
              projectId={projectId}
              onDone={() => setShowCounter(false)}
            />
          )}
        </div>
      </div>
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
  if (status === "declined") {
    return (
      <span className="inline-flex w-fit items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-err-100 text-err-600 text-[11px] font-medium">
        Refusé
      </span>
    );
  }
  return (
    <span className="inline-flex w-fit items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-warn-100 text-warn-600 text-[11px] font-medium">
      En attente
    </span>
  );
}

const initialCounterState: ProposeRendezVousState = { error: null };

function CounterForm({
  projectId,
  onDone,
}: {
  projectId: string;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    proposeRendezVous,
    initialCounterState
  );
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      onDone();
    }
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, state]);

  return (
    <form action={formAction} className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/55">
      <input type="hidden" name="project_id" value={projectId} />
      {state.error && <p className="text-xs text-err-600">{state.error}</p>}
      <div className="flex gap-2">
        <input
          type="date"
          name="date"
          required
          className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-white/70 border border-white/60 rounded-field focus:outline-none focus:border-clay-500 focus:bg-white/90"
        />
        <input
          type="time"
          name="heure"
          required
          className="w-24 shrink-0 px-2.5 py-1.5 text-xs bg-white/70 border border-white/60 rounded-field focus:outline-none focus:border-clay-500 focus:bg-white/90"
        />
      </div>
      <input
        type="text"
        name="lieu"
        placeholder="Lieu (optionnel)"
        className="px-2.5 py-1.5 text-xs bg-white/70 border border-white/60 rounded-field focus:outline-none focus:border-clay-500 focus:bg-white/90"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="px-3 py-1.5 text-xs font-medium rounded-field bg-gradient-terracotta text-white hover-lift disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Envoyer
        </button>
        <button
          type="button"
          onClick={onDone}
          className="px-3 py-1.5 text-xs font-medium rounded-field bg-white/70 border border-white/60 text-ink-700"
        >
          Annuler
        </button>
      </div>
    </form>
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
