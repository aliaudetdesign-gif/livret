import Link from "next/link";
import { formatRelativeDate } from "@/lib/format";
import type { DocumentCategory } from "@/lib/types";

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  devis: "Devis",
  facture: "Facture",
  brief: "Brief",
};

export type ClientDocumentItem = {
  id: string;
  category: DocumentCategory;
  label: string;
  createdAt: string;
};

export function ClientRecentDocuments({ documents }: { documents: ClientDocumentItem[] }) {
  return (
    <div className="glass rounded-card p-[19px] h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[12.5px] font-semibold">Documents récents</h2>
        <Link href="/espace/administratif" className="text-xs font-medium text-clay-600 hover:underline">
          Voir tout
        </Link>
      </div>
      {documents.length === 0 ? (
        <p className="text-xs text-ink-400">Aucun document pour l&apos;instant.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {documents.map((doc) => (
            <li key={doc.id}>
              <Link href="/espace/administratif" className="flex items-start gap-2.5">
                <div className="w-[29px] h-[29px] rounded-chip bg-white/65 border border-white/60 text-ink-500 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-semibold">
                  {CATEGORY_LABELS[doc.category].slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-ink-700 truncate">{doc.label}</div>
                  <div className="text-[11px] text-ink-400">{CATEGORY_LABELS[doc.category]}</div>
                  <div className="text-[10px] text-ink-400/80 mt-0.5">
                    {formatRelativeDate(doc.createdAt)}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
