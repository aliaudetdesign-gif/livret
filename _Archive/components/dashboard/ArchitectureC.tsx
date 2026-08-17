import { DashboardCalendar } from "@/components/DashboardCalendar";
import { StatusKanban } from "./StatusKanban";
import { TopActiveClients } from "./TopActiveClients";
import { MessagingPreview } from "./MessagingPreview";
import { RecentActivityList } from "./RecentActivityList";
import type { DashboardData } from "./types";

export function ArchitectureC({ data }: { data: DashboardData }) {
  return (
    <div className="flex flex-col gap-3.5">
      <StatusKanban projects={data.activeProjects} />
      <div className="grid grid-cols-4 gap-3.5">
        <div className="col-span-2">
          <TopActiveClients clients={data.topClients} />
        </div>
        <div className="self-start">
          <DashboardCalendar />
        </div>
        <MessagingPreview messages={data.messagePreview} />
      </div>
      <RecentActivityList activities={data.activities} columns={2} />
    </div>
  );
}
