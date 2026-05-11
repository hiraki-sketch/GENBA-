// app/profile.tsx
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { ProfileSettings } from "../components/ProfileSettings";
import { toJapaneseErrorMessage } from "../src/lib/errorMessages";
import { useRequireAuth } from "../src/hooks/useRequireAuth";

export default function Profile() {
  const router = useRouter();
  const { status, user } = useRequireAuth("/login", 1500);
  const isLoggingOutRef = useRef(false);

  const handleNavigate = useCallback(
    (page: string) => {
      const path = page === "index" ? "/" : `/${page}`;
      router.push(path as any);
    },
    [router]
  );

  const doLogout = useCallback(async (): Promise<boolean> => {
    if (isLoggingOutRef.current) return false; // ✅ 多重タップ防止

    isLoggingOutRef.current = true;
    try {
      // ✅ セッション確認（無いならログインへ）
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        return true;
      }

      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert("エラー", toJapaneseErrorMessage(error, "ログアウトに失敗しました。"));
        return false;
      }

      return true;
    } catch (e) {
      console.error("ログアウト時の通信エラー:", e);
      Alert.alert("通信エラー", "ネットワーク接続を確認して、もう一度お試しください。");
      return false;
    } finally {
      isLoggingOutRef.current = false;
    }
  }, []);

  const handleLogout = useCallback((): Promise<boolean> => {
    if (isLoggingOutRef.current) return Promise.resolve(false);

    return new Promise<boolean>((resolve) => {
      Alert.alert("ログアウト", "ログアウトしますか？", [
        { text: "キャンセル", style: "cancel", onPress: () => resolve(false) },
        {
          text: "ログアウト",
          style: "destructive",
          onPress: async () => resolve(await doLogout()),
        },
      ]);
    });
  }, [doLogout]);

  // user オブジェクトをメモ化して、参照の変更を防ぐ（Hooksは早期リターンの前に呼ぶ必要がある）
  const memoizedUser = useMemo(
    () => {
      if (!user) return null;
      return {
        id: user.id,
        displayName: user.displayName ?? "未設定ユーザー",
        departmentId: user.departmentId ?? "",
        departmentName: user.departmentName ?? user.department ?? "未設定部署",
        department: user.department ?? "未設定部署",
        email: user.email ?? "",
        role: user.role,
      };
    },
    [user]
  );

  // セッション確認中
  if (status === "checking") {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 未ログイン時（useRequireAuth が /login にリダイレクトする）
  if (status === "unauthenticated" || !user || !memoizedUser) {
    return null;
  }

  return (
    <ProfileSettings
      user={memoizedUser}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    />
  );
}
