import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ScheduleData, ShiftData, ShiftType } from '../src/hooks/useScheduleTypes';
import { useWorkScheduleManagement } from '../src/hooks/useWorkScheduleManagement';
import type { Shift, User } from '../types';
import { ScheduleCalendar } from './ScheduleCalendar';
import { ShiftSelector } from './ShiftSelector';
import { AppHeader } from './ui/app-header';

interface WorkScheduleProps {
  user: User;
  selectedShift: Shift;
  onNavigate: (page: string) => void;
}

function normalizeShiftText(value: string): string {
  return value
    .trim()
    .replace(/１/g, "1")
    .replace(/２/g, "2")
    .replace(/３/g, "3")
    .replace(/\s+/g, "");
}

function toShiftType(shift: string): ShiftType {
  const normalized = normalizeShiftText(shift);
  if (normalized === "1") return "1勤";
  if (normalized === "2") return "2勤";
  if (normalized === "3") return "3勤";
  if (
    normalized === "" ||
    normalized === "1勤" ||
    normalized === "2勤" ||
    normalized === "3勤" ||
    normalized === "1A" ||
    normalized === "3B" ||
    normalized === "指定休" ||
    normalized === "有給" ||
    normalized === "休"
  ) {
    return normalized as ShiftType;
  }
  return "";
}

function toShift(shiftType: ShiftType, fallback: string): string {
  const normalized = normalizeShiftText(shiftType);
  if (normalized === "1勤") return "1";
  if (normalized === "2勤") return "2";
  if (normalized === "3勤") return "3";
  if (normalized.length === 0) return normalizeShiftText(fallback);
  return normalized;
}

export function WorkSchedule({ user, selectedShift, onNavigate }: WorkScheduleProps) {
  const defaultShift: ShiftType = toShiftType(selectedShift);
  const [preferredShift, setPreferredShift] = useState<ShiftType>(defaultShift);
  const { state, data, actions } = useWorkScheduleManagement(user, selectedShift);
  const currentUserId = user.id;

  const scheduleData = useMemo<ScheduleData>(() => {
    const year = state.currentMonth.getFullYear();
    const month = state.currentMonth.getMonth() + 1;

    const schedule: Record<number, ShiftData> = {};
    for (const entry of data.scheduleEntries) {
      const parts = entry.date.split("-").map((p) => Number(p));
      if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) continue;
      const [y, m, d] = parts;
      if (y !== year || m !== month) continue;
      schedule[d] = {
        shift: toShiftType(entry.shift),
        workplace: entry.memo?.trim() ? entry.memo.trim() : "",
      };
    }

    return {
      year,
      month,
      employees: [
        {
          id: user.id,
          name: user.displayName,
          schedule,
        },
      ],
    };
  }, [data.scheduleEntries, state.currentMonth, user.displayName, user.id]);

  const handleUpdateShift = async (employeeId: string, day: number, shiftData: ShiftData) => {
    const workDate = `${scheduleData.year}-${String(scheduleData.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const shiftToSave = toShift(shiftData.shift || preferredShift, selectedShift);
    const memo = shiftData.workplace.trim().length > 0 ? shiftData.workplace.trim() : null;
    await actions.handleSelectDate(new Date(`${workDate}T12:00:00`), shiftToSave, memo);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <AppHeader
        title="勤務表"
        subtitle={`${user.displayName} - ${user.department}`}
        onBack={() => onNavigate('index')}
      />

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View className="bg-white rounded-xl border border-gray-200 p-3">
          <Text className="text-sm font-bold text-gray-700">デフォルト勤務帯</Text>
          <ShiftSelector value={preferredShift} onSelect={(shift) => setPreferredShift(shift)} />
        </View>

        <View className="rounded-xl overflow-hidden border border-gray-200 bg-white">
          <ScheduleCalendar
            scheduleData={scheduleData}
            currentUserId={currentUserId}
            onUpdateShift={handleUpdateShift}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
