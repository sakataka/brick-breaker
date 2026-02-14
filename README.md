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

## 開始前設定

- タイトル画面でマウス操作による設定が可能
  - 難易度: `カジュアル / スタンダード / ハード`
  - 初期残機: `1..6`
  - 速度: `75% / 100% / 125%`
- 速度設定は「初速 / 最高速」にのみ反映
- 設定はセッション内のみ（永続保存なし）

## キャンペーン仕様

- 12ステージの直線キャンペーン
- ステージクリア時は `STAGE CLEAR` オーバーレイを表示し、次ステージへ進行
- 最終ステージ（12面）クリアでキャンペーン結果一覧を表示
- ライフが尽きると同ステージ再挑戦（スコアはそのステージ開始時に巻き戻し）
- ステージクリア時に星評価（★1〜★3）を表示
- 9〜12面にはエリートブロック（`durable`/`armored`）を配置
- 1〜4 / 5〜8 / 9〜12 面でテーマ帯を切り替え
- ステージクリア時に残機は回復せず、そのまま次ステージへ持ち越し

## スコア仕様

- ブロック破壊の基本点は `100`
- コンボ時間窓は `1.8s`
- 連続破壊で倍率 `+0.25`（`x1.0` 開始、上限 `x3.0`）
- 落球が発生したフレームでコンボは即リセット

## アイテム仕様（落下取得）

- ブロック破壊時 `18%` でドロップ判定
- 同時落下上限 `3`
- 種類:
  - `paddle_plus`: パドル幅スタック増加（`1 + 0.18 * stacks`）
  - `slow_ball`: 速度上限を段階低下（`max(0.35, 0.82^stacks)`）+ 取得直後に減速
  - `multiball`: スタックで目標球数増加（最大4球）
  - `shield`: チャージを加算（ミス時に1消費）
  - `pierce`: 1スタックごとに +4 枚貫通
  - `bomb`: 直撃時に範囲破壊（所持上限1）
- 効果持続は時間制ではなく、ステージクリア後も次ステージへ持ち越し
- すべてのボールを落としてライフが減るタイミングで全アイテム効果を解除
- 一部のボールを落としても残ったボールで続行し、自動で多球補充はしない
- ステージ遷移時は落下中アイテムを破棄し、アクティブ効果のみを保持
- `multiball` 持ち越し時は次ステージ開始球数にも反映（上限4球）
- 同種取得は上書きではなくスタック加算
- `bomb` は所持中に再ドロップしない（全ボール喪失で解除後に再び出現）

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

## 現在の開発状況

- 責務分離リファクタを適用済み（`gamePipeline`/`physicsCore`/`itemRegistry`/`renderPresenter`）
- ライブラリは最新系へ更新済み（Vite 7 / Biome 2 / XState 5）
- 品質ゲートは `bun run check` と `bun test` を運用

## 設計ドキュメント

- `docs/architecture.md`
- `docs/refactor-roadmap.md`
- `docs/ui-improvement-ideas.md`
- `PLAN.md`
- `refactor-plan.md`

## 残タスク（概要）

- 色覚多様性テーマ / UIアクセシビリティ拡張
- ステージ評価のセッション履歴表示
- Web公開向け導線（紹介文・共有素材・デプロイ手順）

詳細は `PLAN.md`, `refactor-plan.md`, `docs/ui-improvement-ideas.md` を参照。

## 補足

- 高解像度表示（高DPR）対応
- `prefers-reduced-motion` 対応（演出抑制）
- Bun 前提運用（`bun run dev/build/test`）
