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
  - `paddle_plus`: パドル幅 `x1.28`（12秒）
  - `slow_ball`: 速度上限 `x0.82` + 取得直後速度 `x0.9`（10秒）
  - `multiball`: 2球化（12秒）
  - `shield`: 画面下バリア1回（14秒）
- 同種再取得は効果量を増やさず、時間のみ延長（+基本時間の75%、上限24秒）

## 主要モジュール

- `src/game/Game.ts`: ループ・進行・入力・遷移のオーケストレーション
- `src/game/roundSystem.ts`: ステージ進行と再挑戦
- `src/game/itemSystem.ts`: ドロップ・取得・効果時間管理
- `src/game/sceneMachine.ts`: Scene遷移（xstate）
- `src/game/physics.ts`: 衝突と反射
- `src/game/renderer.ts`: Canvas描画
- `src/ui/overlay.ts`: シーン別オーバーレイ文言

## 補足

- 高解像度表示（高DPR）対応
- `prefers-reduced-motion` 対応（演出抑制）
- Bun 前提運用（`bun run dev/build/test`）
