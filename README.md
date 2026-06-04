# GENBA


製造現場向けの情報共有アプリです。

3交代勤務の現場では、引き継ぎ情報が紙やチャットで分散し、勤務帯をまたいだ情報共有に齟齬が生まれる課題がありました。  
GENBAは、勤務帯ごとの引き継ぎ、異常報告、部署連絡をスマートフォン上で共有できるようにすることを目的に開発しました。

## 技術選定の理由

現場ではITに苦手意識のある作業員もいますが、休憩時間などにスマートフォンを使用している人は多くいます。  
会社用PCやタブレットに依存すると、勤務外や移動中に情報確認しづらいため、個人のスマートフォンでも利用しやすい形を重視しました。

そのため、iOS / Android の両対応を見据えて React Native / Expo を採用しました。

## App Store

https://apps.apple.com/jp/app/genba/id6769666117

※ Google Play は今後対応予定です。

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
- 管理者 / 作業員の権限分離
- チャット機能

## ドキュメント

- [ドキュメント一覧](./docs/README.md)
- [ER図](./docs/er-diagram.md)

