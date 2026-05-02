export type ShiftType =
  | ''
  | '1勤'
  | '2勤'
  | '3勤'
  | '1A'
  | '3B'
  | '指定休'
  | '有給'
  | '休';

export type ShiftData = {
  shift: ShiftType;
  workplace: string;
};

type Employee = {
  id: string;
  name: string;
  schedule: Record<number, ShiftData>;
};

export type ScheduleData = {
  year: number;
  month: number;
  employees: Employee[];
};
