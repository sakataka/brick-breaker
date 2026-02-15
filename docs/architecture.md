# Architecture

## 目的

機能追加時の変更範囲を局所化し、AI/人間どちらでも誤読しにくい構造を維持すること。

## レイヤー構成

### 1. Core（純ロジック）

- `src/core/model.ts`
- `src/core/engine.ts`
- `src/core/ports.ts`
- `src/game/gamePipeline.ts`
- `src/game/physicsCore.ts`
- `src/game/itemSystem.ts`
- `src/game/roundSystem.ts`

ルール:
- Core は DOM / Phaser Scene / Audio API を直接触らない。
- 外部副作用は Port 越しで同期する。

### 2. Orchestrator

- `src/game/Game.ts`
- `src/game/GameSession.ts`
- `src/game/sceneSync.ts`
- `src/game/audioSync.ts`

責務:
- 入力・シーン遷移・フレーム進行のオーケストレーション。
- `RenderPort` / `UiPort` / `AudioPort` への同期。

### 3. Phaser Host（描画・入力）

- `src/phaser/GameHost.ts`
- `src/phaser/scenes/RuntimeScene.ts`
- `src/phaser/scenes/BootScene.ts`
- `src/phaser/render/PhaserRenderPort.ts`

責務:
- Pointer/Keyboard 入力を受け取り `GameSession` へコマンド通知。
- `RenderViewState` を Phaser Graphics 描画へ変換。

### 4. React UI

- `src/app/AppUi.tsx`
- `src/app/components/HudPanel.tsx`
- `src/app/components/OverlayRoot.tsx`
- `src/app/components/StartSettingsForm.tsx`
- `src/app/components/StageResultPanel.tsx`
- `src/app/components/ShopPanel.tsx`
- `src/app/store.ts`
- `src/app/viewmodels/overlayCopy.ts`
- `src/app/viewmodels/overlayText.ts`

責務:
- 表示は宣言的に実装。
- ゲーム本体との接続点は store のみ。
- `StartSettingsForm` が通常設定とデバッグ設定（開始ステージ/シナリオ/プリセット/記録可否）を一元管理。
- `OverlayRoot` は開始画面のみ「ヘッダー / 設定スクロール / 固定CTAフッター」を適用し、設定増加時も開始操作を維持する。

### 5. Audio

- `src/audio/audioDirector.ts`（Facade）
- `src/audio/toneDirector.ts`
- `src/audio/toneBgm.ts`
- `src/audio/toneSfx.ts`
- `src/audio/sfx.ts`
- `src/audio/bgmCatalog.ts`

責務:
- シーン遷移とステージ進行に同期した BGM/SE 制御。
- ゲーム側は `AudioPort` 契約のみを意識。

## データフロー

1. `RuntimeScene.update` がフレーム時刻を `GameSession.loop` に渡す。
2. `CoreEngine.tick` が fixed-step で `gamePipeline` を進行。
3. `GameSession` が `RenderViewState` / `HudViewModel` / `OverlayViewModel` を構築。
4. `RenderPort`（Phaser）と `UiPort`（Zustand）へ同期。
5. シーン変化時は `audioSync` 経由で `AudioPort` を同期。

## ドキュメント運用ルール

- 設定値: `src/game/config/*`
- アイテム仕様: `src/game/itemRegistry.ts`
- UI状態: `src/app/store.ts`
- デバッグ開始ロジック: `src/game/GameSession.ts` + `src/game/roundSystem.ts`
- 機能台帳: `docs/idea-list.md` と `docs/idea-progress.md`
- Cycle 01 記録: `docs/archive/idea-cycle-01-2026-02.md`
- 未完了タスク: この文書末尾の `Open Backlog` のみ

## 追加時の手順

### 新アイテム

1. `src/game/domainTypes.ts` に `ItemType` を追加。
2. `src/game/config/items.ts` に定義追加。
3. `src/game/itemRegistry.ts` に仕様追加。
4. 必要なら `src/game/physicsCore.ts` と `src/phaser/render/PhaserRenderPort.ts` を更新。

### 新しい表示要素

1. `src/game/renderTypes.ts` を拡張。
2. `src/game/renderPresenter.ts` で ViewModel 生成。
3. Phaser 側または React 側の対応コンポーネントを更新。

## 品質ゲート

- `bun run check`
- `bun test`
- `bun run e2e`

## Open Backlog

- 現時点の残タスクはありません。
- 最新完了サイクル: `BB-FEAT-01` 〜 `BB-FEAT-04`（Cycle 02）。
