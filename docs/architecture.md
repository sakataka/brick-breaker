# Architecture

## 目的
- 今後の機能追加を「最小変更で安全に」行うための責務分離を定義する。

## モジュール責務
- `src/game/Game.ts`
  - オーケストレータ。入力/ライフサイクル/シーン遷移/フレーム進行の接続のみ。
  - タイトル画面の開始前設定（難易度/残機/速度/マルチ上限/BGM/SE）を新規開始時に反映。
  - `AudioDirector` とシーン遷移を同期。
- `src/audio/audioDirector.ts`
  - サウンド制御のオーケストレーション。
  - `start/playing/paused/stageclear/clear/gameover` に応じて BGM とジングルを切替。
  - BGM/SE の ON/OFF 設定を適用。
- `src/audio/bgmSequencer.ts`
  - WebAudioでループBGMを再生するステップシーケンサ。
  - lookahead 先読みでノートをスケジューリング。
- `src/audio/bgmCatalog.ts`
  - タイトルBGM + 12ステージBGMのトラック定義。
- `src/audio/sfx.ts`
  - 衝突SE・アイテムSE・シーンジングルの合成再生。
- `src/game/gamePipeline.ts`
  - playing 中の 1 tick 処理順序を実行。
  - `Input -> Assist/Paddle -> Physics -> Combo/Score -> Event/VFX -> Drop/Pickup -> BallCount`。
  - アイテム取得SEを種類別で発火（1フレーム最大2音）。
- `src/game/gameRuntime.ts`
  - 固定ステップループ実行、ball loss / stage clear の適用補助。
- `src/game/roundSystem.ts`
  - ステージ進行/再挑戦/初期化を管理。
  - ステージクリア時は `items.active` のみ持ち越し、`falling` は破棄。
  - ステージ進行時に残機は持ち越し、新規開始/再挑戦時のみ初期残機へリセット。
  - ステージ評価（星1〜3）を算出して `stageStats` に保存。
  - キャンペーン結果履歴（各ステージの最終クリア記録）を更新。
- `src/game/physicsCore.ts`
  - 物理コア（純関数寄り）。壁/バー/ブロック/貫通/爆発の計算。
  - `durable`/`armored` の耐久・爆発耐性を処理。
- `src/game/physicsApply.ts`
  - 複数球への物理適用集約。
- `src/game/itemRegistry.ts`
  - アイテム定義レジストリ（重み/表示/取得効果）。
  - 追加時は原則ここを編集。
  - `bomb` は所持上限1（再取得で加算しない）。
- `src/game/itemSystem.ts`
  - ドロップ生成、落下更新、レジストリ適用、多球数調整。
  - `bomb` / `pierce` 所持中は対応アイテムをドロップ抽選から除外。
- `src/game/renderPresenter.ts`
  - `GameState` を `RenderViewState` / `HudViewModel` / `OverlayViewModel` に変換。
  - ステージ帯テーマ、コンボ表示、リザルト表示用モデルを構築。
  - `clear` シーン向けにキャンペーン結果一覧モデルを構築。
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
6. シーン/ステージ変化時に `AudioDirector` が BGM/ジングルを同期。

## 重要仕様（アイテム）
- すべてのボールを落として `ballloss` になった時のみ全アイテム効果を解除。
- ステージクリア時はアクティブ効果のみ次ステージへ持ち越し。
- 多球上限は開始前設定で選択（デフォルト4）、持ち越した `multiball` は次ステージ開始球数にも反映。
- `bomb` は上限1、所持中はドロップしない。
- `pierce` は上限1（ON/OFF）、所持中はドロップしない。

## 重要仕様（進行）
- コンボ倍率は 1.8 秒窓で上昇し、落球時に即リセット。
- ステージ評価は `時間 + 被弾 + 残機` の合計点で星1〜3を判定。
- エリートブロックは 9〜12 面のみ配置（`durable`, `armored`）。
- 最終ステージクリア後は「タイトルへ戻る」導線付きの結果一覧を表示。

## 重要仕様（サウンド）
- タイトル画面はタイトルBGMをループ再生。
- プレイ中はステージ番号に応じてBGMを切替（12曲）。
- `1-3 / 4-6 / 7-9 / 10-12` の4テーマで音色とリズムを分け、進行体感を強化。
- `start -> playing` は開始ジングルを優先し、その後ステージBGMへ遷移。
- `stageclear` / `clear` / `gameover` は対応ジングルを再生しBGMを停止。
- `paused` はBGMを一時停止し、`playing` 復帰で再開。
- `BGM OFF` はBGMとジングルを停止、`SE OFF` は衝突/アイテムSEのみ停止。

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
