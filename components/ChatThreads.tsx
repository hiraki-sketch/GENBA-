import { Trash2 } from 'lucide-react-native';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Shift, User } from '../types';

import { useChatThreadsManagement } from "../src/hooks/useChatThreadsManagement";
import { ResponsiveGrid } from "./layout/ResponsiveGrid";
import { AppHeader } from './ui/app-header';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Clock, MessageCircle } from './ui/icons';
import { Input } from './ui/input';
interface ChatThreadsProps {
  user: User;
  selectedShift: Shift;
  onNavigate: (page: string) => void;
}

export function ChatThreads({ user, selectedShift, onNavigate }: ChatThreadsProps) {
  const { state, data, derived, actions } = useChatThreadsManagement({
    user,
    selectedShift,
  });
  const { selectedThread, newMessage, isSendingMessage, isDeletingThread, errorMessage } = state;
  const { threads, threadMessages } = data;
  const { canSend, messageError, messageLength, messageMaxLength, canDeleteThread } = derived;
  const { setSelectedThread, setNewMessage, handleSendMessage, handleDeleteThread } = actions;

  if (selectedThread) {
    return (
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          className="flex-1 bg-background"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={80}
        >
          <AppHeader
            title={selectedThread.title}
            subtitle={`${selectedThread.departmentName ?? user.department} - ${selectedShift}勤`}
            onBack={() => setSelectedThread(null)}
          />

          {/* メッセージ一覧 */}
          <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
            <View className="space-y-4">
              {threadMessages.map((message) => (
                <View key={message.id} className="flex-row space-x-3">
                  <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center">
                    <Text className="text-white text-sm font-medium">
                      {message.author.charAt(0)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center space-x-2">
                      <Text className="text-sm font-medium text-foreground">{message.author}</Text>
                      <Text className="text-xs text-muted-foreground">
                        {new Date(message.createdAt).toLocaleTimeString('ja-JP')}
                      </Text>
                    </View>
                    <View className="mt-1 bg-card rounded-lg p-3 border">
                      <Text className="text-sm text-foreground">{message.body}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* メッセージ入力 */}
          <View className="bg-card border-t border-border p-4">
            {errorMessage && (
              <Text className="text-sm text-destructive mb-2">{errorMessage}</Text>
            )}
            <View className="flex-row items-end gap-3">
              <View className="flex-1">
                <Input
                  value={newMessage}
                  onChangeText={setNewMessage}
                  placeholder="メッセージを入力..."
                  className="flex-1 min-h-[44px] max-h-32 rounded-xl px-4 py-3"
                  multiline
                  textAlignVertical="top"
                />
                <View className="mt-1 flex-row items-center justify-between">
                  <Text className={`text-xs ${messageError ? "text-destructive" : "text-muted-foreground"}`}>
                    {messageError ?? " "}
                  </Text>
                  <Text className={`text-xs ${messageLength > messageMaxLength ? "text-destructive" : "text-muted-foreground"}`}>
                    {messageLength} / {messageMaxLength}
                  </Text>
                </View>
              </View>
              <Button
                variant={canSend ? "default" : "secondary"}
                onPress={handleSendMessage}
                disabled={!canSend}
                className="shrink-0 self-end rounded-xl px-4"
              >
                {isSendingMessage ? "送信中..." : "送信"}
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="flex-1 bg-background">
      <AppHeader
        title="チャットスレッド"
        subtitle={`${user.department} - ${selectedShift}勤`}
        onBack={() => onNavigate('index')}
        rightSlot={
          <Button onPress={() => onNavigate('create-chat')} className="px-4 py-2 rounded-xl">
            新規作成
          </Button>
        }
      />

      {/* スレッド一覧 */}
      <View className="p-5">
        <ResponsiveGrid maxCols={{ sm:1, md:2, lg:2, xl:2, "2xl":2 }}>
          {threads.map((thread) => (
            <View
              key={thread.id}
              className="bg-card/80 rounded-2xl border border-border p-4"
            >
            <TouchableOpacity
              onPress={() => setSelectedThread(thread)}
            >
              <View className="flex-row items-start space-x-3">
                <View className="w-10 h-10 bg-blue-100 rounded-lg items-center justify-center">
                  <MessageCircle size={24} color="#2563EB" />
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-foreground text-base">{thread.title}</Text>
                  <View className="flex-row items-center space-x-2 mt-1">
                    {thread.shift && <Badge variant="secondary">{thread.shift}</Badge>}
                    <Text className="text-sm text-muted-foreground">{thread.departmentName ?? user.department}</Text>
                  </View>
                  <View className="flex-row items-center space-x-4 mt-2">
                    <View className="flex-row items-center space-x-1">
                      <View className="flex-row items-center space-x-1">
                        <MessageCircle size={12} color="#6B7280" />
                        <Text className="text-xs text-muted-foreground">{thread.messageCount} メッセージ</Text>
                      </View>
                    </View>
                    <View className="flex-row items-center space-x-1">
                      <View className="flex-row items-center space-x-1">
                        <Clock size={12} color="#6B7280" />
                        <Text className="text-xs text-muted-foreground">{new Date(thread.createdAt).toLocaleDateString('ja-JP')}</Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View>
                  <Text className="text-sm text-muted-foreground">{thread.createdBy}</Text>
                </View>
              </View>
            </TouchableOpacity>
              {canDeleteThread && (
                <View className="mt-3">
                  <Button
                    variant="outline"
                    disabled={isDeletingThread}
                    onPress={() => {
                      Alert.alert("チャットの削除", "このチャットを削除します。よろしいですか？", [
                        { text: "キャンセル", style: "cancel" },
                        {
                          text: "削除",
                          style: "destructive",
                          onPress: async () => {
                            const res = await handleDeleteThread(thread.id);
                            if (!res.ok) {
                              Alert.alert("削除に失敗しました", res.message);
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
          ))}
        </ResponsiveGrid>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}
