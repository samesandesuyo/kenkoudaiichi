# CLAUDE.md - よぞら体調ナビ 開発引き継ぎ書

## プロジェクト概要

**アプリ名：** よぞら体調ナビ  
**目的：** 気圧・生理周期・睡眠・食事などの体調データを毎日手動入力で記録し、翌日の体調を予測してアドバイスを表示するパーソナルヘルスログWebアプリ  
**オーナー：** よぞら（VTuber）個人利用アプリ  
**本番URL：** https://samesandesuyo.github.io/kenkoudaiichi/  
**リポジトリ：** https://github.com/samesandesuyo/kenkoudaiichi

---

## 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | React 18 + TypeScript + Vite |
| スタイリング | Tailwind CSS v4 (`@tailwindcss/vite`) |
| データ保存 | localStorageのみ（サーバー不要） |
| 気圧データ | Open-Meteo API（無料・APIキー不要） |
| ZIPパース | JSZip（Apple Healthインポート用） |
| デプロイ | GitHub Pages（GitHub Actions自動デプロイ） |
| フォント | Noto Serif JP（見出し）+ Noto Sans JP（本文） |

---

## カラーパレット（よぞらブランドカラー・必ず守ること）

```css
--color-bg:       #0B0F2A  /* Deep Navy：背景メイン */
--color-blue:     #378ADD  /* Blue */
--color-lavender: #7F77DD  /* Lavender */
--color-green:    #1D9E75  /* Green */
--color-text:     #E8EAF6  /* 薄白：メインテキスト */
--color-muted:    #8B90B8  /* グレーラベンダー：サブテキスト */
--color-surface:  #141836  /* カード背景 */
--color-border:   #2A2F5A  /* ボーダー */
```

すべてCSS変数で定義済み（`src/index.css`）。新しいコンポーネントでも必ずこの変数を使う。

---

## ファイル構成

```
src/
├── main.tsx
├── App.tsx                        # ルートコンポーネント・状態管理
├── index.css                      # CSS変数・星背景・アニメーション定義
├── types/
│   └── health.ts                  # 全型定義（DailyLog, PredictionResult等）
├── hooks/
│   ├── useHealthLog.ts            # ログのCRUD（localStorage）
│   ├── usePressureData.ts         # Open-Meteo API気圧データ取得
│   └── useSettings.ts             # ユーザー設定
├── utils/
│   ├── prediction.ts              # 予測ロジック（スコアリング方式）
│   └── appleHealthParser.ts       # Apple Health XML/ZIPパーサー
└── components/
    ├── Layout.tsx                 # 共通レイアウト・ヘッダー
    ├── Onboarding.tsx             # 初回起動時セットアップ（4ステップ）
    ├── TodayLog.tsx               # 今日のログ入力フォーム
    ├── PredictionCard.tsx         # 明日の予測カード
    ├── WeekCalendar.tsx           # 週間カレンダー
    ├── SettingsPanel.tsx          # 設定画面
    └── HealthImport.tsx           # Apple Healthインポート UI
```

---

## 実装済み機能

### コア機能
- **今日のログ入力**：体調レベル(1-5)・睡眠時間・就寝時刻・朝タンパク質・五苓散・生理フェーズ・メモ
- **明日の予測**：スコアリング方式（気圧・周期・睡眠・体調トレンドを点数化して合算）
- **週間カレンダー**：直近7日のログをドット表示、タップで詳細表示
- **設定画面**：生理周期・開始日・位置情報の管理

### 予測ロジック詳細（`src/utils/prediction.ts`）
スコアリング方式（0〜100点）：
- 気圧リスク：dropping=+30点、stable=0点、rising=-10点（ボーナス）
- 周期リスク：生理中=+30点、黄体期後半3日=+25点、黄体期7日以内=+15点、黄体期=+8点、排卵期=-5点、卵胞期=-8点
- 睡眠リスク：平均6時間未満=+18点〜、就寝23時以降1日=+3点
- 体調トレンド：直近3日平均2.5以下=+10点
- 合計35点以上→tough、15〜34点→moderate、14点以下→good

コンボ判定：気圧低下×生理中、気圧低下×生理直前3日 に専用アドバイス

### 演出・UX
- **オンボーディング**：初回起動時に生理周期を設定する4ステップフロー（`localStorage` に完了フラグ保存）
- **保存演出**：ボタン押下時に波紋+星パーティクル10個バースト（CSSのみ）
- **星の背景**：CSSのみで実装（`twinkle`アニメーション）

### PWA対応
- `public/manifest.json`・`public/sw.js` 設置済み
- iOSの `apple-mobile-web-app` メタタグ対応済み
- アイコンは `public/icon-generator.html` をブラウザで開いてDLし `public/icon-192.png`・`public/icon-512.png` として配置（未配置でも動作はする）

### Apple Healthインポート（`src/utils/appleHealthParser.ts`）
- iPhoneヘルスケアアプリからエクスポートしたZIP/XMLを読み込み
- 取得データ：睡眠時間・就寝時刻・生理フェーズ（過去90日分）
- 生理開始日を自動推定して設定に反映
- 日付フォーマット："2026-04-15 23:30:00 +0900" → 正規表現でパース
- 既存の手動ログを優先するオプションあり

---

## 重要な実装ルール

1. **`<form>`タグは使わない**。すべて `onClick`/`onChange` で実装
2. **アニメーションはCSSのみ**（framer-motion不使用）
3. **外部APIはOpen-Meteoのみ**（APIキー不要）
4. **データはlocalStorageのみ**。サーバー通信なし
5. **モバイルファースト**設計
6. カラーは必ず**CSS変数**（`var(--color-xxx)`）を使う

---

## デプロイ方法

`main` ブランチにpushすると GitHub Actions が自動でビルド＆デプロイ（`.github/workflows/deploy.yml`）。

```bash
git add .
git commit -m "変更内容"
git push
```

vite.config.ts の `base: '/kenkoudaiichi/'` はGitHub Pages用の設定。**変更しないこと**。

---

## よぞらについて

- VTuber（声優・配信活動）
- 気圧の変化で体調が悪くなりやすい
- 生理周期の影響も受けやすい
- 五苓散（漢方）を気圧対策に使用
- Apple Watch・iPhoneのヘルスケアアプリでデータ管理
- 奈良市在住（気圧データのデフォルト座標：lat=34.6851, lon=135.8049）
- よぞらの録音・配信活動：体調が良い日（energyForecast=good）に推奨

---

## 今後やりたいこと（未実装）

- 月間カレンダービュー
- 週間サマリー（平均体調・睡眠グラフ）
- データのJSONエクスポート/インポート（機種変更対応）
