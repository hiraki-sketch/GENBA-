import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import type { Message, Shift, Thread, User } from "../../types";
import {
  deleteChatThread,
  getChatMessages,
  getChatThreads,
  sendChatMessage,
} from "../api/chatThreads";
import {
  CHAT_MESSAGE_MAX_LENGTH,
  getLiveValidationMessage,
  getSubmitValidationMessage,
} from "../lib/inputValidation";
import { toJapaneseErrorMessage } from "../lib/errorMessages";
import { queryKeys } from "../lib/queryKeys";

type UseChatThreadsManagementParams = {
  user: User;
  selectedShift: Shift;
};

export function useChatThreadsManagement({
  user,
  selectedShift,
}: UseChatThreadsManagementParams) {
  const queryClient = useQueryClient();
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const threadsQuery = useQuery<Thread[]>({
    queryKey: queryKeys.chatThreads.list(),
    queryFn: async () => {
      const data = await getChatThreads();
      // MVPでは全体チャットのみ表示
      return data.filter((thread) => thread.shift === "all");
    },
  });

  const messagesQuery = useQuery<Message[]>({
    queryKey: queryKeys.chatThreads.messages(selectedThread?.id ?? ""),
    enabled: Boolean(selectedThread?.id),
    queryFn: () => getChatMessages(selectedThread!.id),
  });

  const sendMessageMutation = useMutation({
    mutationFn: sendChatMessage,
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.chatThreads.messages(variables.threadId),
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.chatThreads.list() });
    },
  });

  const deleteThreadMutation = useMutation({
    mutationFn: deleteChatThread,
    onSuccess: async (_data, variables) => {
      setSelectedThread((current) =>
        current?.id === variables.threadId ? null : current
      );
      await queryClient.invalidateQueries({ queryKey: queryKeys.chatThreads.list() });
    },
  });

  const threads = useMemo(() => threadsQuery.data ?? [], [threadsQuery.data]);
  const threadMessages = useMemo(
    () => messagesQuery.data ?? [],
    [messagesQuery.data]
  );
  const isLoadingThreads = threadsQuery.isPending;
  const isLoadingMessages = messagesQuery.isPending || messagesQuery.isFetching;
  const isSendingMessage = sendMessageMutation.isPending;
  const isDeletingThread = deleteThreadMutation.isPending;
  const canDeleteThread = user.role === "admin";
  const errorMessage =
    (threadsQuery.error &&
      toJapaneseErrorMessage(threadsQuery.error, "チャットスレッドの取得に失敗しました。")) ||
    (messagesQuery.error &&
      toJapaneseErrorMessage(messagesQuery.error, "チャットメッセージの取得に失敗しました。")) ||
    (sendMessageMutation.error &&
      toJapaneseErrorMessage(sendMessageMutation.error, "チャットメッセージの送信に失敗しました。")) ||
    null;

  const messageError = getLiveValidationMessage(
    newMessage,
    "チャット本文",
    CHAT_MESSAGE_MAX_LENGTH
  );
  const messageSubmitError = getSubmitValidationMessage(
    newMessage,
    "チャット本文",
    CHAT_MESSAGE_MAX_LENGTH
  );
  const canSend = !messageSubmitError && !sendMessageMutation.isPending;

  const isSelectedShiftThreadOnly = useMemo(
    () => threads.some((t) => t.shift === selectedShift),
    [selectedShift, threads]
  );

  const handleSendMessage = useCallback(async () => {
    if (!canSend || !selectedThread) return;

    const content = newMessage.trim();
    if (!content || messageSubmitError) return;

    try {
      await sendMessageMutation.mutateAsync({
        threadId: selectedThread.id,
        userId: user.id,
        content,
      });
      setNewMessage("");
    } catch (error) {
      console.error("チャットメッセージ送信エラー:", error);
    }
  }, [canSend, messageSubmitError, newMessage, selectedThread, sendMessageMutation, user.id]);

  const handleDeleteThread = useCallback(
    async (
      threadId: string
    ): Promise<{ ok: true } | { ok: false; message: string }> => {
      if (!canDeleteThread) {
        return { ok: false, message: "削除権限がありません" };
      }

      try {
        await deleteThreadMutation.mutateAsync({
          threadId,
          role: user.role,
        });
        return { ok: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : "削除に失敗しました";
        return { ok: false, message };
      }
    },
    [canDeleteThread, deleteThreadMutation, user.role]
  );

  return {
    state: {
      selectedThread,
      newMessage,
      isLoadingThreads,
      isLoadingMessages,
      isSendingMessage,
      isDeletingThread,
      errorMessage,
    },
    data: {
      threads,
      threadMessages,
    },
    derived: {
      canSend,
      messageError,
      messageLength: newMessage.length,
      messageMaxLength: CHAT_MESSAGE_MAX_LENGTH,
      isSelectedShiftThreadOnly,
      canDeleteThread,
    },
    actions: {
      setSelectedThread,
      setNewMessage,
      handleSendMessage,
      handleDeleteThread,
    },
  };
}