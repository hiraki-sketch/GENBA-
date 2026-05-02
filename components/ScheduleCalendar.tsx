import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useScheduleCalendarManagement } from '../src/hooks/useScheduleCalendarManagement';
import type { ScheduleData, ShiftData } from '../src/hooks/useScheduleTypes';
import { ScheduleModal } from './ScheduleModal';
import { ShiftCell } from './ShiftCell';

interface ScheduleCalendarProps {
  scheduleData: ScheduleData;
  currentUserId: string;
  onUpdateShift: (employeeId: string, day: number, shiftData: ShiftData) => void;
}

export function ScheduleCalendar({
  scheduleData,
  currentUserId,
  onUpdateShift,
}: ScheduleCalendarProps) {
  const { state, data, actions } = useScheduleCalendarManagement({
    scheduleData,
    currentUserId,
    onUpdateShift,
  });

  if (!data.currentUser) return null;
  const currentUser = data.currentUser;

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {scheduleData.year}年 {scheduleData.month}月
          </Text>
          <Text style={styles.headerSubTitle}>{currentUser.name} さんの勤務表</Text>
        </View>

        <View style={styles.list}>
          {Array.from({ length: data.daysInMonth }, (_, i) => i + 1).map((day) => {
            const date = new Date(scheduleData.year, scheduleData.month - 1, day);
            const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isToday = data.isCurrentMonth && day === data.todayDate;
            const shiftData = currentUser.schedule[day] || data.emptyShiftData;

            return (
              <Pressable
                key={day}
                onPress={() => actions.handlePressDay(day)}
                style={[
                  styles.card,
                  isWeekend && styles.weekendCard,
                  isToday && styles.todayCard,
                ]}
              >
                <View style={styles.left}>
                  <Text style={[styles.dayText, isWeekend && styles.weekendText]}>
                    {day}
                  </Text>
                  <Text style={[styles.weekText, isWeekend && styles.weekendText]}>
                    {dayOfWeek}
                  </Text>
                </View>

                <View style={styles.center}>
                  <ShiftCell shiftData={shiftData} />
                </View>

                <View style={styles.right}>
                  {isToday ? (
                    <View style={styles.todayBadge}>
                      <Text style={styles.todayBadgeText}>今日</Text>
                    </View>
                  ) : (
                    <Text style={styles.editText}>編集</Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <ScheduleModal
        visible={state.modalVisible}
        day={state.selectedDay}
        currentData={data.selectedShiftData}
        employeeName={currentUser.name}
        onClose={actions.handleCloseModal}
        onSave={actions.handleSave}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubTitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  list: {
    padding: 16,
    gap: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekendCard: {
    backgroundColor: '#FFF7ED',
  },
  todayCard: {
    borderColor: '#22C55E',
    borderWidth: 1.5,
    backgroundColor: '#F0FDF4',
  },
  left: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  center: {
    flex: 1,
  },
  right: {
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  weekText: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  weekendText: {
    color: '#EA580C',
  },
  todayBadge: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  todayBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  editText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '700',
  },
});