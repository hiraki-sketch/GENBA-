import { useCallback, useMemo, useState } from "react";
import type { Shift, User } from "../../types";
import { useQuery } from "@tanstack/react-query";
import {
  searchDepartmentAnnouncements,
  type DepartmentAnnouncement,
} from "../api/departmentAnnouncements";
import { searchIncidentReports } from "../api/incidentReports";
import { queryKeys } from "../lib/queryKeys";


export type SearchType = "all" | "incident" | "announcement";
type SeverityFilter = "all" | "low" | "medium" | "high";

type IncidentResult = {
  id: string;
  type: "incident";
  title: string;
  content: string;
  severity: "low" | "medium" | "high";
  status: "open";
  shift: Shift;
  author: string;
  createdAt: string;
  department: string;
};

type AnnouncementResult = {
  id: string;
  type: "announcement";
  title: string;
  content: string;
  author: string;
  createdAt: string;
  department: string;
};

function normalizeSeverity(value: string): "low" | "medium" | "high" {
  if (value === "low" || value === "medium" || value === "high") return value;
  return "medium";
}

export function useSearchPageManagement(user: User, initialShift?: Shift) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("all");
  const [selectedShift, setSelectedShift] = useState<Shift | "all">(
    initialShift ?? "all"
  );
  const [selectedSeverity, setSelectedSeverity] =
    useState<SeverityFilter>("all");
  const [showFilters, setShowFilters] = useState(false);

  const trimmedSearchTerm = searchTerm.trim();

  const announcementsQuery = useQuery<DepartmentAnnouncement[]>({
    queryKey: queryKeys.departmentAnnouncements.search(
      user.departmentId ?? "",
      trimmedSearchTerm
    ),
    enabled:
      Boolean(user.departmentId) &&
      trimmedSearchTerm.length > 0 &&
      (searchType === "all" || searchType === "announcement"),
    queryFn: (): Promise<DepartmentAnnouncement[]> =>
      searchDepartmentAnnouncements(user.departmentId!, trimmedSearchTerm),
  });

  const incidentsQuery = useQuery({
    queryKey: queryKeys.incidentReports.search(user.departmentId ?? "", trimmedSearchTerm),
    enabled:
      Boolean(user.departmentId) &&
      trimmedSearchTerm.length > 0 &&
      (searchType === "all" || searchType === "incident"),
    queryFn: () => searchIncidentReports(user.departmentId!, trimmedSearchTerm),
  });

  const filteredResults = useMemo<(IncidentResult | AnnouncementResult)[]>(() => {
    if (!trimmedSearchTerm) return [];

    const incidentResults: IncidentResult[] = (incidentsQuery.data ?? [])
      .filter((item) => selectedShift === "all" || item.shift === selectedShift)
      .filter((item) => selectedSeverity === "all" || item.severity === selectedSeverity)
      .map((item) => ({
        id: item.id,
        type: "incident" as const,
        title: item.title,
        content: item.body,
        severity: normalizeSeverity(item.severity),
        status: "open",
        shift: item.shift,
        author: item.reporterName ?? "不明",
        createdAt: new Date(item.createdAt).toLocaleString("ja-JP"),
        department: user.department,
      }));

    if (searchType === "incident") return incidentResults;

    const rows = announcementsQuery.data ?? [];
    const announcementResults: AnnouncementResult[] = rows.map((item) => ({
      id: item.id,
      type: "announcement" as const,
      title: item.title,
      content: item.body,
      author: item.authorName ?? "不明",
      createdAt: item.createdAt,
      department: user.department,
    }));
    if (searchType === "announcement") return announcementResults;

    return [...incidentResults, ...announcementResults];
  }, [
    announcementsQuery.data,
    incidentsQuery.data,
    searchType,
    selectedSeverity,
    selectedShift,
    trimmedSearchTerm,
    user.department,
  ]);

  const getTypeIcon = useCallback((type: string) => {
    switch (type) {
      case "incident":
        return "🚨";
      case "announcement":
        return "📢";
      default:
        return "🔍";
    }
  }, []);

  const getTypeText = useCallback((type: string) => {
    switch (type) {
      case "incident":
        return "異常報告";
      case "announcement":
        return "部署連絡";
      default:
        return "不明";
    }
  }, []);

  const toggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  return {
    state: {
      searchTerm,
      searchType,
      selectedShift,
      selectedSeverity,
      showFilters,
    },
    data: {
      filteredResults,
    },
    utils: {
      getTypeIcon,
      getTypeText,
    },
    actions: {
      setSearchTerm,
      setSearchType,
      setSelectedShift,
      setSelectedSeverity,
      toggleFilters,
    },
    query: {
      incidentsPending: incidentsQuery.isPending,
      incidentsFetching: incidentsQuery.isFetching,
      incidentsError: incidentsQuery.isError,
      incidentsErrorMessage:
        incidentsQuery.error instanceof Error ? incidentsQuery.error.message : null,
      refetchIncidents: incidentsQuery.refetch,
      announcementsPending: announcementsQuery.isPending,
      announcementsFetching: announcementsQuery.isFetching,
      announcementsError: announcementsQuery.isError,
      announcementsErrorMessage:
        announcementsQuery.error instanceof Error
          ? announcementsQuery.error.message
          : null,
      refetchAnnouncements: announcementsQuery.refetch,
    },
  };
}