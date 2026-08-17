import { DashboardCalendar } from "@/components/DashboardCalendar";
import { DeadlinesTimeline } from "./DeadlinesTimeline";
import { MessagingPreview } from "./MessagingPreview";
import { RecentActivityList } from "./RecentActivityList";
import type { DashboardData } from "./types";

export function ArchitectureB({ data }: { data: DashboardData }) {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-4 gap-3.5">
        <div className="col-span-2">
          <DeadlinesTimeline deadlines={data.upcomingDeadlines} />
        </div>
        <div className="col-span-2">
          <MessagingPreview messages={data.messagePreview} />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3.5">
        <div className="self-start">
          <DashboardCalendar />
        </div>
        <div className="col-span-3">
          <RecentActivityList activities={data.activities} columns={2} />
        </div>
      </div>
    </div>
  );
}
