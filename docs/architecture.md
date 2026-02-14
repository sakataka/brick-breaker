# Architecture

## 目的

機能追加時の変更範囲を局所化し、AI/人間どちらでも誤読しにくい構造を維持すること。

## 構成

### Orchestrator

- `src/game/Game.ts`
  - ループ制御、入力接続、シーン遷移の呼び出し、システム間の配線。
  - DOM直接更新は行わず、UIストアへ ViewModel を反映。
- `src/game/sceneSync.ts`
  - SceneMachine 反映の共通処理。
- `src/game/audioSync.ts`
  - シーン変化時の `AudioDirector` 同期。
- `src/game/a11y.ts`
  - `prefers-reduced-motion` / `prefers-contrast` の取得。

### App UI Layer

- `src/app/AppUi.tsx`
  - React で HUD / Overlay / ショップUIを宣言的に描画。
- `src/app/store.ts`
  - Zustand ストア。開始設定、オーバーレイ状態、ショップ状態、UIハンドラを一元管理。
- `src/app/scenes/*.ts`
  - Phaser Scene 境界の土台（Boot / Title / Play / StageClear / GameOver / Clear）。

### Game Systems

- `src/game/gameRuntime.ts`
  - fixed-step 実行、stage clear / life loss 適用。
- `src/game/gamePipeline.ts`
  - playing 中1tickの順序実行（物理/アイテム/コンボ/VFX/敵/ショップ提示）。
- `src/game/roundSystem.ts`
  - ステージ進行、分岐ルート、再挑戦、評価、結果履歴、ラン強化。
- `src/game/dailyChallenge.ts`
  - ローカル日付に基づくデイリーシードと目標文言の生成。
- `src/game/itemRegistry.ts`
  - アイテム定義の正本（表示、上限、ドロップ抑制、SE、説明）。
- `src/game/itemSystem.ts`
  - ドロップ・取得・多球調整の汎用処理。
- `src/game/physicsCore.ts`
  - 物理コア（壁/バー/ブロック/貫通/爆発）。
- `src/game/physicsApply.ts`
  - 複数球への物理適用集約。

### Config

- `src/game/config/gameplay.ts`
- `src/game/config/stages.ts`
- `src/game/config/items.ts`
- `src/game/config/themes.ts`
- `src/game/config/index.ts`
- `src/game/config.ts`（互換再exportのみ）
- `src/game/configSchema.ts`（zod検証）

### Render

- `src/game/renderPresenter.ts`
  - `GameState -> RenderViewState/HudViewModel/OverlayViewModel`。
- `src/game/renderer.ts`
  - 描画オーケストレーション。
- `src/game/renderer/theme.ts`
- `src/game/renderer/layers/backdrop.ts`
- `src/game/renderer/layers/bricks.ts`
- `src/game/renderer/layers/entities.ts`
- `src/game/renderer/layers/effects.ts`
- `src/game/renderer/layers/items.ts`

### Audio

- `src/audio/audioDirector.ts`
- `src/audio/toneDirector.ts`
- `src/audio/bgmCatalog.ts`
- `src/audio/bgmSequencer.ts`
- `src/audio/sfx.ts`

## データフロー

1. `Game.loop` がフレーム差分を算出。
2. `gameRuntime.runPlayingLoop` が fixed-step を進行。
3. `gamePipeline.stepPlayingPipeline` が状態更新。
4. `renderPresenter` が ViewModel を生成。
5. `renderer` が Canvas 描画、`app/store` が HUD / overlay / shop を React UI に反映。
6. シーン/ステージ変化時に `audioSync` 経由で音同期。

## 仕様の正本化ルール

- アイテム仕様: `itemRegistry.ts` を唯一の正本。
- ステージ仕様: `config/stages.ts` を正本。
- 表示仕様: `renderPresenter.ts` + `renderer/*`。
- UI状態正本: `src/app/store.ts`。
- 未完了タスク管理: 本ドキュメント末尾 `Open Backlog` のみ。

## 追加時の手順

### 新アイテム

1. `src/game/domainTypes.ts` に `ItemType` 追加。
2. `src/game/config/items.ts` に `ITEM_CONFIG` を追加。
3. `src/game/itemRegistry.ts` に `ItemDefinition` 追加。
4. 必要に応じて `itemSystem.ts` / `physicsCore.ts` を更新。
5. `bun run check && bun test && bun run e2e`。

### 物理追加

1. `src/game/physicsTypes.ts` を拡張。
2. `src/game/physicsCore.ts` にロジック追加。
3. `src/game/gamePipeline.ts` へ注入。

### 描画追加

1. `src/game/renderTypes.ts` に表示入力を追加。
2. `src/game/renderPresenter.ts` で ViewModel 生成。
3. `src/game/renderer/layers/*` へ描画追加。

## 品質ゲート

- `bun run check`
- `bun test`
- `bun run e2e`

## Open Backlog

`docs/idea-progress.md` と同期する未完了タスク:

- 現時点の残タスクはありません（`BB-IDEA-01` 〜 `BB-IDEA-18` 実装済み）。
