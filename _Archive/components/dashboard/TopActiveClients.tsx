import { formatRelativeDate } from "@/lib/format";
import { getProjectColor } from "@/lib/projectColor";
import type { DashboardTopClient } from "./types";

export function TopActiveClients({ clients }: { clients: DashboardTopClient[] }) {
  return (
    <div className="glass rounded-card p-[19px] h-full">
      <h2 className="text-[12.5px] font-semibold mb-4">Clients les plus actifs</h2>
      {clients.length === 0 ? (
        <p className="text-xs text-ink-400">Aucune activité récente.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {clients.map((client) => {
            const avatarColor = getProjectColor(client.id);
            return (
              <li key={client.id} className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full text-[10.5px] flex items-center justify-center font-semibold shrink-0"
                  style={{
                    backgroundColor: avatarColor.background,
                    color: avatarColor.text,
                  }}
                >
                  {client.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium truncate">{client.name}</div>
                  <div className="text-[10.5px] text-ink-400">
                    {client.projectCount} projet{client.projectCount > 1 ? "s" : ""} ·{" "}
                    {formatRelativeDate(client.lastActivity)}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
