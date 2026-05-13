import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import type { Shift, User } from "../../types";
import { createChatThread } from "../api/chatThreads";
import { toJapaneseErrorMessage } from "../lib/errorMessages";
import { queryKeys } from "../lib/queryKeys";

type ShiftOrAll = Shift | "all";
type ActionResult = { ok: boolean; title: string; message: string };

export function useCreateChatThreadManagement(user: User) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const selectedShift: ShiftOrAll = "all";
  const [isPublic, setIsPublic] = useState(true);
  const createThreadMutation = useMutation({
    mutationFn: createChatThread,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.chatThreads.list() });
    },
  });

  const shifts = useMemo<ShiftOrAll[]>(() => ["all"], []);

  const templates = useMemo(
    () => [
      {
        title: "日次引き継ぎ - {shift}",
        description: "勤務帯の引き継ぎ事項や注意事項を共有するためのチャットです。",
        shift: "all" as ShiftOrAll,
      },
      {
        title: "設備点検連絡",
        description: "設備の点検状況や異常の報告・対応を行うためのチャットです。",
        shift: "all" as ShiftOrAll,
      },
      {
        title: "品質管理情報",
        description: "品質チェックの結果や改善提案を共有するためのチャットです。",
        shift: "all" as ShiftOrAll,
      },
      {
        title: "安全管理連絡",
        description: "安全に関する情報共有や報告を行うためのチャットです。",
        shift: "all" as ShiftOrAll,
      },
    ],
    []
  );

  const canSubmit = title.trim().length > 0;

  const getShiftText = useCallback((shift: ShiftOrAll) => {
    switch (shift) {
      case "all":
        return "全勤務帯";
      case "1":
        return "1勤";
      case "2":
        return "2勤";
      case "3":
        return "3勤";
      default:
        return "不明";
    }
  }, []);

  const getShiftColor = useCallback((shift: ShiftOrAll) => {
    switch (shift) {
      case "all":
        return "bg-gray-100";
      case "1":
        return "bg-blue-100";
      case "2":
        return "bg-green-100";
      case "3":
        return "bg-purple-100";
      default:
        return "bg-gray-100";
    }
  }, []);

  const applyTemplate = useCallback(
    (template: (typeof templates)[number]) => {
      const shiftText =
        template.shift === "all" ? "全勤務帯" : template.shift;
      setTitle(template.title.replace("{shift}", shiftText));
      setDescription(template.description);
    },
    []
  );

  const handleCancel = useCallback((): ActionResult => {
    if (title.trim() || description.trim()) {
      return {
        ok: false,
        title: "確認",
        message: "入力内容が破棄されますが、よろしいですか？",
      };
    }
    return { ok: true, title: "", message: "" };
  }, [description, title]);

  const handleSubmit = useCallback(async (): Promise<ActionResult> => {
    if (!title.trim()) {
      return {
        ok: false,
        title: "入力エラー",
        message: "チャットタイトルを入力してください",
      };
    }

    if (!user.departmentId) {
      return {
        ok: false,
        title: "作成できません",
        message: "プロフィールに部署が設定されていません",
      };
    }

    try {
      await createThreadMutation.mutateAsync({
        title: title.trim(),
        departmentId: user.departmentId,
        shift: selectedShift,
        createdBy: user.id,
      });

      console.log("新しいチャットスレッド:", {
        title: title.trim(),
        departmentId: user.departmentId,
        departmentName: user.departmentName ?? user.department,
        shift: selectedShift,
        createdBy: user.displayName,
        description,
        isPublic,
      });
      
      return {
        ok: true,
        title: "作成完了",
        message: "チャットスレッドを作成しました",
      };
    } catch (error) {
      const message = toJapaneseErrorMessage(error, "チャットスレッドの作成に失敗しました。");
      return {
        ok: false,
        title: "作成失敗",
        message,
      };
    }
  }, [
    description,
    isPublic,
    selectedShift,
    title,
    user.department,
    user.departmentId,
    user.departmentName,
    user.displayName,
    user.id,
    createThreadMutation,
  ]);

  return {
    state: {
      title,
      description,
      selectedShift,
      isPublic,
      isSubmitting: createThreadMutation.isPending,
    },
    data: {
      shifts,
      templates,
    },
    derived: {
      canSubmit,
    },
    utils: {
      getShiftText,
      getShiftColor,
    },
    actions: {
      setTitle,
      setDescription,
      setIsPublic,
      applyTemplate,
      handleCancel,
      handleSubmit,
    },
  };
}

