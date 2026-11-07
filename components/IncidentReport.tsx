import { Image } from "expo-image";
import { ImagePlus, Trash2, X } from "lucide-react-native";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIncidentReportManagement } from "../src/hooks/useIncidentReportManagement";
import { toJapaneseErrorMessage } from "../src/lib/errorMessages";
import { Shift, User } from "../types";
import { AppHeader } from "./ui/app-header";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ImageView } from "./ui/ImageView";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface IncidentReportProps {
  user: User;
  selectedShift: Shift;
  onNavigate: (page: string) => void;
}

export function IncidentReport({ user, selectedShift, onNavigate }: IncidentReportProps) {
  const titleInputRef = useRef<TextInput>(null);
  const bodyInputRef = useRef<TextInput>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const { state, data, derived, utils, actions, query } = useIncidentReportManagement(
    user,
    selectedShift
  );

  const { isPending, isDeleting, isError, error, refetch } = query;
  const { title, body, severity, shift, isSubmitting, showExistingReports, photoUris } = state;
  const { existingReports } = data;
  const {
    canSubmit,
    titleError,
    bodyError,
    titleLength,
    bodyLength,
    titleMaxLength,
    bodyMaxLength,
  } = derived;
  const { getSeverityColor, getSeverityText, canDeleteReport } = utils;
  const {
    setTitle,
    setBody,
    setSeverity,
    setShift,
    setShowExistingReports,
    handleSubmit,
    handlePickPhoto,
    removePhoto,
    handleDeleteReport,
  } = actions;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <AppHeader
        title="異常報告"
        subtitle={`${user?.department ?? "—"} ・ ${selectedShift}勤`}
        onBack={() => onNavigate("index")}
        variant="emerald"
        rightSlot={
          <Button
            variant="outline"
            onPress={() => setShowExistingReports(!showExistingReports)}
            className="border-white bg-transparent"
          >
            <Text className="text-white">{showExistingReports ? "新規作成" : "既存報告"}</Text>
          </Button>
        }
      />

      {/* Body */}
      <View className="flex-1">
        <ScrollView
          className="flex-1 bg-background"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 16,
            paddingTop: 24,
            paddingBottom: showExistingReports ? 24 : 120,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {showExistingReports ? (
            <View className="gap-4">
              <Text className="text-lg font-semibold mb-2">既存の異常報告</Text>

              {!user.departmentId && (
                <Text className="text-muted-foreground">
                  プロフィールに部署が設定されていないため、一覧を取得できません。
                </Text>
              )}

              {user.departmentId && isPending && <ActivityIndicator className="py-6" />}

              {user.departmentId && isError && (
                <View className="py-4">
                  <Text className="text-destructive">
                    {toJapaneseErrorMessage(error, "読み込みに失敗しました。")}
                  </Text>
                  <Pressable onPress={() => refetch()} className="mt-2 self-start">
                    <Text className="text-primary font-medium">再試行</Text>
                  </Pressable>
                </View>
              )}

              {user.departmentId && !isPending && !isError && (
                <>
                  {existingReports.length === 0 ? (
                    <Text className="text-muted-foreground py-4">
                      異常報告はまだありません
                    </Text>
                  ) : (
                    existingReports.map((report) => (
                      <Card key={report.id} className="min-w-0 overflow-hidden">
                        <View className="p-4 min-w-0">
                          <View className="pb-3 min-w-0">
                            <Text className="text-lg font-semibold" selectable>
                              {report.title}
                            </Text>
                            <View className="flex-row flex-wrap items-center gap-2 mt-2">
                              <View className={`w-3 h-3 rounded-full shrink-0 ${getSeverityColor(report.severity)}`} />
                              <Badge variant="outline">{getSeverityText(report.severity)}</Badge>
                              <Badge variant="secondary">{report.shift}</Badge>
                            </View>
                          </View>

                          <View className="min-w-0">
                            <Text className="text-foreground mb-3" selectable>
                              {report.body}
                            </Text>
                            {!!report.attachmentUrls?.length && (
                              <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                className="mb-3"
                                contentContainerStyle={{ gap: 8 }}
                              >
                                {report.attachmentUrls.map((url) => (
                                  <Pressable key={url} onPress={() => setPreviewUri(url)}>
                                    <Image
                                      source={{ uri: url }}
                                      style={{ width: 96, height: 96, borderRadius: 8 }}
                                      contentFit="cover"
                                    />
                                  </Pressable>
                                ))}
                              </ScrollView>
                            )}
                            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                              投稿者: {report.reporterName ?? "不明"}
                            </Text>
                            <Text className="text-xs text-muted-foreground" numberOfLines={2}>
                              作成: {new Date(report.createdAt).toLocaleString("ja-JP")}
                            </Text>
                            <Text className="text-xs text-muted-foreground" numberOfLines={2}>
                              更新: {new Date(report.updatedAt).toLocaleString("ja-JP")}
                            </Text>
                            {canDeleteReport(report) && (
                              <View className="mt-3">
                                <Button
                                  variant="outline"
                                  disabled={isDeleting}
                                  onPress={() => {
                                    Alert.alert("異常報告の削除", "この報告を削除します。よろしいですか？", [
                                      { text: "キャンセル", style: "cancel" },
                                      {
                                        text: "削除",
                                        style: "destructive",
                                        onPress: async () => {
                                          const res = await handleDeleteReport(report.id);
                                          Alert.alert(res.title, res.message);
                                        },
                                      },
                                    ]);
                                  }}
                                  className="border-destructive"
                                >
                                  <Trash2 size={16} color="#dc2626" />
                                  <Text className="ml-2 text-destructive">削除</Text>
                                </Button>
                              </View>
                            )}
                          </View>
                        </View>
                      </Card>
                    ))
                  )}
                </>
              )}
            </View>
          ) : (
            <View className="gap-6 flex-1 min-w-0">
              <Card className="min-w-0 overflow-hidden">
                <View className="p-4 min-w-0">
                  <View className="mb-4 min-w-0">
                    <Text className="text-xl font-semibold">新しい異常報告</Text>
                  </View>

                  <View className="gap-4 min-w-0">
                  <View className="min-w-0">
                    <Label>タイトル *</Label>
                    <Input
                      ref={titleInputRef}
                      value={title}
                      onChangeText={setTitle}
                      placeholder="異常の概要を入力"
                      className="w-full min-w-0"
                    />
                    <View className="mt-1 flex-row items-center justify-between">
                      <Text className={`text-xs ${titleError ? "text-destructive" : "text-muted-foreground"}`}>
                        {titleError ?? " "}
                      </Text>
                      <Text className={`text-xs ${titleLength > titleMaxLength ? "text-destructive" : "text-muted-foreground"}`}>
                        {titleLength} / {titleMaxLength}
                      </Text>
                    </View>
                  </View>

                  <View className="min-w-0">
                    <Label>本文 *</Label>
                    <Input
                      ref={bodyInputRef}
                      value={body}
                      onChangeText={setBody}
                      placeholder="詳細を記入してください"
                      multiline
                      numberOfLines={6}
                      className="w-full min-w-0 min-h-[120px] align-top"
                      textAlignVertical="top"
                    />
                    <View className="mt-1 flex-row items-center justify-between">
                      <Text className={`text-xs ${bodyError ? "text-destructive" : "text-muted-foreground"}`}>
                        {bodyError ?? " "}
                      </Text>
                      <Text className={`text-xs ${bodyLength > bodyMaxLength ? "text-destructive" : "text-muted-foreground"}`}>
                        {bodyLength} / {bodyMaxLength}
                      </Text>
                    </View>
                  </View>

                  <View className="min-w-0">
                    <Label>写真添付（任意・最大3枚）</Label>
                    <View className="mt-2">
                      <Button
                        variant="outline"
                        onPress={async () => {
                          // キーボード／フォーカスが残ったままピッカーを開くと固まる端末があるため、
                          // 先に入力からフォーカスを外してからネイティブ UI を起動する
                          titleInputRef.current?.blur();
                          bodyInputRef.current?.blur();
                          Keyboard.dismiss();
                          await new Promise<void>((resolve) => {
                            requestAnimationFrame(() => {
                              requestAnimationFrame(() => resolve());
                            });
                          });
                          const res = await handlePickPhoto();
                          if (!res.ok) {
                            Alert.alert(res.title, res.message);
                          }
                        }}
                        className="flex-row items-center justify-center"
                        disabled={photoUris.length >= 3}
                      >
                        <ImagePlus size={16} color="#0f172a" />
                        <Text className="ml-2">
                          {photoUris.length >= 3 ? "3枚選択済み" : "写真を選択"}
                        </Text>
                      </Button>
                    </View>
                    {!!photoUris.length && (
                      <ScrollView
                        horizontal
                        className="mt-3"
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 8 }}
                      >
                        {photoUris.map((uri) => (
                          <View key={uri} className="relative">
                            <Image
                              source={{ uri }}
                              style={{ width: 96, height: 96, borderRadius: 8 }}
                              contentFit="cover"
                            />
                            <Pressable
                              onPress={() => removePhoto(uri)}
                              className="absolute -top-2 -right-2 bg-black/70 rounded-full p-1"
                            >
                              <X size={14} color="#fff" />
                            </Pressable>
                          </View>
                        ))}
                      </ScrollView>
                    )}
                  </View>

                  <View className="min-w-0">
                    <Label>重大度 *</Label>
                    <View className="flex-row gap-3 mt-2 min-w-0">
                      {(["low", "medium", "high"] as const).map((sev) => (
                        <Button
                          key={sev}
                          variant={severity === sev ? "default" : "outline"}
                          onPress={() => setSeverity(sev)}
                          className="flex-1 min-h-12 min-w-0 flex-row items-center justify-center px-1"
                        >
                          <View className={`w-3 h-3 rounded-full mr-2 ${getSeverityColor(sev)}`} />
                          <Text
                            numberOfLines={1}
                            className={`text-sm font-medium ${
                              severity === sev ? "text-gray-50" : "text-foreground"
                            }`}
                          >
                            {getSeverityText(sev)}
                          </Text>
                        </Button>
                      ))}
                    </View>
                  </View>

                  <View className="min-w-0">
                    <Label>勤務帯 *</Label>
                    <View className="flex-row gap-3 mt-2 min-w-0">
                      {(
                        [
                          { value: "1" as const, label: "1勤" },
                          { value: "2" as const, label: "2勤" },
                          { value: "3" as const, label: "3勤" },
                        ] as const
                      ).map((s) => (
                        <Button
                          key={s.value}
                          variant={shift === s.value ? "default" : "outline"}
                          onPress={() => setShift(s.value)}
                          className="flex-1 min-h-12 min-w-0 items-center justify-center px-1"
                        >
                          <Text
                            numberOfLines={1}
                            className={`text-sm font-medium ${
                              shift === s.value ? "text-gray-50" : "text-foreground"
                            }`}
                          >
                            {s.label}
                          </Text>
                        </Button>
                      ))}
                    </View>
                  </View>
                  </View>
                </View>
              </Card>

              <View className="p-4 bg-white rounded-lg min-w-0">
                <Text className="text-foreground">
                  報告送信後、関係者への共有フローは別途運用に合わせてください。
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom fixed action bar */}
        {!showExistingReports && (
          <View className="px-4 py-3 border-t border-border bg-background min-w-0">
            <View className="flex-row min-w-0 gap-2">
              <Button
                variant="outline"
                onPress={() => onNavigate("index")}
                className="flex-1 min-w-0"
              >
                キャンセル
              </Button>

              <Button
                onPress={async () => {
                  const res = await handleSubmit();
                  Alert.alert(res.title, res.message);
                }}
                disabled={isSubmitting || !canSubmit}
                className="flex-1 min-w-0"
              >
                {isSubmitting ? "送信中..." : "異常報告を送信"}
              </Button>
            </View>
          </View>
        )}
      </View>
      <ImageView uri={previewUri} onClose={() => setPreviewUri(null)} />
    </SafeAreaView>
  );
}