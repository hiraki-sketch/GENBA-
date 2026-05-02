export interface User {
  id: string;
  displayName: string;
  departmentId: string | null;
  departmentName: string| null;
  // 互換用（段階移行が終わったら削除）
  department: string;
  email: string;
  role?: 'admin' | 'manager' | 'member';
}

export type Shift = '1勤' | '2勤' | '3勤';

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  shift: Shift;
  clockIn: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  status: 'present' | 'late' | 'absent' | 'early_leave';
  notes: string;
}

export interface Thread {
  id: string;
  title: string;
  department: string;
  shift?: Shift;
  createdBy: string;
  createdAt: string;
  messageCount: number;
}

export interface Message {
  id: string;
  threadId: string;
  author: string;
  body: string;
  createdAt: string;
}

/** Supabase `incident_reports` のカラムに対応 */
export interface Incident {
  id: string;
  title: string;
  body: string;
  attachmentUrls?: string[];
  severity: string;
  shift: Shift;
  departmentId: string;
  reportedBy: string;
  reporterName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VacationRequest {
  id: string;
  userId: string;
  shift?: Shift;
  startDate: string;
  endDate: string;
  type: 'paid_leave' | 'sick_leave' | 'personal_leave' | 'compensatory_leave';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface WorkScheduleEntry {
  id: string;
  userId: string;
  date: string;
  shift: Shift;
  /** DB `work_schedules.memo`（勤務場所など） */
  memo?: string | null;
  startTime: string;
  endTime: string;
  department: string;
  status: 'scheduled' | 'confirmed' | 'completed';
}
