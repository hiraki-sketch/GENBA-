//app/login.tsx
import { Redirect, useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { LoginScreen } from "../components/LoginScreen";

export default function LoginPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    if (loading) return null;
    if (user) {
        return <Redirect href="/" />;
    }
    //未ログイン時
    return <LoginScreen onPressLogin={() => router.push("/home")} />;
}
