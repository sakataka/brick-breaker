# Brick Breaker 機能リスト（Cycle 02）

## 目的と評価軸

- 目的: アイテム追加に限定せず、戦闘体験そのものを拡張する。
- 評価軸: `ゲーム性インパクト` を最優先し、次に既存ルールとの整合と回帰リスクで評価する。
- 進捗の管理先: `docs/idea-progress.md`

## 実装状況サマリ（2026-02-14）

- 対象: `BB-FEAT-01` 〜 `BB-FEAT-04`
- 状態: 全件 `DONE`

## BB-FEAT-01: オートレーザー

- ID: `BB-FEAT-01`
- 体験価値: 停滞しやすい局面でも攻撃が継続し、テンポが落ちにくい。
- 仕様:
  - 新アイテム `laser` を追加。
  - レベル1は `1.20s`、レベル2は `0.72s` 間隔で自動発射。
  - 弾速 `760 px/s`、1ヒットで消滅、命中時はブロックへ `1ダメージ`。
  - 全ボール喪失時に解除（既存厳しめルールに準拠）。
- 実装対象モジュール:
  - `src/game/itemRegistry.ts`
  - `src/game/itemSystem.ts`
  - `src/game/gamePipeline.ts`
  - `src/phaser/render/PhaserRenderPort.ts`
  - `src/audio/sfx.ts`
- 実装難易度: `M`
- 回帰リスク: 物理イベント増加によるスコア/VFX連携への影響。
- 優先度: `P1`
- 実装状況: `DONE`
- 参考ソース: [Breakout: Recharged](https://atari.com/products/breakout-recharged)

## BB-FEAT-02: スティッキーパドル

- ID: `BB-FEAT-02`
- 体験価値: 反射の運要素を抑え、立て直しチャンスを増やす。
- 仕様:
  - 新アイテム `sticky` を追加（`maxStacks=1`）。
  - 捕捉時は `0.55s` 保持して自動リリース。
  - 再捕捉クールダウン `1.20s`。
- 実装対象モジュール:
  - `src/game/physicsCore.ts`
  - `src/game/physicsTypes.ts`
  - `src/game/itemRegistry.ts`
  - `src/game/itemSystem.ts`
- 実装難易度: `M`
- 回帰リスク: パドル衝突ロジック変更による既存跳ね返り挙動への影響。
- 優先度: `P1`
- 実装状況: `DONE`
- 参考ソース: [Arkanoid Powerups](https://strategywiki.org/wiki/Arkanoid/Powerups)

## BB-FEAT-03: フラックスフィールド

- ID: `BB-FEAT-03`
- 体験価値: 後半ステージの球道読み合いを増やし、攻略感を強化する。
- 仕様:
  - 新 `StageModifier.fluxField` を追加。
  - パドル中心半径 `180px` 内で、下降時は吸引・上昇時は反発。
  - 速度付与は安全クランプ付きで制御。
  - 適用ステージは 9〜11面。
- 実装対象モジュール:
  - `src/game/config/stages.ts`
  - `src/game/physicsCore.ts`
  - `src/game/gamePipeline.ts`
  - `src/game/renderPresenter.ts`
  - `src/phaser/render/PhaserRenderPort.ts`
- 実装難易度: `M`
- 回帰リスク: 軌道制御の追加による難易度変化。
- 優先度: `P1`
- 実装状況: `DONE`
- 参考ソース: [Shatter](https://store.steampowered.com/app/20820/Shatter/)

## BB-FEAT-04: シールドバースト

- ID: `BB-FEAT-04`
- 体験価値: 防御アイテムに反撃価値を持たせ、取得優先度を上げる。
- 仕様:
  - シールド救済成立時にバースト発動。
  - VFXリング + 専用SEを再生。
  - 画面下寄りの最近傍ブロック最大2個に `1ダメージ`。
  - 生存ボールを上向き `minUpSpeed=260` へ補正（既存上限内）。
- 実装対象モジュール:
  - `src/game/gameRuntime.ts`
  - `src/game/gamePipeline.ts`
  - `src/audio/sfx.ts`
  - `src/game/vfxSystem.ts`
- 実装難易度: `M`
- 回帰リスク: 救済時の副作用追加によるステージ難易度変化。
- 優先度: `P1`
- 実装状況: `DONE`
- 参考ソース: [Breakout: Recharged](https://atari.com/products/breakout-recharged)
