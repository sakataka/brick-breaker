# Architecture

## 目的
- 今後の機能追加を「最小変更で安全に」行うための責務分離を定義する。

## モジュール責務
- `src/game/Game.ts`
  - オーケストレータ。入力/ライフサイクル/シーン遷移/フレーム進行の接続のみ。
- `src/game/gamePipeline.ts`
  - playing 中の 1 tick 処理順序を実行。
  - `Input -> Assist/Paddle -> Physics -> Combo/Score -> Event/VFX -> Drop/Pickup -> BallCount`。
- `src/game/gameRuntime.ts`
  - 固定ステップループ実行、ball loss / stage clear の適用補助。
- `src/game/roundSystem.ts`
  - ステージ進行/再挑戦/初期化を管理。
  - ステージクリア時は `items.active` のみ持ち越し、`falling` は破棄。
  - ステージ評価（星1〜3）を算出して `stageStats` に保存。
- `src/game/physicsCore.ts`
  - 物理コア（純関数寄り）。壁/バー/ブロック/貫通/爆発の計算。
  - `durable`/`armored` の耐久・爆発耐性を処理。
- `src/game/physicsApply.ts`
  - 複数球への物理適用集約。
- `src/game/itemRegistry.ts`
  - アイテム定義レジストリ（重み/表示/取得効果）。
  - 追加時は原則ここを編集。
- `src/game/itemSystem.ts`
  - ドロップ生成、落下更新、レジストリ適用、多球数調整。
- `src/game/renderPresenter.ts`
  - `GameState` を `RenderViewState` / `HudViewModel` / `OverlayViewModel` に変換。
  - ステージ帯テーマ、コンボ表示、リザルト表示用モデルを構築。
- `src/game/renderer.ts`
  - Canvas 描画専任。状態解釈は持たない。
  - 1〜4 / 5〜8 / 9〜12 面のテーマ帯を描画へ反映。
- `src/game/config.ts` + `src/game/configSchema.ts`
  - 設定定義と起動時検証（zod）。

## データフロー
1. `Game.loop` がフレーム時間差分を算出。
2. `gameRuntime.runPlayingLoop` が fixed step を実行。
3. 各 step で `gamePipeline.stepPlayingPipeline` がゲーム状態を更新。
4. `renderPresenter` が表示用 ViewModel を生成。
5. `renderer` / HUD / overlay が ViewModel を描画。

## 重要仕様（アイテム）
- 1球でも落下したフレームで全アイテム効果を解除。
- ステージクリア時はアクティブ効果のみ次ステージへ持ち越し。
- 多球上限は4球固定、持ち越した `multiball` は次ステージ開始球数にも反映。

## 重要仕様（進行）
- コンボ倍率は 1.8 秒窓で上昇し、落球時に即リセット。
- ステージ評価は `時間 + 被弾 + 残機` の合計点で星1〜3を判定。
- エリートブロックは 9〜12 面のみ配置（`durable`, `armored`）。

## 拡張ポイント
- 新アイテム追加:
  - `src/game/domainTypes.ts` に `ItemType` を追加。
  - `src/game/config.ts` の `ITEM_CONFIG` に重み・ラベルを追加。
  - `src/game/itemRegistry.ts` に `ItemDefinition` を追加。
- 物理ルール追加:
  - `src/game/physicsTypes.ts` に入力/イベント型追加。
  - `src/game/physicsCore.ts` に計算追加。
  - 必要なら `src/game/gamePipeline.ts` で注入値を設定。
- 描画追加:
  - `src/game/renderTypes.ts` に描画入力を追加。
  - `src/game/renderPresenter.ts` と `src/game/renderer.ts` を順に更新。

## 禁止事項
- `Game.ts` に新規ロジックを集中させない。
- 新アイテム追加時に `if/switch` を複数ファイルへ分散追加しない（レジストリ優先）。
- `renderer.ts` でゲーム進行判定を行わない。
- 設定追加時に検証（`configSchema`）を省略しない。

## 品質ゲート
- 必須: `bun run check`
- 必須: `bun test`
