import Link from "next/link";
import { formatRelativeDate } from "@/lib/format";

export type ClientMessagePreviewItem = {
  id: string;
  content: string;
  isMine: boolean;
  createdAt: string;
};

// Aperçu de la conversation unique du client (une seule discussion, contrairement
// à MessagingPreview côté agence qui liste des projets différents). Le contenu
// des messages de type rendez-vous est déjà résumé en amont (page.tsx).
export function ClientMessagingPreview({
  messages,
  unreadCount,
}: {
  messages: ClientMessagePreviewItem[];
  unreadCount: number;
}) {
  return (
    <div className="glass rounded-card p-[19px] h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[12.5px] font-semibold">Messagerie</h2>
          {unreadCount > 0 && (
            <span className="text-[10px] font-semibold rounded-full px-1.5 py-[1px] bg-gradient-terracotta text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <Link href="/espace/messagerie" className="text-xs font-medium text-clay-600 hover:underline">
          Voir tout
        </Link>
      </div>
      {messages.length === 0 ? (
        <p className="text-xs text-ink-400">Aucun message pour l&apos;instant.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {messages.map((message) => (
            <li key={message.id}>
              <Link href="/espace/messagerie" className="flex items-start gap-2.5">
                <div className="min-w-0">
                  <div className="text-xs font-medium">
                    {message.isMine ? "Toi" : "Ton agence"}
                  </div>
                  <div className="text-[11px] text-ink-400 truncate">{message.content}</div>
                  <div className="text-[10px] text-ink-400/80 mt-0.5">
                    {formatRelativeDate(message.createdAt)}
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
