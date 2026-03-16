# Architecture

## 目的

変更範囲を局所化し、browser-first campaign の shipped 仕様を UI / Phaser / Audio / test で一貫して扱える構造を維持すること。

## レイヤー構成

### 1. Core Simulation

- `src/core/*`
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

- Core は DOM / Phaser / Audio API を直接触らない
- frame 中の gameplay rule は `gamePipeline` と各 phase に閉じる
- `gamePipeline.ts` は orchestration のみを持ち、具体処理は `pipeline/*` に分ける

### 2. Runtime Orchestrator

- `src/game/GameSession.ts`
- `src/game/session/RuntimeController.ts`
- `src/game/session/SessionPorts.ts`
- `src/game/session/startSettings.ts`
- `src/game/session/sessionFlow.ts`
- `src/game/session/shopActions.ts`
- `src/game/sceneSync.ts`
- `src/game/audioSync.ts`

責務:

- `GameSession` は public facade
- `RuntimeController` は start / pause / resume / frame loop / scene transition を束ねる唯一の orchestrator
- `SessionPorts` は `RenderPort / UiPort / AudioPort / MetaProgress` への同期境界
- shipped 開始設定を runtime state に適用し、run を開始する

### 3. Phaser Host

- `src/phaser/GameHost.ts`
- `src/phaser/scenes/BootScene.ts`
- `src/phaser/scenes/RuntimeScene.ts`
- `src/phaser/render/PhaserRenderPort.ts`
- `src/phaser/render/layers/backdrop.ts`
- `src/phaser/render/layers/world.ts`
- `src/phaser/render/layers/renderers/*`
- `src/phaser/render/layers/effects.ts`
- `src/phaser/render/layers/overlay.ts`
- `src/art/visualAssets.ts`

責務:

- Pointer / keyboard 入力を `GameSession` へ通知する
- presenter が生成した `RenderViewState` を Phaser 描画へ変換する
- `world.ts` は coordinator として各 renderer を呼び、描画ロジックの集中を避ける
- `BootScene` は art manifest 由来の texture を preload する

### 4. React UI

- `src/app/AppUi.tsx`
- `src/app/store.ts`
- `src/app/components/*`
- `src/app/viewmodels/*`

責務:

- 表示は宣言的に実装する
- ゲーム本体との接続点は store と `UiPort` のみ
- 開始画面は shipped 設定だけを表示する
- HUD / Overlay / Shop は presenter から受け取る view model をそのまま描画する

### 5. Audio

- `src/audio/audioDirector.ts`
- `src/audio/toneDirector.ts`
- `src/audio/toneBgm.ts`
- `src/audio/toneSfx.ts`
- `src/audio/bgmCatalog.ts`
- `src/audio/bgmSequencer.ts`

責務:

- scene / encounter / warning cue に同期した BGM / SE を制御する
- runtime 側は `AudioPort` 契約だけを意識する

## Runtime State

runtime の正式 state shape は `src/game/runtimeTypes.ts` の nested contract のみです。

- `scene`
- `run`
  - score
  - lives
  - elapsed
  - progress
  - combo
  - options
  - modulePolicy
  - records
- `encounter`
  - current encounter id
  - stage stats
  - shop state
  - story state
  - threat level
  - active telegraphs
  - reward preview
  - encounter runtime
- `combat`
  - balls
  - paddle
  - bricks
  - enemies
  - items
  - assist
  - hazard
  - magic
- `ui`
  - vfx
  - a11y
  - score feed
  - style bonus
  - error

旧 flat state を前提にした runtime contract は使いません。

## Run / Content Structure

進行の上位単位は `EncounterDefinition` です。

- `src/game/content/runDefinition.ts`
  - `threatTier: 1 | 2` ごとの run を定義
- `src/game/content/encounters.ts`
  - encounter の順序、preview、score focus、board/boss 接続を定義
- `src/game/content/modules.ts`
  - `core / tactical / active` の上位分類を定義
- `src/game/config/stages.ts`
  - 低レベルの盤面テンプレートと stage metadata を保持

公開進行は `12 encounter の Tier 1` を基準にし、clear 後に `Threat Tier 2` を解放します。  
旧 `course` や route 分岐は shipped 仕様に含めません。

