import { supabase } from "@/lib/supabase";
import type { Shift } from "../../types";

export type DashboardUnreadIncident = {
  id: string;
  title: string;
  time: string;
  severity: string;
  shift: Shift;
};

export type DashboardRecentAnnouncement = {
  id: string;
  title: string;
  time: string;
  pinned: boolean;
};

export type DashboardSummary = {
  unreadIncidents: DashboardUnreadIncident[];
  recentAnnouncements: DashboardRecentAnnouncement[];
};

function formatIncidentTime(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAnnouncementTime(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseShift(v: string): Shift {
  return v === "1勤" || v === "2勤" || v === "3勤" ? v : "1勤";
}

const INCIDENT_LIMIT = 3;
const ANNOUNCEMENT_LIMIT = 3;

export async function fetchDashboardSummary(params: {
  departmentId: string | null;
}): Promise<DashboardSummary> {
  if (!params.departmentId) {
    return { unreadIncidents: [], recentAnnouncements: [] };
  }

  const deptId = params.departmentId;

  const [incidentsRes, announcementsRes] = await Promise.all([
    supabase
      .from("incident_reports")
      .select("id, title, severity, shift, created_at")
      .eq("department_id", deptId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(INCIDENT_LIMIT),
    supabase
      .from("department_announcements")
      .select("id, title, is_pinned, created_at")
      .eq("department_id", deptId)
      .is("deleted_at", null)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(ANNOUNCEMENT_LIMIT),
  ]);

  if (incidentsRes.error) throw new Error(incidentsRes.error.message);
  if (announcementsRes.error) throw new Error(announcementsRes.error.message);

  const incidentRows = incidentsRes.data ?? [];
  const unreadIncidents: DashboardUnreadIncident[] = incidentRows.map((row) => ({
    id: row.id,
    title: row.title,
    severity: row.severity,
    shift: parseShift(row.shift),
    time: formatIncidentTime(row.created_at),
  }));

  const annRows = announcementsRes.data ?? [];
  const recentAnnouncements: DashboardRecentAnnouncement[] = annRows.map((row) => ({
    id: row.id,
    title: row.title,
    pinned: row.is_pinned,
    time: formatAnnouncementTime(row.created_at),
  }));

  return { unreadIncidents, recentAnnouncements };
}
