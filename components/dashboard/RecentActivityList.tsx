import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { formatRelativeDate } from "@/lib/format";
import type { AssetType } from "@/lib/types";
import type { DashboardActivity } from "./types";

const ASSET_ICONS: Record<AssetType, string> = {
  logo: "🖼️",
  couleur: "🎨",
  typographie: "Aa",
  moodboard: "📷",
  guide: "📘",
};

export function RecentActivityList({
  activities,
  columns = 1,
}: {
  activities: DashboardActivity[];
  columns?: 1 | 2;
}) {
  return (
    <div className="glass rounded-card p-[19px] h-full">
      <h2 className="text-[12.5px] font-semibold mb-4">Dernières activités</h2>
      {activities.length === 0 ? (
        <p className="text-xs text-ink-400">Aucune activité pour l&apos;instant.</p>
      ) : (
        <ul
          className={
            columns === 2
              ? "grid grid-cols-2 gap-x-5 gap-y-3.5"
              : "flex flex-col gap-3.5"
          }
        >
          {activities.map((activity) => (
            <li key={activity.id} className="flex items-start gap-2.5">
              <div className="w-[29px] h-[29px] rounded-chip bg-white/65 border border-white/60 text-ink-500 flex items-center justify-center shrink-0 mt-0.5">
                {activity.kind === "asset" ? (
                  <span className="text-[13px] font-semibold leading-none">
                    {activity.assetType ? ASSET_ICONS[activity.assetType] : "📄"}
                  </span>
                ) : (
                  <MessageCircle className="w-[13px] h-[13px]" strokeWidth={1.8} />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-xs text-ink-700 leading-[1.4]">
                  {activity.title}
                </div>
                {activity.kind === "asset" && activity.projectId && (
                  <Link
                    href={`/agence/projets/${activity.projectId}`}
                    className="text-[11px] text-ink-400 hover:text-clay-600"
                  >
                    chez {activity.projectName}
                  </Link>
                )}
                <div className="text-[10px] text-ink-400/80 mt-0.5">
                  {formatRelativeDate(activity.createdAt)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
