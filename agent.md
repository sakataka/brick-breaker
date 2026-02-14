# Agent Notes (Brick Breaker)

## プロジェクト概要
- Bun + Vite + TypeScript + Canvas のローカル用ブロック崩し
- 12ステージキャンペーン、6種アイテム、コンボ、星評価、BGM/SE
- 開始前設定（難易度/残機/速度/マルチ上限/音設定）あり
- A11y は自動適用（reduced-motion / high-contrast）

## 実行コマンド
- 開発: `bun run dev`
- ビルド: `bun run build`
- 品質ゲート: `bun run check`
- ユニット/統合: `bun test`
- e2e: `bun run e2e`

## 設計ルール
1. アイテム仕様は `src/game/itemRegistry.ts` を正本とする。
2. 設定値は `src/game/config/*` に追加し、`configSchema` 検証を通す。
3. 描画追加は `renderPresenter` と `renderer/layers/*` をセットで更新する。
4. `Game.ts` にゲームロジックを直接積み増ししない（systemへ移す）。
5. 変更後は `bun run check && bun test && bun run e2e` を実行する。

## 正本ドキュメント
- `/Users/sakataka/youtube_speech/ブロック崩し/Brick Breaker/README.md`
- `/Users/sakataka/youtube_speech/ブロック崩し/Brick Breaker/docs/architecture.md`

未完了タスクは `docs/architecture.md` の `Open Backlog` のみ参照。
