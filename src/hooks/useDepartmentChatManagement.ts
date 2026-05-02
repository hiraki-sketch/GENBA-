import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import type { User } from "../../types";
import {
  deleteDepartmentAnnouncement,
  fetchDepartmentAnnouncements,
  insertDepartmentAnnouncement,
} from "../api/departmentAnnouncements";
import { queryKeys } from "../lib/queryKeys";

export function useDepartmentChatManagement(user: User) {
  const queryClient = useQueryClient();
  
  const listQueryKey = useMemo(
    () => queryKeys.departmentAnnouncements.list(user.id, user.departmentId),
    [user.id, user.departmentId]
  );

  const announcementsQuery = useQuery({
    queryKey: listQueryKey,
    enabled: Boolean(user.departmentId),
    queryFn: () => fetchDepartmentAnnouncements(user.departmentId),
  });

  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [isComposing, setIsComposing] = useState(false);

  const announcements = announcementsQuery.data ?? [];

  const createAnnouncementMutation = useMutation({
    mutationFn: insertDepartmentAnnouncement,
    onSuccess: async () => {
      setNewAnnouncement("");
      setIsComposing(false);
      await queryClient.invalidateQueries({ queryKey: listQueryKey });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.departmentAnnouncements.all,
      });
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (announcementId: string) =>
      deleteDepartmentAnnouncement({
        announcementId,
        userId: user.id,
        role: user.role,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: listQueryKey });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.departmentAnnouncements.all,
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.summary(user.id, user.departmentId),
      });
    },
  });

  const isSending = createAnnouncementMutation.isPending;

  const canSend = newAnnouncement.trim().length > 0 && Boolean(user.departmentId) && !isSending;

  const handleToggleCompose = useCallback(() => {
    setIsComposing((prev) => !prev);
  }, []);

  const handleCancelCompose = useCallback(() => {
    setIsComposing(false);
    setNewAnnouncement("");
  }, []);

  const handleSendAnnouncement = useCallback(async (): Promise<
    { ok: true } | { ok: false; message: string }
  > => {
    if (!canSend || !user.departmentId) {
      return { ok: false, message: "部署が未設定か、入力がありません" };
    }

    const body = newAnnouncement.trim();
    const title = body.length > 20 ? `${body.slice(0, 20)}...` : body;

    try {
      await createAnnouncementMutation.mutateAsync({
        userId: user.id,
        departmentId: user.departmentId,
        title,
        body,
      });

    return { ok: true };
    } catch (e) {
      const message = e instanceof Error ? e.message : "投稿に失敗しました";
      return { ok: false, message };
  }}, [
    canSend,
    createAnnouncementMutation,
    newAnnouncement,
    user.departmentId,
    user.id,
  ]);

  const canDeleteAnnouncement = useCallback(
    (announcement: { authorId: string | null }) =>
      announcement.authorId === user.id || user.role === "admin",
    [user.id, user.role]
  );

  const handleDeleteAnnouncement = useCallback(
    async (
      announcementId: string
    ): Promise<{ ok: true } | { ok: false; message: string }> => {
      try {
        await deleteAnnouncementMutation.mutateAsync(announcementId);
        return { ok: true };
      } catch (e) {
        const message = e instanceof Error ? e.message : "削除に失敗しました";
        return { ok: false, message };
      }
    },
    [deleteAnnouncementMutation]
  );
  return {
    state: {
      newAnnouncement,
      isComposing,
      isSending,
      isDeleting: deleteAnnouncementMutation.isPending,
    },
    data: {
      announcements,
    },
    derived: {
      canSend,
    },
    actions: {
      setNewAnnouncement,
      handleToggleCompose,
      handleCancelCompose,
      handleSendAnnouncement,
      handleDeleteAnnouncement,
    },
    utils: {
      canDeleteAnnouncement,
    },
    query: {
      isPending: announcementsQuery.isPending,
      isError: announcementsQuery.isError,
      error: announcementsQuery.error,
      refetch: announcementsQuery.refetch,
    },
  };
}
