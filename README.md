# Brick Breaker Local

TypeScript + Vite + Canvas で作ったローカル向けブロック崩しです。 
マウス操作のみで遊べ、物理演算ベースの挙動を採用しています。

## 使い方

```bash
# 依存をインストール
bun install

# 開発サーバ起動（ローカル実行）
bun run dev

# 本番ビルド
bun run build

# 型チェック（app + test）
bun run typecheck

# lint/check
bun run lint
bun run check

# ビルド確認サーバ起動
bun run preview

# 物理テスト
bun test
```

## ゲームの遊び方

- 左クリック / キーボード `Enter` / `Space`: 開始・再開
- `P`: 一時停止/再開トグル
- マウス移動: パドル（画面下部バー）を左右に追従

## バランス調整（運用中の値）

現在のバランスは `src/game/config.ts` の `DIFFICULTY_PRESETS` / `GAME_CONFIG` / `GAME_BALANCE` で一元管理しています。
デフォルト難易度は `casual` です。

- 画面サイズ: `960x540`
- 初速: `260 px/s`
- 最大速: `520 px/s`
- ブロック衝突時速度上昇: `+1.2`
- パドル幅: `148`
- パドル高さ: `16`
- アシスト時間: `6.0秒`（ミス後）
- アシスト中パドル倍率: `x1.15`
- アシスト中速度上限倍率: `x0.88`
- 1ブロック得点: `100`
- 残ライフボーナス: `500 / ライフ`

値を変更する場合は `DIFFICULTY_PRESETS` を編集してください。`GAME_CONFIG` と `GAME_BALANCE` は選択中難易度から自動解決されます。

## 安定化対応

- `ResizeObserver` でステージリサイズ時にキャンバス縮尺を再計算
- ゼロサイズ時の最小寸法フォールバック（`320x180`）
- タブ非表示でプレイ中なら自動一時停止
- 例外発生時は `error` オーバーレイを表示し、白画面化を回避

## レベル構成と描画

- ブロック配置: `src/game/level.ts` の `buildBricks(layout)`
- レイアウト定数: `src/game/config.ts` の `BRICK_LAYOUT`
- レンダー設定: `src/game/renderer.ts` の `DEFAULT_RENDER_THEME`
- VFX: ヒットパーティクル / 画面シェイク / 赤フラッシュ / ボール残像

## リファクタリング後の責務

- `src/game/Game.ts`: オーケストレーションとループ
- `src/game/sceneMachine.ts`: Scene 遷移（xstate）
- `src/game/viewport.ts`: 画面フィットと高解像度スケール
- `src/game/vfxSystem.ts`: VFX状態更新・イベント適用
- `src/game/assistSystem.ts`: アシスト有効化と反映
- `src/game/domainTypes.ts`, `src/game/runtimeTypes.ts`: 型定義の分離

## ディレクトリ構成

- `src/main.ts`: エントリ
- `src/game/Game.ts`: ゲーム状態・ループ・シーン管理
- `src/game/physics.ts`: 衝突・反射・速度更新
- `src/game/level.ts`: ブロック生成
- `src/ui/overlay.ts`: オーバーレイUI文言
- `src/audio/sfx.ts`: 効果音合成
- `src/styles.css`: モダンUI/CSS

## 開発メモ

Git はこのリポジトリで `git` 管理しています。Bun 前提で、
`bun run dev` / `bun run build` / `bun test` が標準運用です。
