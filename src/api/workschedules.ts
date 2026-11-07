import { supabase } from "@/lib/supabase";

function normalizeWorkScheduleError(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string" &&
    (error as { message: string }).message.trim().length > 0
  ) {
    const raw = (error as { message: string }).message.toLowerCase();
    if (raw.includes("row-level security")) return "アクセス権限がありません";
    if (raw.includes("permission denied")) return "アクセス権限がありません";
    if (raw.includes("network")) return "ネットワークエラーが発生しました";
    if (raw.includes("timeout")) return "通信がタイムアウトしました";
  }
  return fallback;
}

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

  if (error) {
    throw new Error(
      normalizeWorkScheduleError(error, "勤務表の取得に失敗しました")
    );
  }

  return ((data as WorkScheduleRow[] | null) ?? []).map(mapRow);
}

type WorkScheduleInput = {
  userId: string;
  workDate: string;
  shift: string;
  memo?: string | null;
};

export async function upsertMyWorkSchedules(
  inputs: WorkScheduleInput[]
): Promise<void> {
  if (inputs.length === 0) return;

  const userId = inputs[0].userId;
  const now = new Date().toISOString();
  const dates = inputs.map((input) => input.workDate);

  const { data: existingRows, error: existingError } = await supabase
    .from("work_schedules")
    .select("id, work_date")
    .eq("user_id", userId)
    .in("work_date", dates);

  if (existingError) {
    throw new Error(
      normalizeWorkScheduleError(existingError, "勤務表の既存データ確認に失敗しました")
    );
  }

  const existingIdByDate = new Map<string, string>();
  for (const row of (existingRows ?? []) as { id: string; work_date: string }[]) {
    existingIdByDate.set(row.work_date, row.id);
  }

  const inserts: {
    user_id: string;
    work_date: string;
    shift: string;
    memo: string | null;
    updated_at: string;
    deleted_at: null;
  }[] = [];
  const updates: PromiseLike<unknown>[] = [];

  for (const input of inputs) {
    const existingId = existingIdByDate.get(input.workDate);
    if (existingId) {
      updates.push(
        supabase
          .from("work_schedules")
          .update({
            shift: input.shift,
            memo: input.memo ?? null,
            updated_at: now,
            deleted_at: null,
          })
          .eq("id", existingId)
          .then(({ error }) => {
            if (error) throw error;
          })
      );
      continue;
    }

    inserts.push({
      user_id: input.userId,
      work_date: input.workDate,
      shift: input.shift,
      memo: input.memo ?? null,
      updated_at: now,
      deleted_at: null,
    });
  }

  const results = await Promise.all([
    inserts.length > 0
      ? supabase.from("work_schedules").insert(inserts)
      : Promise.resolve({ error: null }),
    ...updates,
  ]);

  const insertResult = results[0] as { error: { message?: string } | null };
  if (insertResult.error) {
    throw new Error(
      normalizeWorkScheduleError(insertResult.error, "勤務表の登録に失敗しました")
    );
  }
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

  if (existingError) {
    throw new Error(
      normalizeWorkScheduleError(
        existingError,
        "勤務表の既存データ確認に失敗しました"
      )
    );
  }

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

    if (updateError) {
      throw new Error(
        normalizeWorkScheduleError(updateError, "勤務表の更新に失敗しました")
      );
    }
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

  if (insertError) {
    throw new Error(
      normalizeWorkScheduleError(insertError, "勤務表の登録に失敗しました")
    );
  }
}

export async function deleteMyWorkSchedule(id: string): Promise<void> {
  const { error } = await supabase
    .from("work_schedules")
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(
      normalizeWorkScheduleError(error, "勤務表の削除に失敗しました")
    );
  }
}