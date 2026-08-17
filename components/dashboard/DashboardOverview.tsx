import Link from "next/link";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { DashboardCalendar } from "@/components/DashboardCalendar";
import { DeadlinesTimeline } from "./DeadlinesTimeline";
import { RecentActivityList } from "./RecentActivityList";
import { MessagingPreview } from "./MessagingPreview";
import { RecentProjectQuickAccess } from "./RecentProjectQuickAccess";
import { StatusDonut } from "./StatusDonut";
import type { DashboardData } from "./types";

export type DashboardStat = {
  label: string;
  value: number;
  trend: number;
  href: string;
};

export function DashboardOverview({
  stats,
  data,
}: {
  stats: DashboardStat[];
  data: DashboardData;
}) {
  const recentProjects = data.activeProjects.slice(0, 4);

  return (
    <div>
      <div className="mb-[22px] px-1">
        <h1 className="text-[27px] font-semibold tracking-[-0.028em]">Dashboard</h1>
        <p className="text-ink-500 text-[13.5px] mt-0.5">
          Gérez, visualisez et personnalisez votre aperçu global
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3.5 mb-3.5">
        {stats.map((stat) => (
          <StatTrendCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-4 grid-rows-2 gap-3.5 mb-[26px]">
        <div className="col-start-1 row-start-1">
          <DashboardCalendar />
        </div>
        <div className="col-start-2 col-span-2 row-start-1">
          <DeadlinesTimeline deadlines={data.upcomingDeadlines} />
        </div>
        <div className="col-start-4 row-start-1 row-span-2">
          <RecentActivityList activities={data.activities} columns={1} />
        </div>
        <div className="col-start-1 row-start-2">
          <MessagingPreview messages={data.messagePreview} />
        </div>
        <div className="col-start-2 row-start-2">
          <RecentProjectQuickAccess projects={recentProjects} />
        </div>
        <div className="col-start-3 row-start-2">
          <StatusDonut counts={data.statusCounts} />
        </div>
      </div>
    </div>
  );
}

function StatTrendCard({ label, value, trend, href }: DashboardStat) {
  return (
    <Link href={href} className="glass hover-lift rounded-card p-[19px] block">
      <div className="flex items-start justify-between mb-[22px]">
        <div className="text-[12.5px] font-medium text-ink-700 max-w-[110px] leading-[1.35]">
          {label}
        </div>
        <div className="w-7 h-7 rounded-full bg-ink-900/90 text-white flex items-center justify-center shrink-0">
          <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
        </div>
      </div>
      <div className="text-[34px] font-semibold tracking-[-0.04em] leading-none mb-[11px]">
        {value}
      </div>
      {trend > 0 && (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ok-600 bg-ok-100 rounded-full px-2.5 py-[3.5px]">
          <ArrowUp className="w-[11px] h-[11px]" strokeWidth={2.4} />
          {trend}
        </span>
      )}
    </Link>
  );
}
