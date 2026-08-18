import Link from "next/link";
import { formatRelativeDate } from "@/lib/format";

export type ClientActivityItem = {
  id: string;
  icon: string;
  label: string;
  sublabel: string;
  createdAt: string;
};

// Fusionne brand_assets (Essentiel) et section_assets (Compléments) du projet
// client pour afficher les derniers ajouts, tous types confondus. Contrairement
// à RecentActivityList (agence, multi-projets), pas de lien par item : un seul
// projet ici, donc un simple "Voir tout" suffit.
export function ClientRecentActivity({ items }: { items: ClientActivityItem[] }) {
  return (
    <div className="glass rounded-card p-[19px] h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[12.5px] font-semibold">Nouveautés récentes</h2>
        <Link href="/espace/design" className="text-xs font-medium text-clay-600 hover:underline">
          Voir tout
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-ink-400">Aucune nouveauté pour l&apos;instant.</p>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-2.5">
              <div className="w-[29px] h-[29px] rounded-chip bg-white/65 border border-white/60 text-ink-500 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[13px] font-semibold leading-none">{item.icon}</span>
              </div>
              <div className="min-w-0">
                <div className="text-xs text-ink-700 leading-[1.4] truncate">{item.label}</div>
                <div className="text-[11px] text-ink-400">{item.sublabel}</div>
                <div className="text-[10px] text-ink-400/80 mt-0.5">
                  {formatRelativeDate(item.createdAt)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
