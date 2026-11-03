import { supabase } from "@/lib/supabase";
import type { Message, Thread } from "../../types";

type ChatMessageRow = {
    id: string;
    thread_id: string;
    user_id: string | null;
    content: string;
    created_at: string;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
};

function normalizeChatErrorMessage(
  error: unknown,
  fallback: string
): string {
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

async function buildDisplayNameById(
  userIds: string[]
): Promise<Record<string, string | null>> {
  const uniq = Array.from(new Set(userIds));
  if (uniq.length === 0) return {};

  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", uniq);

  if (profilesError) {
    throw new Error(
      normalizeChatErrorMessage(profilesError, "プロフィールの取得に失敗しました")
    );
  }

  const map: Record<string, string | null> = {};
  for (const p of (profilesData ?? []) as ProfileRow[]) {
    map[p.id] = p.display_name ?? null;
  }
  return map;
}

function mapChatMessage(
  row: ChatMessageRow,
  displayNameById: Record<string, string | null>
): Message {
  return {
    id: row.id,
    threadId: row.thread_id,
    userId: row.user_id ?? "",
    author: row.user_id ? displayNameById[row.user_id] ?? "不明" : "不明",
    body: row.content,
    createdAt: row.created_at,
  };
}
export async function getChatMessages(threadId: string): Promise<Message[]> {
    const { data, error } = await supabase
    .from("chat_messages")
    .select("id, thread_id, user_id, content, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
    if (error) {
      throw new Error(
        normalizeChatErrorMessage(error, "チャットメッセージの取得に失敗しました")
      );
    }
    const rows = (data ?? []) as ChatMessageRow[];
    const displayNameById = await buildDisplayNameById(
      rows
        .map((r) => r.user_id)
        .filter((id): id is string => Boolean(id))
    );

    return rows.map((r) => mapChatMessage(r, displayNameById));
}

type ChatThreadRow = {
  id: string;
  title: string;
  department_id: string;
  target_shift: "all" | "1" | "2" | "3";
  created_by: string | null;
  created_at: string;
};

function mapChatThread(row: ChatThreadRow): Thread {
  return {
    id: row.id,
    title: row.title,
    departmentId: row.department_id,
    departmentName: null, // 今はJOINしてない
    shift: row.target_shift,
    createdBy: "不明", // 呼び出し側で上書き
    createdAt: row.created_at,
    messageCount: 0,
  };
}

export async function getChatThreads(): Promise<Thread[]> {
  const { data, error } = await supabase
    .from("chat_threads")
    .select(`
      id,
      title,
      department_id,
      target_shift,
      created_by,
      created_at
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      normalizeChatErrorMessage(error, "チャットスレッドの取得に失敗しました")
    );
  }

  const rows = (data ?? []) as ChatThreadRow[];
  const displayNameById = await buildDisplayNameById(
    rows
      .map((r) => r.created_by)
      .filter((id): id is string => Boolean(id))
  );

  return rows.map((row) => {
    const thread = mapChatThread(row);
    return {
      ...thread,
      createdBy: row.created_by
        ? displayNameById[row.created_by] ?? "不明"
        : "不明",
    };
  });
}
export async function deleteChatThread(params: {
  threadId: string;
  role?: "admin" | "manager" | "member";
}): Promise<void> {
  if (params.role !== "admin") {
    throw new Error("削除権限がありません");
  }

  const { data, error } = await supabase
    .from("chat_threads")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", params.threadId)
    .is("deleted_at", null)
    .select("id");

  if (error) {
    throw new Error(
      normalizeChatErrorMessage(error, "チャットスレッドの削除に失敗しました")
    );
  }

  if (!data || data.length === 0) {
    throw new Error("削除対象のチャットが見つからないか、削除権限がありません");
  }
}

export async function sendChatMessage(params: {
    threadId: string;
    userId: string;
    content: string;
}): Promise<void> {
    const { error } = await supabase.from("chat_messages")
    .insert({
        thread_id: params.threadId,
        user_id: params.userId,
        content: params.content.trim(),
    });

    if (error) {
      throw new Error(
        normalizeChatErrorMessage(error, "チャットメッセージの送信に失敗しました")
      );
    }
}

export async function createChatThread(params: {
  title: string;
  departmentId: string;
  shift: "all" | "1" | "2" | "3";
  createdBy: string;
}): Promise<void> {
  const { error } = await supabase.from("chat_threads").insert({
    title: params.title.trim(),
    department_id: params.departmentId,
    target_shift: params.shift,
    created_by: params.createdBy,
  });

  if (error) {
    throw new Error(
      normalizeChatErrorMessage(error, "チャットスレッドの作成に失敗しました")
    );
  }
}