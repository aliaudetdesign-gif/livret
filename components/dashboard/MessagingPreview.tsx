import Link from "next/link";
import { getProjectColor } from "@/lib/projectColor";
import type { DashboardMessagePreview } from "./types";

export function MessagingPreview({ messages }: { messages: DashboardMessagePreview[] }) {
  return (
    <div className="glass rounded-card p-[19px] h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[12.5px] font-semibold">Messagerie</h2>
        <Link
          href="/agence/messagerie"
          className="text-xs font-medium text-clay-600 hover:underline"
        >
          + Nouveau
        </Link>
      </div>
      {messages.length === 0 ? (
        <p className="text-xs text-ink-400">Aucun message pour l&apos;instant.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {messages.map((message) => {
            const avatarColor = getProjectColor(message.projectId ?? message.id);
            return (
              <li key={message.id}>
                <Link
                  href={message.projectId ? `/agence/messagerie/${message.projectId}` : "/agence/messagerie"}
                  className="flex items-start gap-2.5"
                >
                  <div
                    className="w-7 h-7 rounded-full text-[10px] flex items-center justify-center font-semibold shrink-0"
                    style={{
                      backgroundColor: avatarColor.background,
                      color: avatarColor.text,
                    }}
                  >
                    {message.projectName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">
                      {message.projectName}
                    </div>
                    <div className="text-[11px] text-ink-400 truncate">
                      {message.content}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
