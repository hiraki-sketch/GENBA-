import { supabase } from "@/lib/supabase";

export type WorkSchedule = {
  id: string;
  userId: string;
  workDate: string;
  shift: string;
  memo: string | null;
};

type WorkScheduleRow = {
  id: string;
  user_id: string;
  work_date: string;
  shift: string;
  memo: string | null;
};

function mapRow(row: WorkScheduleRow): WorkSchedule {
  return {
    id: row.id,
    userId: row.user_id,
    workDate: row.work_date,
    shift: row.shift,
    memo: row.memo,
  };
}

export async function fetchMyWorkSchedules(userId: string): Promise<WorkSchedule[]> {
  const { data, error } = await supabase
    .from("work_schedules")
    .select("id, user_id, work_date, shift, memo")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("work_date", { ascending: true });

  if (error) throw new Error(error.message);

  return ((data as WorkScheduleRow[] | null) ?? []).map(mapRow);
}

export async function upsertMyWorkSchedule(input: {
  userId: string;
  workDate: string;
  shift: string;
  memo?: string | null;
}): Promise<void> {
  const now = new Date().toISOString();

  const { data: existing, error: existingError } = await supabase
    .from("work_schedules")
    .select("id")
    .eq("user_id", input.userId)
    .eq("work_date", input.workDate)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from("work_schedules")
      .update({
        shift: input.shift,
        memo: input.memo ?? null,
        updated_at: now,
        deleted_at: null,
      })
      .eq("id", existing.id);

    if (updateError) throw new Error(updateError.message);
    return;
  }

  const { error: insertError } = await supabase.from("work_schedules").insert({
    user_id: input.userId,
    work_date: input.workDate,
    shift: input.shift,
    memo: input.memo ?? null,
    updated_at: now,
    deleted_at: null,
  });

  if (insertError) throw new Error(insertError.message);
}

export async function deleteMyWorkSchedule(id: string): Promise<void> {
  const { error } = await supabase
    .from("work_schedules")
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
}