"use client";

import { useActionState, useState, useTransition } from "react";
import {
  inviteProjectClient,
  removeProjectClientInvite,
  type ProjectClientInviteActionState,
} from "@/app/agence/projets/[id]/actions";
import type { ProjectClientInvite } from "@/lib/types";
import { formatShortDate } from "@/lib/format";

const initialState: ProjectClientInviteActionState = { error: null };

const inputClass =
  "w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-md focus:outline-none focus:border-[var(--color-terracotta)] transition-colors";
const labelClass = "block text-xs font-medium text-zinc-500 mb-1.5";

const statusStyle: Record<ProjectClientInvite["status"], string> = {
  en_attente: "bg-[var(--color-terracotta-tint)] text-[var(--color-terracotta-deep)]",
  acceptee: "bg-emerald-100 text-emerald-700",
};

const statusLabel: Record<ProjectClientInvite["status"], string> = {
  en_attente: "En attente",
  acceptee: "Acceptée",
};

function InviteRow({
  invite,
  projectId,
}: {
  invite: ProjectClientInvite;
  projectId: string;
}) {
  const [isDeleting, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRemove() {
    const confirmed = window.confirm(`Retirer l'invitation de ${invite.email} ?`);
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      try {
        const result = await removeProjectClientInvite(invite.id, projectId);
        if (result.error) setError(result.error);
      } catch {
        setError("Une erreur est survenue, réessaie.");
      }
    });
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0">
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{invite.full_name}</div>
        <div className="text-xs text-zinc-500 truncate">{invite.email}</div>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span
          className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusStyle[invite.status]}`}
        >
          {statusLabel[invite.status]}
        </span>
        <span className="text-xs text-zinc-400">{formatShortDate(invite.created_at)}</span>
        <button
          type="button"
          onClick={handleRemove}
          disabled={isDeleting}
          className="text-sm text-zinc-400 hover:text-red-600 disabled:opacity-50"
          title="Retirer"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// Suivi des personnes côté client invitées à consulter ce projet, en plus du
// client principal. Pas de création de compte Supabase Auth réelle (nécessiterait
// une clé service-role côté serveur) : le statut "En attente" / "Acceptée"
// reste pour l'instant un suivi manuel, le compte étant créé à la main ensuite.
export function ProjectClientInvites({
  invites,
  projectId,
}: {
  invites: ProjectClientInvite[];
  projectId: string;
}) {
  const [state, formAction, pending] = useActionState(inviteProjectClient, initialState);

  return (
    <div>
      {invites.length === 0 ? (
        <p className="text-sm text-zinc-400 mb-4">Aucune invitation pour l&apos;instant.</p>
      ) : (
        <div className="mb-5">
          {invites.map((invite) => (
            <InviteRow key={invite.id} invite={invite} projectId={projectId} />
          ))}
        </div>
      )}

      <form action={formAction} className="flex items-end gap-3">
        <input type="hidden" name="project_id" value={projectId} />
        <div className="flex-1">
          <label htmlFor="full_name" className={labelClass}>
            Nom
          </label>
          <input id="full_name" name="full_name" required className={inputClass} />
        </div>
        <div className="flex-1">
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input id="email" name="email" type="email" required className={inputClass} />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="bg-gradient-terracotta text-white text-sm font-medium rounded-md px-4 py-2 hover-lift disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? "..." : "Inviter"}
        </button>
      </form>
      {state.error && <p className="text-sm text-red-600 mt-2">{state.error}</p>}
    </div>
  );
}
