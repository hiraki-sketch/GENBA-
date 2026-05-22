# GENBA

製造現場向けの情報共有アプリです。  
勤務帯ごとの引き継ぎ、異常報告、部署連絡をスマートフォン上で共有できるようにすることを目的に開発しました。
３交代勤務現場では情報の引継ぎが紙やチャットで行われており、
人による齟齬や勤務帯をまたいだ情報共有が上手く出来ていないという深刻な課題が長年ありました。

技術選定の理由

そのような現場においても60を超えるITに抵抗のある作業員なども増えているが皆、休憩所ではスマホを使用していた。
会社用のタブレットやPCでは家に帰った後に引継ぎ情報の共有が難しいので
個人間のスマホで使用できる様に　ReactNative EXPO　を使用し
Google　Apple  対応できるようにしました。

Apple  
App Store: https://apps.apple.com/jp/app/genba/id6769666117
　Google
 追加予定です
## 使用技術

- React Native
- Expo
- TypeScript
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- TanStack Query
- Zustand
- NativeWind

## 主な機能

- ログイン機能
- 勤務帯選択
- 異常報告の投稿
- 画像添付
- 部署連絡の表示
- 検索機能
- ユーザー権限による表示制御
- 管理者/作業員

## ヘッダーコンポーネント運用ルール

### 目的
- アプリ内画面のヘッダー挙動と見た目を統一する。
- レイアウトの重複実装を減らし、将来のデザイン変更を安全にする。

### 基本ルール
- 通常のアプリ内画面では `components/ui/AppHeader` を使用する。
- 戻る動作は `onBack` で渡す。
- 画面固有アクション（例: `新規作成`、`フィルター`、`ログアウト`）は `rightSlot` で渡す。

### 例外ルール
- 認証画面（`Login`、`Auth`、`ResetPassword`）には `AppHeader` を強制しない。
- 全画面専用デザインやモーダル専用ヘッダーなどの特殊画面には `AppHeader` を強制しない。

### `HeaderBackButton` について
- `HeaderBackButton` は現在も使用している。
- 各画面ファイルで `HeaderBackButton` を直接配置するのは原則避ける。
- `AppHeader` の内部で `HeaderBackButton` を利用し、戻る操作を統一する。

### 新規画面チェックリスト
- 通常のアプリ内画面か？ -> `AppHeader` を使う。
- 認証画面・特殊画面か？ -> 個別ヘッダー可。
- 個別ヘッダーを使う場合は、コードコメントか PR 説明に短く理由を残す。

