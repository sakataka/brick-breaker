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

現在のバランスは `src/game/config.ts` の `GAME_CONFIG` / `GAME_BALANCE` で一元管理しています。

- 画面サイズ: `960x540`
- 初速: `300 px/s`
- 最大速: `600 px/s`
- ブロック衝突時速度上昇: `+2`
- パドル幅: `130`
- パドル高さ: `16`
- 1ブロック得点: `100`
- 残ライフボーナス: `500 / ライフ`

値を変更する場合は、`GAME_CONFIG` と `GAME_BALANCE` を編集してください。`physics.ts` と `Game.ts` は値参照を共通化済みです。

## レベル構成と描画

- ブロック配置: `src/game/level.ts` の `buildBricks(layout)`
- レイアウト定数: `src/game/config.ts` の `BRICK_LAYOUT`
- レンダー設定: `src/game/renderer.ts` の `DEFAULT_RENDER_THEME`

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