## Data Flow

1. `GameHost` が入力とフレーム時刻を `RuntimeController` へ渡す
2. `RuntimeController` が `CoreEngine.tick` を呼ぶ
3. `gamePipeline.ts` が次の phase を固定順で進める
   - `resolveInputPhase`
   - `runEncounterScriptPhase`
   - `runCombatSimulationPhase`
   - `resolveCollisionPhase`
   - `applyScoringPhase`
   - `resolveRewardsAndTransitionPhase`
4. presenter facade が `src/game/presenter/*` を通して `RenderViewState` / `HudViewModel` / `OverlayViewModel` を生成する
5. `SessionPorts.publish(state)` が `RenderPort` と `UiPort` に同期する
6. `audioSync` が scene / cue 変化を `AudioPort` に同期する

## Presenter / Render Contract

- presenter facade: `src/game/renderPresenter.ts`
- world presenter: `src/game/presenter/worldPresenter.ts`
- HUD presenter: `src/game/presenter/hudPresenter.ts`
- overlay presenter: `src/game/presenter/overlayPresenter.ts`

責務:

- gameplay state を UI / Phaser 向け view model に変換する
- score feed、record 状態、preview focus、warning level は presenter で正規化する
- React / Phaser は表示側の加工ロジックを極力持たない

Phaser world 描画は renderer 分割済みです。

- bricks
- paddle / player ball
- enemy shot
- boss
- hazard
- item
- cue overlay
- arena frame

敵弾と player ball の識別は renderer 層で固定します。

## Start Settings / Public UX

shipped 開始設定の単一定義は `src/game/startSettingsSchema.ts` です。

公開する設定:

- `difficulty`
- `reducedMotionEnabled`
- `highContrastEnabled`
- `bgmEnabled`
- `sfxEnabled`

開始画面は browser-first campaign の導線だけを持ち、debug 設定は shipped UI に含めません。

## Persistence

保存は `src/game/metaProgress.ts` が担当し、次の 2 系統に分けます。

- `progression`
  - `threatTier2Unlocked`
- `records`
  - `overallBestScore`
  - `tier1BestScore`
  - `tier2BestScore`
  - `latestRunScore`

旧 `meta_progress` save からの migration は維持します。

## ドキュメント運用ルール

- 公開仕様: `README.md`
- 実装設計: `docs/architecture.md`
- ツールチェーン: `docs/toolchain.md`
- 開発運用ルール: `AGENTS.md`
- 開始設定 schema: `src/game/startSettingsSchema.ts`
- run / encounter 定義: `src/game/content/runDefinition.ts` と `src/game/content/encounters.ts`
- module catalog: `src/game/content/modules.ts`
- 保存: `src/game/metaProgress.ts`
- runtime state contract: `src/game/runtimeTypes.ts`

この文書には「現行実装」を書き、将来構想は載せません。

## 追加時の手順

### 新しい encounter

1. `src/game/content/encounters.ts` に定義を追加する
2. 必要なら `src/game/content/runDefinition.ts` に順序を反映する
3. 低レベル盤面は `src/game/config/stages.ts` に追加する
4. 必要な warning / cue / presenter 出力を更新する
5. README では shipped 仕様が変わる場合のみ更新する

### 新しい module / pickup / active skill

1. `src/game/domainTypes.ts` に型を追加する
2. `src/game/itemRegistry.ts` と `src/game/itemSystem.ts` に低レベル仕様を追加する
3. `src/game/content/modules.ts` で `core / tactical / active` の分類を更新する
4. presenter と HUD / Shop 表示を同期更新する
5. tests と docs を更新する

### 新しい描画要素

1. `src/game/renderTypes.ts` と presenter を更新する
2. Phaser 側は `src/phaser/render/layers/renderers/*` に追加する
3. art asset が必要なら `src/art/visualAssets.ts` を更新する

## 品質ゲート

- `vp check`
- `vp test`
- `vp run typecheck`
- `vp run deadcode:report`
- `vp run check:arch`
- `vp run guard:test-state-shape`
- `vp run e2e`

## Open Backlog

- 現時点で、この文書に追記すべき既知の runtime backlog はありません。
