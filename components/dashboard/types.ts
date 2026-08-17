import type { AssetType, Project } from "@/lib/types";

export type DashboardActivity = {
  id: string;
  kind: "asset" | "message";
  assetType?: AssetType;
  title: string;
  projectName: string;
  projectId: string | null;
  createdAt: string;
};

export type DashboardMessagePreview = {
  id: string;
  projectId: string | null;
  projectName: string;
  content: string;
};

export type DashboardTopClient = {
  id: string;
  name: string;
  lastActivity: string;
  projectCount: number;
};

export type DashboardStatusCounts = {
  en_cours: number;
  attente_validation: number;
  livre: number;
};

export type DashboardData = {
  activeProjects: Project[];
  statusCounts: DashboardStatusCounts;
  weeklyActivity: { label: string; count: number }[];
  upcomingDeadlines: { id: string; name: string; end_date: string }[];
  activities: DashboardActivity[];
  messagePreview: DashboardMessagePreview[];
  topClients: DashboardTopClient[];
};
