import { useMemo, useState } from 'react';
import type { ScheduleData, ShiftData } from './useScheduleTypes';

const EMPTY_SHIFT_DATA: ShiftData = { shift: '', workplace: '' };

type UseScheduleCalendarManagementParams = {
  scheduleData: ScheduleData;
  currentUserId: string;
  onUpdateShift: (employeeId: string, day: number, shiftData: ShiftData) => void;
};

export function useScheduleCalendarManagement({
  scheduleData,
  currentUserId,
  onUpdateShift,
}: UseScheduleCalendarManagementParams) {
  const currentUser = scheduleData.employees.find((e) => e.id === currentUserId);
  const currentSchedule = currentUser?.schedule;

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const daysInMonth = useMemo(
    () => new Date(scheduleData.year, scheduleData.month, 0).getDate(),
    [scheduleData.year, scheduleData.month]
  );

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === scheduleData.year &&
    today.getMonth() + 1 === scheduleData.month;
  const todayDate = today.getDate();

  const selectedShiftData: ShiftData = useMemo(() => {
    if (selectedDay == null || !currentSchedule) return EMPTY_SHIFT_DATA;
    return currentSchedule[selectedDay] || EMPTY_SHIFT_DATA;
  }, [selectedDay, currentSchedule]);

  const handlePressDay = (day: number) => {
    setSelectedDay(day);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedDay(null);
  };

  const handleSave = (shiftData: ShiftData) => {
    if (selectedDay == null) return;
    onUpdateShift(currentUserId, selectedDay, shiftData);
    handleCloseModal();
  };

  return {
    state: {
      selectedDay,
      modalVisible,
    },
    data: {
      currentUser,
      daysInMonth,
      todayDate,
      isCurrentMonth,
      selectedShiftData,
      emptyShiftData: EMPTY_SHIFT_DATA,
    },
    actions: {
      handlePressDay,
      handleCloseModal,
      handleSave,
    },
  };
}
