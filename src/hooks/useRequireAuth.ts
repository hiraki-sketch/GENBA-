// src/hooks/useRequireAuth.ts
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { useEffect } from "react";
type AuthStatus = "checking" | "unauthenticated" | "authenticated";

/**
 * 認証必須画面用のカスタムフック
 * - セッション確認中: status = "checking"
 * - 未ログイン:       status = "unauthenticated"（＋一定時間後にリダイレクト）
 * - ログイン済み:     status = "authenticated"
 */
export const useRequireAuth = (
  redirectTo: string = "/login",
  delayMs: number = 200
) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  // 認証状態を判定
  const isAuthenticated =!!user 

  const status: AuthStatus = loading
    ? "checking"
    : isAuthenticated
    ? "authenticated"
    : "unauthenticated";

  // 未ログインのときだけ一定時間後にリダイレクト
  useEffect(() => {
    if (status !== "unauthenticated") return;

    const timer = setTimeout(() => {
      router.replace(redirectTo);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [status, router, redirectTo, delayMs]);

  return { status, user };
};
