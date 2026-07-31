"use client";

import { useActionState, useState, useTransition } from "react";
import { inviteAgencyMember, removeAgencyInvite, type InviteActionState } from "@/app/agence/parametres/actions";
import type { AgencyInvite } from "@/lib/types";
import { formatShortDate } from "@/lib/format";

const initialState: InviteActionState = { error: null };

const inputClass =
  "w-full px-3 py-2 text-sm bg-white/70 border border-white/60 rounded-field focus:outline-none focus:border-clay-500 focus:bg-white/90 transition-colors";
const labelClass = "block text-xs font-medium text-ink-500 mb-1.5";

const statusStyle: Record<AgencyInvite["status"], string> = {
  en_attente: "bg-[var(--color-terracotta-tint)] text-[var(--color-terracotta-deep)]",
  acceptee: "bg-ok-100 text-ok-600",
};

const statusLabel: Record<AgencyInvite["status"], string> = {
  en_attente: "En attente",
  acceptee: "Acceptée",
};

function InviteRow({ invite }: { invite: AgencyInvite }) {
  const [isDeleting, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRemove() {
    const confirmed = window.confirm(`Retirer l'invitation de ${invite.email} ?`);
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await removeAgencyInvite(invite.id);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-white/55 last:border-0">
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{invite.full_name}</div>
        <div className="text-xs text-ink-500 truncate">{invite.email}</div>
        {error && <p className="text-xs text-err-600 mt-1">{error}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span
          className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusStyle[invite.status]}`}
        >
          {statusLabel[invite.status]}
        </span>
        <span className="text-xs text-ink-400">{formatShortDate(invite.created_at)}</span>
        <button
          type="button"
          onClick={handleRemove}
          disabled={isDeleting}
          className="text-sm text-ink-400 hover:text-err-600 disabled:opacity-50"
          title="Retirer"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// Suivi d'invitations pour l'accès à l'espace agence. Pas de création de compte
// Supabase Auth réelle (nécessiterait une clé service-role côté serveur) : le
// statut "En attente" / "Acceptée" reste pour l'instant un suivi manuel.
export function AgencyAccessSection({ invites }: { invites: AgencyInvite[] }) {
  const [state, formAction, pending] = useActionState(inviteAgencyMember, initialState);

  return (
    <div>
      {invites.length === 0 ? (
        <p className="text-sm text-ink-400 mb-4">Aucune invitation pour l&apos;instant.</p>
      ) : (
        <div className="mb-5">
          {invites.map((invite) => (
            <InviteRow key={invite.id} invite={invite} />
          ))}
        </div>
      )}

      <form action={formAction} className="flex items-end gap-3">
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
      {state.error && <p className="text-sm text-err-600 mt-2">{state.error}</p>}
    </div>
  );
}
