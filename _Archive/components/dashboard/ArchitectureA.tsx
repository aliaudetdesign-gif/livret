import { DashboardCalendar } from "@/components/DashboardCalendar";
import { StatusDonut } from "./StatusDonut";
import { WeeklyActivityChart } from "./WeeklyActivityChart";
import { RecentActivityList } from "./RecentActivityList";
import type { DashboardData } from "./types";

export function ArchitectureA({ data }: { data: DashboardData }) {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-4 gap-3.5">
        <div className="col-span-2">
          <WeeklyActivityChart days={data.weeklyActivity} />
        </div>
        <StatusDonut counts={data.statusCounts} />
        <div className="self-start">
          <DashboardCalendar />
        </div>
      </div>
      <RecentActivityList activities={data.activities} columns={2} />
    </div>
  );
}
