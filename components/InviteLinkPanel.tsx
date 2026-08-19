"use client";

import { useState } from "react";

// Affiché juste après la création réelle d'un compte (agence, client principal
// ou contact secondaire) : aucun email n'est envoyé automatiquement (voir
// lib/accountCreation.ts et CLAUDE.md section "Création de compte"), donc ce
// lien doit être transmis à la main par l'agence (message, email...).
export function InviteLinkPanel({ inviteLink }: { inviteLink: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-field border border-ok-600/20 bg-ok-100 px-3.5 py-3 text-sm">
      <p className="font-medium text-ok-600 mb-1.5">Compte créé. Transmets ce lien à la main :</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 min-w-0 truncate rounded-chip bg-white/70 px-2.5 py-1.5 text-xs text-ink-700">
          {inviteLink}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-chip bg-white/90 text-ink-900 hover:bg-white transition-colors"
        >
          {copied ? "Copié !" : "Copier"}
        </button>
      </div>
    </div>
  );
}
