//search-page.tsx
import { Clock3, Megaphone, Search, Siren, User as UserIcon, Wrench } from "lucide-react-native";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSearchPageManagement } from "../src/hooks/useSearchPageManagement";
import { useShiftStore } from "../src/stores/useShiftStore";
import { Shift, User } from '../types';
import { ResponsiveGrid } from "./layout/ResponsiveGrid";
import { AppHeader } from "./ui/app-header";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
interface SearchPageProps {
  user: User;
  initialSelectedShift: Shift;
  onNavigate: (page: string) => void;
}

export function SearchPage({
  user,
  initialSelectedShift,
  onNavigate,
}: SearchPageProps) {
  const currentShift = useShiftStore((state) => state.selectedShift);
  const setGlobalShift = useShiftStore((state) => state.setSelectedShift);
  const { state, data, utils, actions, query } = useSearchPageManagement(
    user,
    initialSelectedShift
  );
  const { searchTerm, searchType, selectedShift, selectedSeverity, showFilters } = state;
  const { filteredResults } = data;
  const {
    incidentsPending,
    incidentsFetching,
    incidentsError,
    incidentsErrorMessage,
    refetchIncidents,
    announcementsPending,
    announcementsFetching,
    announcementsError,
    announcementsErrorMessage,
    refetchAnnouncements,
  } = query;
  const { getTypeText } = utils;
  const {
    setSearchTerm,
    setSearchType,
    setSelectedShift,
    setSelectedSeverity,
    toggleFilters,
  } = actions;

  const renderTypeIcon = (type: "incident" | "announcement") =>
    type === "incident" ? <Siren size={18} color="#6b7280" /> : <Megaphone size={18} color="#6b7280" />;

  return (
    <SafeAreaView className="flex-1">
    <ScrollView className="flex-1 bg-gray-50">
      <AppHeader
        title="検索・履歴"
        subtitle={`${user.department} - ${currentShift}勤`}
        onBack={() => onNavigate('index')}
        rightSlot={
          <Button variant="outline" size="sm" onPress={toggleFilters}>
            <Wrench size={14} color="#334155" />
            <Text>フィルター</Text>
          </Button>
        }
      />

      <View className="p-4 space-y-6">
        {/* 検索バー */}
        <Card>
          <View className="space-y-4">
            <View className="relative">
              <View className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Search size={18} color="#9ca3af" />
              </View>
              <Input
                placeholder="キーワードを入力して検索..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                className="pl-10"
              />
            </View>
            
            <ResponsiveGrid maxCols={{ sm:3, md:3, lg:3, xl:3, "2xl":3 }}>
              {[
                { value: 'all', label: 'すべて' },
                { value: 'incident', label: '異常報告' },
                { value: 'announcement', label: '部署連絡' }
              ].map((type) => (
                <Button
                  key={type.value}
                  variant={searchType === type.value ? 'default' : 'outline'}
                  size="sm"
                  onPress={() => setSearchType(type.value as "all" | "incident" | "announcement")}
                >
                  {type.label}
                </Button>
              ))}
            </ResponsiveGrid>
          </View>
        </Card>

        {/* 詳細フィルター */}
        {showFilters && (
          <Card>
            <View className="mb-4">
              <Text className="text-base font-semibold">詳細フィルター</Text>
            </View>
            <View className="space-y-4">
              <View className="space-y-2">
                <Label>勤務帯</Label>
                <ResponsiveGrid maxCols={{ sm:4, md:4, lg:4, xl:4, "2xl":4 }}>
                  {[
                    { value: 'all', label: 'すべて' },
                    { value: '1勤', label: '1勤' },
                    { value: '2勤', label: '2勤' },
                    { value: '3勤', label: '3勤' }
                  ].map((shift) => (
                    <Button
                      key={shift.value}
                      variant={selectedShift === shift.value ? 'default' : 'outline'}
                      size="sm"
                      onPress={() => {
                        const nextShift = shift.value as Shift | "all";
                        setSelectedShift(nextShift);
                        if (nextShift !== "all") {
                          setGlobalShift(nextShift);
                        }
                      }}
                    >
                      {shift.label}
                    </Button>
                  ))}
                </ResponsiveGrid>
              </View>
              <View className="space-y-2">
                <Label>重要度</Label>
                <ResponsiveGrid maxCols={{ sm:4, md:4, lg:4, xl:4, "2xl":4 }}>
                  {[
                    { value: 'all', label: 'すべて' },
                    { value: 'low', label: '低' },
                    { value: 'medium', label: '中' },
                    { value: 'high', label: '高' }
                  ].map((severity) => (
                    <Button
                      key={severity.value}
                      variant={selectedSeverity === severity.value ? 'default' : 'outline'}
                      size="sm"
                      onPress={() => setSelectedSeverity(severity.value as 'all' | 'low' | 'medium' | 'high')}
                    >
                      {severity.label}
                    </Button>
                  ))}
                </ResponsiveGrid>
              </View>
            </View>
          </Card>
        )}

        {/* 検索結果 */}
        <View className="space-y-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-semibold">
              検索結果 ({data.filteredResults.length}件)
            </Text>
            {(announcementsFetching || incidentsFetching) && searchTerm.trim().length > 0 && (
              <ActivityIndicator size="small" />
            )}
          </View>

          {!user.departmentId && (
            <Card>
              <View className="py-4 px-2">
                <Text className="text-gray-600">
                  プロフィールに部署が設定されていないため、検索はできません。
                </Text>
              </View>
            </Card>
          )}

          {user.departmentId &&
            incidentsError &&
            searchTerm.trim().length > 0 &&
            (searchType === "all" || searchType === "incident") && (
              <Card>
                <View className="py-4 px-2">
                  <Text className="text-red-600">
                    {incidentsErrorMessage ?? "異常報告の検索に失敗しました。"}
                  </Text>
                  <Pressable onPress={() => refetchIncidents()} className="mt-2 self-start">
                    <Text className="font-medium text-primary">再試行</Text>
                  </Pressable>
                </View>
              </Card>
            )}

          {user.departmentId &&
            announcementsError &&
            searchTerm.trim().length > 0 &&
            (searchType === "all" || searchType === "announcement") && (
              <Card>
                <View className="py-4 px-2">
                  <Text className="text-red-600">
                    {announcementsErrorMessage ?? "検索に失敗しました。"}
                  </Text>
                  <Pressable onPress={() => refetchAnnouncements()} className="mt-2 self-start">
                    <Text className="font-medium text-primary">再試行</Text>
                  </Pressable>
                </View>
              </Card>
            )}

          {user.departmentId &&
            (announcementsPending || incidentsPending) &&
            filteredResults.length === 0 &&
            searchTerm.trim().length > 0 &&
            (searchType === "all" || searchType === "announcement" || searchType === "incident") && (
              <Card>
                <View className="items-center py-8">
                  <ActivityIndicator size="large" />
                  <Text className="text-gray-500 mt-2">検索中…</Text>
                </View>
              </Card>
            )}

          {filteredResults.map((item) => (
            <Card key={item.id}>
              <View className="flex-row items-start gap-3">
                <View className="shrink-0">
                  {renderTypeIcon(item.type)}
                </View>
                <View className="flex-1 min-w-0">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 min-w-0">
                      <View className="flex-row items-center gap-2 mb-1 flex-wrap">
                        <Text className="font-medium text-gray-900 flex-1 min-w-0">{item.title}</Text>
                        <Badge variant="outline">
                          {getTypeText(item.type)}
                        </Badge>
                      </View>
                      
                      <Text className="text-sm text-gray-700 mb-2">{item.content}</Text>
                      
                      <View className="flex-row items-center flex-wrap gap-4">
                        <View className="flex-row items-center gap-1">
                          <UserIcon size={14} color="#6b7280" />
                          <Text className="text-xs text-gray-500">{item.author}</Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <Clock3 size={14} color="#6b7280" />
                          <Text className="text-xs text-gray-500">{item.createdAt}</Text>
                        </View>
                        {'shift' in item && item.shift && (
                          <Badge variant="secondary">
                            {item.shift}
                          </Badge>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </Card>
          ))}

          {filteredResults.length === 0 &&
            !announcementsPending &&
            !incidentsPending &&
            !announcementsError &&
            !incidentsError &&
            !(announcementsFetching && searchTerm.trim().length > 0) &&
            !(incidentsFetching && searchTerm.trim().length > 0) && (
            <Card>
              <View className="items-center py-8">
                <Search size={36} color="#9ca3af" />
                <Text className="text-gray-500">
                  {!user.departmentId
                    ? "部署を設定すると部署連絡を検索できます。"
                    : searchTerm.trim()
                        ? searchType === "incident"
                          ? "検索条件に一致する異常報告が見つかりません。"
                          : searchType === "announcement"
                            ? "検索条件に一致する部署連絡が見つかりません。"
                            : "検索条件に一致する結果が見つかりません。"
                        : "キーワードを入力して検索してください。"}
                </Text>
              </View>
            </Card>
          )}
        </View>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}
