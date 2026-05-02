import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import type { Shift, User, WorkScheduleEntry } from "../../types";
import {
  fetchMyWorkSchedules,
  upsertMyWorkSchedule,
} from "../api/workschedules";

export function useWorkScheduleManagement(user: User, selectedShift: Shift) {
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const schedulesQuery = useQuery({
    queryKey: ["workSchedules", user.id],
    enabled: Boolean(user.id),
    queryFn: () => fetchMyWorkSchedules(user.id),
  });

  const createMutation = useMutation({
    mutationFn: upsertMyWorkSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workSchedules", user.id] });
    },
  });

  const formatDateForComparison = useCallback((date: Date) => {
    return date.toISOString().split("T")[0];
  }, []);

  const allScheduleEntries = useMemo<WorkScheduleEntry[]>(() => {
    return (schedulesQuery.data ?? []).map((item) => ({
      id: item.id,
      userId: item.userId,
      date: item.workDate,
      shift: item.shift as Shift,
      memo: item.memo,
      startTime: "",
      endTime: "",
      department: user.department,
      status: "scheduled",
    }));
  }, [schedulesQuery.data, user.department]);

  const filteredScheduleEntries = useMemo(
    () => allScheduleEntries.filter((entry) => entry.shift === selectedShift),
    [allScheduleEntries, selectedShift]
  );

  const getScheduleForDate = useCallback(
    (date: Date) => {
      const dateStr = formatDateForComparison(date);
      return filteredScheduleEntries.find((entry) => entry.date === dateStr);
    },
    [filteredScheduleEntries, formatDateForComparison]
  );

  const handleSelectDate = useCallback(
    async (date: Date, shiftOverride?: string | null, memo?: string | null) => {
      setSelectedDate(date);

      const dateStr = formatDateForComparison(date);

      const shiftToSave =
        shiftOverride && shiftOverride.trim().length > 0 ? shiftOverride : selectedShift;

      await createMutation.mutateAsync({
        userId: user.id,
        workDate: dateStr,
        shift: shiftToSave,
        memo: memo ?? null,
      });
    },
    [createMutation, formatDateForComparison, selectedShift, user.id]
  );

  const getShiftColor = useCallback((shift: Shift) => {
    switch (shift) {
      case "1勤":
        return "bg-blue-100";
      case "2勤":
        return "bg-green-100";
      case "3勤":
        return "bg-purple-100";
      default:
        return "bg-gray-100";
    }
  }, []);

  const getShiftTextColor = useCallback((shift: Shift) => {
    switch (shift) {
      case "1勤":
        return "text-blue-800";
      case "2勤":
        return "text-green-800";
      case "3勤":
        return "text-purple-800";
      default:
        return "text-gray-800";
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "confirmed":
        return "text-green-600";
      case "scheduled":
        return "text-blue-600";
      case "completed":
        return "text-gray-600";
      default:
        return "text-gray-500";
    }
  }, []);

  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case "confirmed":
        return "確定";
      case "scheduled":
        return "予定";
      case "completed":
        return "完了";
      default:
        return "不明";
    }
  }, []);

  const getDaysInMonth = useCallback((date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: Date[] = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, []);

  const previousMonth = useCallback(() => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  }, []);

  const nextMonth = useCallback(() => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  }, []);

  const days = useMemo(
    () => getDaysInMonth(currentMonth),
    [currentMonth, getDaysInMonth]
  );

  const monthNames = useMemo(
    () => [
      "1月",
      "2月",
      "3月",
      "4月",
      "5月",
      "6月",
      "7月",
      "8月",
      "9月",
      "10月",
      "11月",
      "12月",
    ],
    []
  );

  const dayNames = useMemo(() => ["日", "月", "火", "水", "木", "金", "土"], []);

  return {
    state: {
      selectedDate,
      currentMonth,
    },
    data: {
      /** カレンダー表示用（全勤務帯） */
      scheduleEntries: allScheduleEntries,
      /** グローバル勤務帯フィルタ適用後 */
      filteredScheduleEntries,
      days,
      monthNames,
      dayNames,
    },
    utils: {
      getShiftColor,
      getShiftTextColor,
      getStatusColor,
      getStatusText,
      formatDateForComparison,
      getScheduleForDate,
    },
    actions: {
      setSelectedDate,
      previousMonth,
      nextMonth,
      handleSelectDate,
    },
    query: {
      isPending: schedulesQuery.isPending,
      isError: schedulesQuery.isError,
      error: schedulesQuery.error,
      refetch: schedulesQuery.refetch,
      isSaving: createMutation.isPending,
    },
  };
}