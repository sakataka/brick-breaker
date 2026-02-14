# Brick Breaker Local

Bun + Vite + TypeScript を基盤に、`Phaser` をホストにした描画/入力、`React + Zustand` の UI、`Tone/WebAudio` のサウンドで構成したローカル向けブロック崩しです。  
マウス操作を中心に、12ステージキャンペーン、6種アイテム、コンボ、評価、サウンド、開始前設定を備えています。

## セットアップ

```bash
bun install
bun run dev
```

## 開発コマンド

```bash
# 型 + lint + build
bun run check

# unit/integration tests
bun test

# e2e tests (Playwright)
bun run e2e
```

初回のみ Playwright ブラウザをインストールしてください。

```bash
bunx playwright install chromium
```

## 操作

- マウス移動: パドル移動
- 左クリック / `Enter` / `Space`: 開始・再開・次ステージ
- `P`: 一時停止 / 再開

## 開始前設定

タイトル画面でマウス選択できます。

- 難易度: `カジュアル / スタンダード / ハード`（デフォルト `スタンダード`）
- 初期残機: `1..6`
- 速度: `75% / 100% / 125%`（初速/最高速のみに反映）
- マルチ上限: `2..6`（デフォルト `4`）
- ルート選択: `自動 / A / B`
- チャレンジ固定シード: `ON/OFF`（ON時は毎回同一乱数で再現プレイ）
- デイリーモード: `ON/OFF`（日付ごとの固定シードと目標を適用、ON時はこちらが優先）
- リスク倍率モード: `ON/OFF`（ON時は高得点・高危険）
- サウンド: `BGM ON/OFF` / `効果音 ON/OFF`

## ゲーム仕様

- 12ステージ直線キャンペーン
- 4面クリア後の2ルート分岐（A/B）
- ステージ間で残機を持ち越し（ステージクリアで回復しない）
- ライフ0で同ステージ再挑戦（ステージ開始スコアへ巻き戻し）
- コンボ倍率: `1.8s` 窓、`x1.00 -> x3.00`
- コンボ `x2.0` 到達時に1回だけ確定アイテムドロップ
- ステージ評価: ★1〜★3（時間/被弾/残機）
- ステージクリア時に制限時間ミッション（時間内クリア）の達成/未達を表示
- 9〜11面にエリートブロック（`durable` / `armored` / `regen` / `hazard`）
- `hazard` 破壊時は `slow_ball` 効果が解除され、3秒間だけ球速上限が上がる
- 12面は単一ボス戦（HUDにボスHPを表示）
- ステージ修飾子（ワープ / 低重力 / 高速球）を後半面に適用
  - 低重力は「弱い下向き加速度 + 最低落下速度」で停滞しない設計
  - ワープは「青=入口 / 黄=出口 + ガイド線」で移動先を明示
- 浮遊敵ユニット（後半面）を撃破して追加得点
- ステージ中1回限定ショップ（2択購入）
- ラン内3回までの永続強化選択（幅/速度/スコア）
- 4/8/12面の開始前ストーリー演出
- 右クリックの単発魔法スキル（クールダウン制）

## アイテム仕様

- ドロップ率 `18%`、同時落下上限 `3`
- 種類: `paddle_plus`, `slow_ball`, `multiball`, `shield`, `pierce`, `bomb`
- スタック加算型（`pierce` と `bomb` は上限1）
- ステージクリア時はアクティブ効果を次面へ持ち越し（`bomb` は持ち越さない）
- 全ボール喪失で全効果解除
- `bomb` / `pierce` 有効中は同種アイテムを再ドロップしない
- シナジー: `pierce` + `slow_ball` 同時有効で貫通深度 `+1`
- 描画は `DPR上限2` で高解像度表示（4K環境でも視認性を維持）

## アクセシビリティ（自動適用）

- `prefers-reduced-motion: reduce` を自動反映
- `prefers-contrast: more` を自動反映
- HUD に適用状態バッジを表示（`表示: 標準` / `表示: 動き抑制` など）

## サウンド

- WebAudio合成のみ（外部音源ファイルなし）
- タイトルBGM + ステージ別BGM（12トラック）
- 開始/ステージクリア/最終クリア/ゲームオーバーのジングル
- アイテム6種は個別SE
- コンボ `x2.5` 到達時にフィルインSE

## 公開（GitHub Pages）

- `vite.config.ts` は GitHub Actions 上で `base: /brick-breaker/` を自動適用
- Workflow:
  - CI: `.github/workflows/ci.yml`（`check` + `test` + `e2e`）
  - Deploy: `.github/workflows/deploy-pages.yml`

GitHub Pages 公開手順:

1. GitHub リポジトリで Pages を `GitHub Actions` に設定
2. `main` へ push
3. `Deploy Pages` workflow の完了を確認

## 設計ドキュメント（正本）

- `docs/architecture.md`
- `README.md`

## プレイヤー向けガイド

- `docs/game-guide.md`

## 実装メモ

- 実行エントリは `src/game/GameSession.ts`（オーケストレータ）で、`src/core/engine.ts`（進行ロジック）を駆動します。
- 描画は `src/phaser/scenes/RuntimeScene.ts` + `src/phaser/render/PhaserRenderPort.ts` 経由で実行します。
- UI は `src/app/AppUi.tsx` と `src/app/components/*` で宣言的に構成し、`src/app/store.ts` で同期します。
- 音制御は `src/audio/audioDirector.ts`（facade） -> `src/audio/toneDirector.ts` の経路で管理します。

## アイディアリスト（実装検討用）

- `docs/idea-list.md`

他の計画系ドキュメントは履歴/補助参照で、未完了タスクの正本管理は `docs/architecture.md` の `Open Backlog` に統一しています。
