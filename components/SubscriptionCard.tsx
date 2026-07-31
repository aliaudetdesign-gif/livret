"use client";

import { useState } from "react";
import type { Subscription } from "@/lib/types";
import { formatShortDate } from "@/lib/format";

const statusStyle: Record<Subscription["status"], string> = {
  actif: "bg-emerald-100 text-emerald-700",
  en_pause: "bg-[var(--color-terracotta-tint)] text-[var(--color-terracotta-deep)]",
  annule: "bg-zinc-100 text-zinc-500",
};

const statusLabel: Record<Subscription["status"], string> = {
  actif: "Actif",
  en_pause: "En pause",
  annule: "Annulé",
};

// Actions non connectées pour cette v1 (pas d'intégration paiement) : un simple
// message temporaire indique que la fonctionnalité arrive plus tard.
export function SubscriptionCard({ subscription }: { subscription: Subscription }) {
  const [notice, setNotice] = useState<string | null>(null);

  function handleComingSoon() {
    setNotice("Bientôt disponible.");
    setTimeout(() => setNotice(null), 3000);
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">Plan {subscription.plan_name}</span>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusStyle[subscription.status]}`}
            >
              {statusLabel[subscription.status]}
            </span>
          </div>
          <p className="text-sm text-zinc-500 mt-1">{subscription.price_label}</p>
        </div>
      </div>

      <p className="text-xs text-zinc-500 mb-4">
        Prochain renouvellement le {formatShortDate(subscription.renewal_date)}
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleComingSoon}
          className="text-sm font-medium bg-white border border-zinc-200 rounded-md px-4 py-2 hover:border-[var(--color-terracotta)] transition-colors"
        >
          Changer de plan
        </button>
        <button
          type="button"
          onClick={handleComingSoon}
          className="text-sm font-medium bg-white border border-zinc-200 rounded-md px-4 py-2 hover:border-[var(--color-terracotta)] transition-colors"
        >
          Gérer le paiement
        </button>
        {notice && <span className="text-sm text-zinc-400">{notice}</span>}
      </div>
    </div>
  );
}
