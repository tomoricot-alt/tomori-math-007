# TOMORI MATH（APP 007）

小学3・4年生向けの算数練習アプリです。たし算・ひき算・かけ算・わり算を、1回10問ずつ楽しく練習できます。
TOMORI -CREATIVE OFFICE- の「TOMORI APP LAB」50アプリ開発プロジェクト 第7号です。

- 公開URL: https://tomoricot-alt.github.io/tomori-math-007/
- 技術: React Native / Expo (SDK 52) / TypeScript / React Native Web
- サーバー・ログイン・広告・課金・外部送信はありません。学習きろくは端末内（ブラウザの localStorage）だけに保存します。

## 機能

| 項目 | 内容 |
| --- | --- |
| 学年 | 3年生 / 4年生 |
| 計算 | たし算・ひき算・かけ算・わり算・ミックス |
| レベル | やさしい・ふつう・チャレンジ |
| 出題 | 1回10問・1画面1問 |
| 回答 | 4択（えらぶ）／ 数字入力（画面のキーパッド。PCではキーボードも可） |
| 結果 | 正解数・星（達成状況）・まちがえた問題と正しい答え |
| 復習 | まちがえた問題だけをやりなおす（結果画面・きろく画面から） |
| 保存 | 学習きろく最大100件を端末内に保存 |

### 問題の作り方（ルール）

- 学年とレベルごとに数の範囲を決めています（`src/logic/ranges.ts`）。
- **わり算**は「わる数 × 答え = わられる数」で作るので、0でわらず、かならず割り切れます（あまりのある問題は出しません）。
- **ひき算**の答えはマイナスになりません。
- 答えは1つの整数だけ。4択は「正解が1つ・重複なし」を毎回確認します。
- 生成した問題は必ず `validateQuestion`（`src/logic/validate.ts`）で検査し、異常があれば作り直します。
- 入力は数字のみ（`007` のような先頭の0も `7` として正解になります）。
- まちがえたときも、責めない前向きな言葉で、正しい答えを表示します。

## 開発

```bash
npm ci
npm start          # Expo 開発サーバー
npm run web        # Web で開く
npm run typecheck  # TypeScript 型チェック
npm test           # Jest（問題生成・集計・復習・履歴・画面）
npm run build      # Web ビルド（dist/）
npm run test:e2e   # ビルド後、実ブラウザで iPhone 相当(390x844)などの画面確認
npm run verify     # 型チェック + テスト + ビルド
```

`test:e2e` は Chromium が必要です。`PLAYWRIGHT_CHROMIUM_PATH` で場所を指定できます（CI では `playwright-core install chromium` します）。

### ディレクトリ

```
App.tsx                 画面の切り替えと保存
src/logic/              問題生成・検査・集計・保存（UIに依存しない）
src/screens/            ホーム / 問題 / 結果 / きろく
src/components/         ボタン・キーパッド・お祝いアニメーションなど
src/__tests__/          テスト
e2e/iphone.mjs          実ブラウザでの画面テスト
app-info.json           TOMORI APP LAB 自動登録用の情報
docs/                   使い方・開発レポート
```

## 公開（GitHub Pages）

`.github/workflows/deploy.yml` が、Pull Request では「型チェック → テスト → ビルド → 画面テスト」を実行し、`main` にマージされると GitHub Pages へ自動公開します。
初回のみ、リポジトリの **Settings → Pages → Source** を **GitHub Actions** にしてください。
公開パス（`/tomori-math-007/`）は `app.json` の `experiments.baseUrl` で設定しています。

## TOMORI APP LAB との連携

リポジトリ直下の `app-info.json` が一覧サイトの登録用データです。形式は `tomori-app-lab` の `AppInfo`（`src/data/apps.ts`）に合わせています。
詳しくは `docs/DEV_REPORT.md` を参照してください。

## 運用ルール

- `main` を直接編集せず、作業ブランチ → Pull Request → 本人の承認後にマージします。
- 氏名・学校名などの個人情報は取得しません。学習データは外部へ送信しません。
