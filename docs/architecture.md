# Architecture

## 目的

機能追加時の変更範囲を局所化し、AI/人間どちらでも誤読しにくい構造を維持すること。

## 構成

### Orchestrator

- `src/game/Game.ts`
  - ループ制御、入力接続、シーン遷移の呼び出し、システム間の配線。
- `src/game/sceneSync.ts`
  - SceneMachine 反映の共通処理。
- `src/game/audioSync.ts`
  - シーン変化時の `AudioDirector` 同期。
- `src/game/a11y.ts`
  - `prefers-reduced-motion` / `prefers-contrast` の取得。

### Game Systems

- `src/game/gameRuntime.ts`
  - fixed-step 実行、stage clear / life loss 適用。
- `src/game/gamePipeline.ts`
  - playing 中1tickの順序実行（物理/アイテム/コンボ/VFX）。
- `src/game/roundSystem.ts`
  - ステージ進行、再挑戦、評価、結果履歴。
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
- `src/audio/bgmCatalog.ts`
- `src/audio/bgmSequencer.ts`
- `src/audio/sfx.ts`

## データフロー

1. `Game.loop` がフレーム差分を算出。
2. `gameRuntime.runPlayingLoop` が fixed-step を進行。
3. `gamePipeline.stepPlayingPipeline` が状態更新。
4. `renderPresenter` が ViewModel を生成。
5. `renderer` / HUD / overlay が描画。
6. シーン/ステージ変化時に `audioSync` 経由で音同期。

## 仕様の正本化ルール

- アイテム仕様: `itemRegistry.ts` を唯一の正本。
- ステージ仕様: `config/stages.ts` を正本。
- 表示仕様: `renderPresenter.ts` + `renderer/*`。
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

- P2
  - `BB-IDEA-09` 分岐ステージ選択（2ルート）
  - `BB-IDEA-10` フィールドギミック（ワープ / 重力帯 / 可動壁）
  - `BB-IDEA-11` 敵ユニット導入（浮遊敵）
  - `BB-IDEA-12` スコア倍率のリスク選択（高倍率 / 高危険）
  - `BB-IDEA-13` ラウンド中ショップ（1回だけ強化購入）
  - `BB-IDEA-14` ステージ修飾子（低重力 / 高速球）
- P3
  - `BB-IDEA-15` ローグライト進行（ラン内構築）
  - `BB-IDEA-16` 魔法スキルシステム（Wizorb方向）
  - `BB-IDEA-17` サウンド同期イベント（特定行動でBGM変調）
  - `BB-IDEA-18` ストーリー演出ステージ（短いイベント挿入）
