"use client";

import { useActionState, useState, useTransition } from "react";
import { inviteAgencyMember, removeAgencyInvite, type InviteActionState } from "@/app/agence/parametres/actions";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { InviteLinkPanel } from "@/components/InviteLinkPanel";
import type { AgencyInvite } from "@/lib/types";
import { formatShortDate } from "@/lib/format";

const initialState: InviteActionState = { error: null };

const inputClass =
  "w-full px-3 py-2 text-sm bg-white/70 border border-white/60 rounded-field focus:outline-none focus:border-clay-500 focus:bg-white/90 transition-colors";
const labelClass = "block text-xs font-medium text-ink-500 mb-1.5";

const statusStyle: Record<AgencyInvite["status"], string> = {
  en_attente: "bg-clay-100 text-clay-700",
  acceptee: "bg-ok-100 text-ok-600",
};

const statusLabel: Record<AgencyInvite["status"], string> = {
  en_attente: "En attente",
  acceptee: "Compte créé",
};

function InviteRow({ invite }: { invite: AgencyInvite }) {
  const [isDeleting, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleRemove() {
    setConfirmOpen(true);
  }

  function runRemove() {
    setError(null);
    startTransition(async () => {
      const result = await removeAgencyInvite(invite.id);
      if (result.error) setError(result.error);
      setConfirmOpen(false);
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

      <ConfirmDialog
        open={confirmOpen}
        title={`Retirer l'invitation de ${invite.email} ?`}
        message="Cette action est irréversible."
        pending={isDeleting}
        onConfirm={runRemove}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

// Suivi des comptes agence. Un vrai compte Supabase Auth est créé
// immédiatement (voir lib/accountCreation.ts) : le statut "En attente" ne
// devrait plus apparaître en pratique, conservé pour compat avec d'anciennes
// lignes créées avant ce chantier.
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
          className="btn-clay text-sm font-semibold px-4 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? "..." : "Inviter"}
        </button>
      </form>
      {state.error && <p className="text-sm text-err-600 mt-2">{state.error}</p>}
      {state.inviteLink && (
        <div className="mt-3">
          <InviteLinkPanel inviteLink={state.inviteLink} />
        </div>
      )}
    </div>
  );
}
