# TOMORI MATH 開発レポート（APP 007）

## 概要

- 対象: 小学3・4年生 / 算数の計算練習（1回10問）
- 技術: Expo SDK 52 / React Native 0.76 / React Native Web / TypeScript（strict）
- 公開URL（予定）: https://tomoricot-alt.github.io/tomori-math-007/

## 要件との対応

| 要件 | 実装 |
| --- | --- |
| 3年生・4年生モード | `src/logic/ranges.ts` に学年×計算×レベルの数の範囲を定義 |
| 四則演算 + ミックス | `generator.ts` |
| 3段階 | やさしい・ふつう・チャレンジ |
| 1回10問・1画面1問 | `QUESTIONS_PER_SET`, `QuizScreen` |
| 数字入力 / 選択肢 | キーパッド（PCはキーボードも可）/ 4択 |
| 正解・不正解判定 | `isCorrect`, `parseAnswer`（先頭の0も正解扱い） |
| 正しい答えの表示 | 不正解時に「こたえは ○ だよ」 |
| 正解数・達成状況 | 結果画面（星3段階）, `achievementFor` |
| 復習 | 結果画面・きろく画面から、まちがえた問題だけ再挑戦 |
| 履歴保存 | AsyncStorage（Webでは localStorage）に最大100件。破損データは1件ずつ検査して復旧 |
| 前向きなフィードバック | `feedback.ts`（責める言葉を使わないことをテスト） |
| 正解アニメーション | `Celebration`（Animated API） |

## 問題の正しさを守る仕組み

- わり算は「わる数 × 答え」でわられる数を作る → 0でわらず、必ず割り切れる。
- ひき算は大きい方から小さい方をひく → 答えは0以上。
- すべての問題を `validateQuestion` で検査（整数・NaN・0除算・割り切れ・答えの再計算・範囲・選択肢の重複/正解数）。異常なら最大50回作り直し、それでもだめなら例外。
- 4択は「正解が1つだけ・重複なし・負の数なし」。
- 1回の10問に同じ式は出ない。

## テスト結果

実施日: 2026-10-12（Claude Code Cloud 上）

| テスト | 内容 | 結果 |
| --- | --- | --- |
| 四則演算の正解判定 | `generator.test.ts`, `session.test.ts` | 合格 |
| 難易度の切り替え | `generator.test.ts`, `app.test.tsx` | 合格 |
| 10問終了時の集計 | `session.test.ts`, `app.test.tsx` | 合格 |
| 間違えた問題の復習 | `session.test.ts`, `app.test.tsx` | 合格 |
| 問題生成の異常値検出 | 学年×計算×レベル 24通り × 2000問を検査 | 合格 |
| 履歴保存と再読み込み | `storage.test.ts`, `app.test.tsx`（再マウント） | 合格 |
| iPhone相当の画面表示 | Jest（390x844）+ `e2e/iphone.mjs`（実Chromium: iPhone 13 / SE / PC） | 合格 |
| TypeScript型チェック | `npm run typecheck` | 合格 |
| Webビルド | `npm run build` | 合格 |
| app-info.json | 一覧サイトの登録条件 | 合格 |

Jest 34件すべて合格。e2e は 18項目すべて OK（横スクロールなし・ボタン高さ64px・10問完走・再読み込み後も履歴が残る）。

## TOMORI APP LAB との連携状況

- 作業時点で `tomori-app-lab` の `main` には、自動化PR #2 の `templates/app-template` が **まだ反映されていませんでした**（`src/data/apps.ts` の `AppInfo` 型と `docs/OPERATIONS.md` のみ）。
- そのため `app-info.json` は、現在の `AppInfo` 型（id・name・category・description・tagline・overview・capabilities・features・usageSteps・notes・appUrl・icon・status・publishedAt・userGuideUrl・faq）に合わせて作成しました。`id` は `007`、使い方は5ステップ、`validateApps` と同じ条件は `appinfo.test.ts` で確認しています。
- PR #2 のテンプレート/スキーマがmainに入ったら、項目名の差分があれば `app-info.json` を合わせてください（差分は小さい想定です）。
- 一覧サイトへの自動登録は未稼働のため、この時点ではこのリポジトリ内に `app-info.json` を用意するまでです。

## 公開手順（本人の作業）

1. Pull Request を確認し、承認後にマージ。
2. 初回のみ Settings → Pages → Source を「GitHub Actions」にする。
3. `main` へのマージで GitHub Actions が自動で公開（`deploy` ジョブは main への push のときだけ動作）。

## 今後の改善案

- あまりのあるわり算（「商」と「あまり」を分けて答える）
- 苦手な計算の自動おすすめ
- 3・4年生向けの文章題
