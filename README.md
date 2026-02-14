# Brick Breaker Local

TypeScript + Vite + Canvas で作ったローカル向けブロック崩しです。
マウス操作中心、物理演算ベースで動作します。

## 使い方

```bash
# 依存をインストール
bun install

# 開発サーバ起動
bun run dev

# 本番ビルド
bun run build

# 型チェック（app + test）
bun run typecheck

# lint / build / typecheck をまとめて実行
bun run check

# テスト
bun test
```

## 遊び方

- 左クリック / `Enter` / `Space`: 開始・次ステージ・再開
- `P`: 一時停止 / 再開
- マウス移動: パドルを左右に移動

## キャンペーン仕様

- 12ステージの直線キャンペーン
- ステージクリア時は `STAGE CLEAR` オーバーレイを表示し、次ステージへ進行
- 最終ステージ（12面）クリアで `CLEAR`
- ライフが尽きると同ステージ再挑戦（スコアはそのステージ開始時に巻き戻し）

## アイテム仕様（落下取得）

- ブロック破壊時 `18%` でドロップ判定
- 同時落下上限 `3`
- 種類:
  - `paddle_plus`: パドル幅スタック増加（`1 + 0.18 * stacks`）
  - `slow_ball`: 速度上限を段階低下（`max(0.35, 0.82^stacks)`）+ 取得直後に減速
  - `multiball`: スタックで目標球数増加（最大4球）
  - `shield`: チャージを加算（ミス時に1消費）
  - `pierce`: 1スタックごとに +4 枚貫通
  - `bomb`: 直撃時に範囲破壊（1スタック目3x3、以降拡大）
- 効果持続は時間制ではなく「ステージ中のみ」有効
- ライフ喪失では効果を保持し、ステージ遷移/再挑戦開始時にリセット
- 同種取得は上書きではなくスタック加算

## 主要モジュール

- `src/game/Game.ts`: オーケストレータ（ループ/入力/遷移の接続）
- `src/game/gamePipeline.ts`: playing時の1tick処理順序
- `src/game/gameRuntime.ts`: fixed-step実行と stage clear / life loss 適用
- `src/game/itemRegistry.ts`: アイテム定義レジストリ（追加拡張ポイント）
- `src/game/itemSystem.ts`: ドロップ・取得・スタック・多球調整
- `src/game/physicsCore.ts`: 物理コア（壁/バー/ブロック/貫通/爆発）
- `src/game/physics.ts`: 互換ラッパーAPI
- `src/game/renderPresenter.ts`: 描画/HUD/overlay ViewModel 生成
- `src/game/renderer.ts`: Canvas描画専任
- `src/game/configSchema.ts`: zodによる設定検証

## 設計ドキュメント

- `docs/architecture.md`
- `docs/refactor-roadmap.md`

## 補足

- 高解像度表示（高DPR）対応
- `prefers-reduced-motion` 対応（演出抑制）
- Bun 前提運用（`bun run dev/build/test`）
