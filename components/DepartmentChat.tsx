import { Bell, Clock, Pin, Send, Trash2, User as UserIcon } from 'lucide-react-native';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDepartmentChatManagement } from "../src/hooks/useDepartmentChatManagement";
import { toJapaneseErrorMessage } from "../src/lib/errorMessages";
import { useShiftStore } from "../src/stores/useShiftStore";
import { User } from '../types';
import { ResponsiveGrid } from "./layout/ResponsiveGrid";
import { AppHeader } from './ui/app-header';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
interface DepartmentChatProps {
  user: User;
  onNavigate: (page: string) => void;
}

export function DepartmentChat({ user, onNavigate }: DepartmentChatProps) {
  const currentShift = useShiftStore((state) => state.selectedShift);
  const { state, data, derived, utils, actions, query } = useDepartmentChatManagement(user);
  const { isPending, isError, error, refetch } = query;
  const { newAnnouncement, isComposing, isSending, isDeleting } = state;
  const { announcements } = data;
  const { canSend } = derived;
  const { canDeleteAnnouncement } = utils;
  const {
    setNewAnnouncement,
    handleToggleCompose,
    handleCancelCompose,
    handleSendAnnouncement,
    handleDeleteAnnouncement,
  } = actions;

  return (
    <SafeAreaView className="flex-1">
    <View className="flex-1 bg-background">
      <AppHeader
        title="部署連絡"
        subtitle={`${user.department} - ${currentShift}勤`}
        onBack={() => onNavigate('index')}
        rightSlot={
          <Button variant="ghost" onPress={handleToggleCompose} className="p-2 rounded-xl">
            <Bell size={22} color="#64748b" />
          </Button>
        }
      />

      <ScrollView className="flex-1 p-5">
        {!user.departmentId && (
          <Text className="py-8 text-center text-muted-foreground">
            プロフィールに部署が設定されていないため、連絡の取得・投稿ができません。
          </Text>
        )}
        {user.departmentId && isPending && announcements.length === 0 && (
          <ActivityIndicator className="py-8" />
        )}
        {isError && (
          <View className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
            <Text className="text-destructive">
              {toJapaneseErrorMessage(error, "読み込みに失敗しました。")}
            </Text>
            <Pressable onPress={() => refetch()} className="mt-2 self-start">
              <Text className="font-medium text-primary">再試行</Text>
            </Pressable>
          </View>
        )}
        {user.departmentId && !isPending && !isError && announcements.length === 0 && (
          <Text className="py-8 text-center text-muted-foreground">部署連絡はまだありません</Text>
        )}
        {user.departmentId && announcements.length > 0 && (
        <ResponsiveGrid maxCols={{ sm:1, md:2, lg:2, xl:2, "2xl":2 }}>
          {announcements.map((announcement) => (
            <Card key={announcement.id}>
              <View className="p-4">
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-lg font-semibold text-foreground">{announcement.title}</Text>
                      {announcement.pinned && (
                        <View className="flex-row items-center gap-1">
                          <Pin size={14} color="#ef4444" />
                          <Badge variant="outline" className="bg-transparent border border-red-500">
                            <Text className="text-xs text-red-500">ピン留め</Text>
                          </Badge>
                        </View>
                      )}
                    </View>
                    <Text className="text-sm text-muted-foreground mb-2">{announcement.body}</Text>
                  </View>
                </View>
                
                <View className="flex-row items-center mt-2">
                  <View className="flex-1 flex-row items-center min-w-0 mr-3">
                    <UserIcon size={14} color="#64748b" />
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      className="text-xs text-muted-foreground ml-1 flex-1"
                    >
                      {announcement.authorName ?? "不明"}
                    </Text>
                  </View>

                  <View className="flex-row items-center shrink-0">
                    <Clock size={14} color="#64748b" />
                    <Text className="text-xs text-muted-foreground ml-1">
                      {announcement.createdAt}
                    </Text>
                  </View>
                </View>
                {canDeleteAnnouncement(announcement) && (
                  <View className="mt-3">
                    <Button
                      variant="outline"
                      disabled={isDeleting}
                      onPress={() => {
                        Alert.alert("部署連絡の削除", "この連絡を削除します。よろしいですか？", [
                          { text: "キャンセル", style: "cancel" },
                          {
                            text: "削除",
                            style: "destructive",
                            onPress: async () => {
                              const res = await handleDeleteAnnouncement(announcement.id);
                              if (!res.ok) {
                                Alert.alert("削除エラー", res.message);
                              }
                            },
                          },
                        ]);
                      }}
                      className="border-destructive self-start"
                    >
                      <Trash2 size={16} color="#dc2626" />
                      <Text className="ml-2 text-destructive">削除</Text>
                    </Button>
                  </View>
                )}
              </View>
            </Card>
          ))}
        </ResponsiveGrid>
        )}
      </ScrollView>

      {/* 新規投稿フォーム */}
      {isComposing && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={80}
        >
          <View className="bg-card border-t border-border p-4">
            <View className="gap-3">
              <Input
                value={newAnnouncement}
                onChangeText={setNewAnnouncement}
                placeholder="部署連絡を入力してください..."
                multiline
                className="bg-muted rounded-xl p-3 min-h-[80px]"
              />
              <View className="flex-row gap-3">
                <Button
                  variant="outline"
                  onPress={handleCancelCompose}
                  className="flex-1"
                >
                  <Text>キャンセル</Text>
                </Button>
                <Button
                  onPress={async () => {
                    const r = await handleSendAnnouncement();
                    if (!r.ok) Alert.alert("投稿エラー", r.message);
                  }}
                  disabled={!canSend || isSending}
                  className="flex-1"
                >
                  <Send size={16} color="white" />
                  <Text className="text-black ml-2">{isSending ? "送信中…" : "送信"}</Text>
                </Button>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
    </SafeAreaView>
  );
}
