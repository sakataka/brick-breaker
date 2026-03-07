# Architecture

## 目的

機能追加時の変更範囲を局所化し、AI/人間どちらでも誤読しにくい構造を維持すること。

## レイヤー構成

### 1. Core（純ロジック）

- `src/core/model.ts`
- `src/core/engine.ts`
- `src/core/ports.ts`
- `src/game/gamePipeline.ts`
- `src/game/pipeline/*`
- `src/game/physicsCore.ts`
- `src/game/physics/*`
- `src/game/brickDamage.ts`
- `src/game/brickRules.ts`
- `src/game/bossState.ts`
- `src/game/itemSystem.ts`
- `src/game/roundSystem.ts`

ルール:
- Core は DOM / Phaser Scene / Audio API を直接触らない。
- 外部副作用は Port 越しで同期する。

### 2. Orchestrator

- `src/game/Game.ts`
- `src/game/GameSession.ts`
- `src/game/session/SessionController.ts`
- `src/game/sceneSync.ts`
- `src/game/audioSync.ts`
- `src/game/session/startSettings.ts`
- `src/game/session/shopActions.ts`
- `src/game/session/viewSync.ts`

責務:
- 入力・シーン遷移・フレーム進行のオーケストレーション。
- `RenderPort` / `UiPort` / `AudioPort` への同期。

### 3. Phaser Host（描画・入力）

- `src/phaser/GameHost.ts`
- `src/phaser/scenes/RuntimeScene.ts`
- `src/phaser/scenes/BootScene.ts`
- `src/phaser/render/PhaserRenderPort.ts`
- `src/phaser/render/color.ts`
- `src/phaser/render/layers/backdrop.ts`
- `src/phaser/render/layers/world.ts`
- `src/phaser/render/layers/effects.ts`
- `src/phaser/render/layers/overlay.ts`

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
- `StartSettingsForm` は `src/game/startSettingsSchema.ts` の schema を参照し、設定UIを定義駆動で生成する。
- ロケール状態は store が保持し、開始画面の言語 selector から更新する。選択ロケールは `localStorage` に保存する。
- 開始画面の `Item Pool` は item registry を単一ソースとし、アイコン/名称/順序/有効状態を設定 UI と抽選ロジックで共通利用する。
- `OverlayRoot` は開始画面のみ「ヘッダー / 設定スクロール / 固定CTAフッター」を適用し、設定増加時も開始操作を維持する。
- `AppUi` はプレイ中のみ「上段情報バー（HUD+ショップ） / 下段ゲーム枠」の2分割レイアウトを有効化し、`data-theme` / `data-warning` で章別の Neon Pop 演出を切り替える。
- ショップは「2択購入のみ（無料交換なし）」を基本ルールとし、表示モデルは `src/game/shopUi.ts` で一元生成する。
- HUD / Overlay / Shop は構造化 ViewModel を受け取り、ボス戦では `cast / weak window / Risk Chain / OVERDRIVE / mission progress` を強調する。
- HUD は `stageIntro / bossBanner / warningLevel` を受け取り、通常面と encounter 面で見た目を切り替える。

### 4.5 i18n / Copy

- `src/i18n/translations.ts` を翻訳辞書の基準とする。`ja` を canonical source とし、`en` は同一キー構造を必須とする。
- `src/i18n/index.ts` はロケール解決（保存済み > ブラウザ言語 > `ja`）、永続化、React/非 React 共通の翻訳取得を提供する。
- Phaser 側の落下アイテム短縮ラベルも i18n 経由で解決する。

### 5. Audio

- `src/audio/audioDirector.ts`（Facade）
- `src/audio/toneDirector.ts`
- `src/audio/toneBgm.ts`
- `src/audio/toneSfx.ts`
- `src/audio/sfx.ts`
- `src/audio/bgmCatalog.ts`

責務:
- シーン遷移とステージ進行に同期した BGM/SE 制御。
- BGMは `bgmCatalog` の cue 定義（`chapter1 / chapter2 / chapter3 / midboss / finalboss / ex / title`）を基に切り替える。
- 再生は `bgmSequencer` の多声音（リード/ベース/和音/対旋律/パッド）スケジューリングで行う。
- ゲーム側は `AudioPort` 契約のみを意識。

## データフロー

