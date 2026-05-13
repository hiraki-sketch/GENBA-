import { useCallback } from 'react';
import { Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useCreateChatThreadManagement } from "../src/hooks/useCreateChatThreadManagement";
import { User } from '../types';
import { AppHeader } from "./ui/app-header";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
interface CreateChatThreadProps {
  user: User;
  onNavigate: (page: string) => void;
}

export function CreateChatThread({ user, onNavigate }: CreateChatThreadProps) {
  const { state, data, derived, utils, actions } = useCreateChatThreadManagement(user);
  const {
    title,
    description,
    selectedShift,
    isPublic,
    isSubmitting,
  } = state;
  const { templates } = data;
  const { canSubmit } = derived;
  const { getShiftText, getShiftColor } = utils;
  const {
    setTitle,
    setDescription,
    setIsPublic,
    applyTemplate,
    handleCancel,
    handleSubmit,
  } = actions;

  const goBackToChatThreads = useCallback(() => {
    onNavigate('chat-threads');
  }, [onNavigate]);

  const handleBackOrCancel = useCallback(() => {
    const res = handleCancel();
    if (!res.ok) {
      Alert.alert(res.title, res.message, [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '破棄して戻る',
          style: 'destructive',
          onPress: goBackToChatThreads,
        },
      ]);
      return;
    }
    goBackToChatThreads();
  }, [goBackToChatThreads, handleCancel]);

  return (
    <SafeAreaView className="flex-1">
    <ScrollView className="flex-1 bg-background">
      <AppHeader
        title="新しいチャット作成"
        subtitle={user.department}
        onBack={handleBackOrCancel}
      />

      <View className="p-5">
        <View className="space-y-6">
          {/* メインフォーム */}
          <View className="space-y-6">
            <Card>
              <View className="mb-4">
                <Text className="text-lg font-semibold flex-row items-center">
                  <Text className="mr-2">💬</Text>
                  <Text>チャット詳細</Text>
                </Text>
              </View>
              <View className="space-y-4">
                <View className="space-y-2">
                  <Label>チャットタイトル *</Label>
                  <Input
                    value={title}
                    onChangeText={setTitle}
                    placeholder="例：1勤 日次引き継ぎ"
                    className="rounded-xl px-4 py-3"
                  />
                </View>

                <View className="space-y-2">
                  <Label>説明</Label>
                  <Input
                    value={description}
                    onChangeText={setDescription}
                    placeholder="このチャットの目的や使用方法を説明してください"
                    multiline
                    numberOfLines={3}
                    className="rounded-xl px-4 py-3"
                  />
                </View>

                <View className="space-y-2">
                  <Text className="text-sm font-medium text-foreground">対象勤務帯</Text>
                  <View className="px-3 py-2 rounded-xl border border-primary bg-primary">
                    <Text className="text-sm text-white">全勤務帯</Text>
                  </View>
                </View>

                <View className="space-y-3">
                  <Text className="text-sm font-medium text-foreground">チャット設定</Text>
                  
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-foreground">部署全体に公開する</Text>
                    <Switch
                      value={isPublic}
                      onValueChange={setIsPublic}
                    />
                  </View>

                </View>
              </View>
            </Card>

            <View className="flex-row space-x-4">
              <Button
                onPress={handleBackOrCancel}
                variant="outline"
                className="flex-1"
              >
                キャンセル
              </Button>
              <Button
                onPress={async () => {
                  const res = await handleSubmit();
                  Alert.alert(res.title, res.message);
                  if (res.ok) onNavigate("chat-threads");
                }}
                disabled={isSubmitting || !canSubmit}
                className="flex-1"
              >
                {isSubmitting ? '作成中...' : 'チャットを作成'}
              </Button>
            </View>
          </View>

          {/* サイドバー */}
          <View className="space-y-6">
            {/* プレビュー */}
            <Card>
              <View className="mb-4">
                <Text className="text-base font-semibold">プレビュー</Text>
              </View>
              <View className="p-3 border rounded-lg bg-muted">
                <View className="flex-row items-center space-x-3">
                  <View className="w-10 h-10 bg-blue-100 rounded-lg items-center justify-center">
                    <Text className="text-2xl">💬</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-foreground text-base">
                      {title || 'チャットタイトル'}
                    </Text>
                    <View className="flex-row items-center space-x-2 mt-1">
                      <Badge className={getShiftColor(selectedShift)}>
                        {getShiftText(selectedShift)}
                      </Badge>
                      <Text className="text-sm text-muted-foreground">{user.department}</Text>
                    </View>
                    {description && (
                      <Text className="text-sm text-muted-foreground mt-1" numberOfLines={2}>
                        {description}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </Card>

            {/* テンプレート */}
            <Card>
              <View className="mb-4">
                <Text className="text-base font-semibold">テンプレート</Text>
              </View>
              <View className="space-y-2">
                {templates.map((template, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => applyTemplate(template)}
                    className="w-full border border-border rounded-xl p-3 bg-transparent"
                  >
                    <View className="text-left">
                      <Text className="font-medium text-sm text-foreground">
                        {template.title.replace('{shift}', getShiftText(template.shift))}
                      </Text>
                      <Text className="text-xs text-muted-foreground mt-1">
                        {template.description.substring(0, 40)}...
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            {/* ヘルプ */}
            <View className="bg-muted rounded-2xl p-4">
              <View className="flex-row items-start space-x-2">
                <Text className="text-2xl">ℹ️</Text>
                <View className="flex-1 space-y-2">
                  <Text className="text-sm text-foreground">
                    <Text className="font-bold">公開設定:</Text> 部署全体に公開すると、すべてのメンバーが参加できます。
                  </Text>
                  <Text className="text-sm text-foreground">
                    <Text className="font-bold">:</Text> 
                  </Text>
                  <Text className="text-sm text-foreground">
                    <Text className="font-bold"></Text> 。
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}
