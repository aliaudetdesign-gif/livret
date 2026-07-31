"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Mail, MailOpen, Archive, ArchiveRestore } from "lucide-react";
import { getProjectColor } from "@/lib/projectColor";
import { formatSlashDate } from "@/lib/format";
import { markThreadRead, markThreadUnread, toggleArchiveProject } from "@/app/agence/messagerie/actions";
import type { Project, Message } from "@/lib/types";

export function DiscussionRow({
  project,
  lastMessage,
  unreadCount,
}: {
  project: Project;
  lastMessage: Message | null;
  unreadCount: number;
}) {
  const [hovered, setHovered] = useState(false);
  const [pending, startTransition] = useTransition();
  const avatarColor = getProjectColor(project.id);
  const isUnread = unreadCount > 0;
  const dateLabel = formatSlashDate(lastMessage?.created_at ?? project.created_at);
  const preview = lastMessage?.content ?? "Aucun message pour l'instant.";

  return (
    <div
      className="relative flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          isUnread ? "bg-[var(--color-terracotta)]" : "bg-transparent"
        }`}
      />

      <Link
        href={`/agence/messagerie/${project.id}`}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        <div
          className="w-9 h-9 rounded-full text-xs flex items-center justify-center font-semibold shrink-0"
          style={{ backgroundColor: avatarColor.background, color: avatarColor.text }}
        >
          {project.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className={`text-sm truncate ${isUnread ? "font-semibold" : "font-medium"}`}>
            {project.name}
          </div>
          <div className="text-xs text-zinc-400 truncate">{preview}</div>
        </div>
        <div className="text-xs text-zinc-400 shrink-0">{dateLabel}</div>
      </Link>

      <div
        className={`flex items-center gap-1 shrink-0 transition-opacity ${
          hovered ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <button
          type="button"
          disabled={pending}
          title={isUnread ? "Marquer comme lu" : "Marquer comme non lu"}
          onClick={() =>
            startTransition(async () => {
              if (isUnread) await markThreadRead(project.id);
              else await markThreadUnread(project.id);
            })
          }
          className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-[var(--color-terracotta-deep)] hover:bg-white transition-colors disabled:opacity-50"
        >
          {isUnread ? <MailOpen className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
        </button>
        <button
          type="button"
          disabled={pending}
          title={project.archived ? "Désarchiver" : "Archiver"}
          onClick={() =>
            startTransition(async () => {
              await toggleArchiveProject(project.id, !project.archived);
            })
          }
          className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-[var(--color-terracotta-deep)] hover:bg-white transition-colors disabled:opacity-50"
        >
          {project.archived ? (
            <ArchiveRestore className="w-3.5 h-3.5" />
          ) : (
            <Archive className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