1. `RuntimeScene.update` がフレーム時刻を `GameSession.loop` に渡す。
2. `CoreEngine.tick` が fixed-step で `gamePipeline` を進行し、内部で `pipeline/*` フェーズを順に適用する。
3. `GameSession` が `RenderViewState` / `HudViewModel` / `OverlayViewModel` を構築。
4. `RenderPort`（Phaser）と `UiPort`（Zustand）へ同期。
5. シーン変化時は `audioSync` 経由で `AudioPort` を同期。

## ドキュメント運用ルール

- 設定値: `src/game/config/*`
- 開始設定 schema: `src/game/startSettingsSchema.ts`
- ショップ価格計算: `src/game/config/gameplay.ts` (`getShopPurchaseCost`)
- ブロックHP/破壊判定: `src/game/brickDamage.ts`
- ブロック分類/クリア判定ルール: `src/game/brickRules.ts`
- アイテム仕様: `src/game/itemRegistry.ts`
- アイテム表示情報（色/アイコン/表示順）: `src/game/itemRegistry.ts`
- アイテム表示名/説明/短縮文字: `src/i18n/translations.ts`
- ショップ候補生成と Item Pool 連携: `src/game/pipeline/shopPhase.ts` + `src/game/gamePipeline.ts`
- UI状態: `src/app/store.ts`
- 開始設定の反映: `src/game/session/startSettings.ts`
- EX解放の永続化: `src/game/metaProgress.ts`
- ステージ解決: `src/game/stageContext.ts`
- ステージ盤面の章/タグ/イベント/特殊セル定義: `src/game/config/stages.ts`
- encounter / Risk Chain / OVERDRIVE: `src/game/bossState.ts` + `src/game/pipeline/bossPhase.ts`
- ショップ操作処理: `src/game/session/shopActions.ts`
- View同期: `src/game/session/viewSync.ts`
- デバッグ開始ロジック: `src/game/session/startSettings.ts` + `src/game/roundSystem.ts`
- ロケール解決/保存: `src/i18n/index.ts`
- 未完了タスク: この文書末尾の `Open Backlog` のみ

## 追加時の手順

### 新アイテム

1. `src/game/domainTypes.ts` に `ItemType` を追加。
2. `src/game/config/items.ts` に定義追加。
3. `src/game/itemRegistry.ts` に仕様追加。
4. 即時効果が必要なら `src/game/itemRegistryData.ts` の pickup impact を追加する。
5. `Item Pool` に出す場合は `startSettingsVisibleOrder` / `icon` / `roleTag` も追加する。
6. 必要なら `src/game/physicsCore.ts` と `src/phaser/render/PhaserRenderPort.ts` を更新。

### 新しい表示要素

1. `src/game/renderTypes.ts` を拡張。
2. `src/game/renderPresenter.ts` で ViewModel 生成。
3. Phaser 側なら `src/phaser/render/layers/*`、React 側なら `src/app/components/*` を更新。

### 新しい盤面要素

1. `src/game/domainTypes.ts` の `BrickKind` / `StageDefinition` を更新。
2. `src/game/config/stages.ts` に `specials / tags / events` を追加。
3. `src/game/level.ts` で盤面生成を拡張。
4. 物理・破壊・クリア判定は `src/game/brickRules.ts` / `src/game/brickDamage.ts` へ寄せる。
5. 盤面制御が必要な場合は `src/game/pipeline/stagePhase.ts` と `src/game/renderPresenter.ts` を同期更新する。

### encounter / ボス攻撃追加

1. `src/game/config/stages.ts` の `encounter` に profile を追加する。
2. `src/game/bossState.ts` で state 初期値を定義する。
3. `src/game/pipeline/bossPhase.ts` で `telegraph -> attack -> vulnerability` を実装する。
4. HUD/描画で必要な情報は `src/game/renderTypes.ts` と `src/game/renderPresenter.ts` を拡張する。

## 品質ゲート

- `bun run check`
- `bun run check:fast`
- `bun run guard:local`
- `bun run verify:change-coverage`
- `bun run check:arch`
- `bun run deadcode`
- `bun test`
- `bun run e2e`

## Open Backlog

- 現時点の残タスクはありません。
- 最新完了サイクル: Neon Pop UI/BGM刷新 + Sticky削除 + cueベース音楽化（2026-03）。
