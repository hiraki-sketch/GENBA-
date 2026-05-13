import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useCallback, useState } from "react";
import type { User } from "../../types";

type ActionResult = { ok: boolean; title: string; message: string };

type UseProfileSettingsManagementParams = {
  user: User;
  onLogout: () => Promise<boolean>;
};

export function useProfileSettingsManagement({
  user,
  onLogout,
}: UseProfileSettingsManagementParams) {
  const { refreshUser } = useAuth();

  const [loadingLogout, setLoadingLogout] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [email, setEmail] = useState(user.email || "");
  const [department, setDepartment] = useState(user.department || "");

  const getRoleText = useCallback((role: string) => {
    switch (role) {
      case "admin":
        return "管理者";
      case "manager":
        return "リーダー";
      case "member":
      case "user":
        return "一般ユーザー";
      default:
        return "不明";
    }
  }, []);

  const getRoleColor = useCallback((role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500";
      case "manager":
        return "bg-blue-500";
      case "member":
      case "user":
        return "bg-gray-500";
      default:
        return "bg-gray-300";
    }
  }, []);

  const handleSaveProfile = useCallback(async (): Promise<ActionResult> => {
    if (!displayName || !department) {
      return { ok: false, title: "エラー", message: "表示名と部署は必須です。" };
    }

    setLoadingSave(true);
    try {
      let departmentId: string | null = null;
      const { data: departmentData, error: departmentError } = await supabase
        .from("departments")
        .select("id")
        .eq("name", department)
        .maybeSingle();
      if (departmentError) {
        console.error("部署IDの取得エラー:", departmentError);
        return {
          ok: false,
          title: "エラー",
          message: "部署情報の取得に失敗しました。",
        };
      }
      departmentId = departmentData?.id ?? null;
      if (!departmentId) {
        return {
          ok: false,
          title: "エラー",
          message: "指定された部署が見つかりません。",
        };
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          department_id: departmentId,
          // email は認証側で管理されるため、ここでは更新しない
        })
        .eq("id", user.id);

      if (error) {
        console.error("プロフィール更新エラー:", error);
        return {
          ok: false,
          title: "エラー",
          message: "プロフィールの更新に失敗しました。",
        };
      }

      await refreshUser();
      return { ok: true, title: "成功", message: "プロフィールを更新しました。" };
    } catch (e) {
      console.error("プロフィール更新エラー:", e);
      return {
        ok: false,
        title: "エラー",
        message: "予期しないエラーが発生しました。",
      };
    } finally {
      setLoadingSave(false);
    }
  }, [department, displayName, refreshUser, user.id]);

  const handleLogoutInternal = useCallback(async (): Promise<ActionResult> => {
    setLoadingLogout(true);
    try {
      const loggedOut = await onLogout();
      if (loggedOut) {
        return { ok: true, title: "ログアウト", message: "ログアウトしました。" };
      }
      return { ok: false, title: "キャンセル", message: "ログアウトをキャンセルしました。" };
    } catch {
      return {
        ok: false,
        title: "エラー",
        message: "ログアウトに失敗しました。もう一度お試しください",
      };
    } finally {
      setLoadingLogout(false);
    }
  }, [onLogout]);

  return {
    state: {
      loadingLogout,
      loadingSave,
      displayName,
      email,
      department,
    },
    utils: {
      getRoleText,
      getRoleColor,
    },
    actions: {
      setDisplayName,
      setEmail,
      setDepartment,
      handleSaveProfile,
      handleLogoutInternal,
    },
  };
}

