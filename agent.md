# Agent Notes (Brick Breaker)

## プロジェクト概要
- ローカル実行の Web ブロック崩し（Bun + Vite + TypeScript + Canvas）
- 操作はマウス中心
- 12ステージキャンペーン + アイテムスタック（6種）

## 実行コマンド
- 開発: `bun run dev`
- ビルド: `bun run build`
- 型チェック: `bun run typecheck`
- 品質ゲート: `bun run check`
- テスト: `bun test`

## 現行アーキテクチャ
- `src/game/Game.ts`
  - オーケストレータ専用（入力/loop/scene連携）。
- `src/game/gamePipeline.ts`
  - playing tick の処理順序を管理。
- `src/game/gameRuntime.ts`
  - fixed-step ループと stage clear / life loss の適用。
- `src/game/itemRegistry.ts`
  - アイテム定義駆動（新アイテム拡張の主入口）。
- `src/game/physicsCore.ts`
  - 物理コア（純関数寄り）。
- `src/game/renderPresenter.ts`
  - `GameState` -> `RenderViewState/HudViewModel/OverlayViewModel` 変換。
- `src/game/renderer.ts`
  - 描画専任。

## 変更時の優先ルール
1. 新アイテムは `itemRegistry` を先に編集する。
2. 物理ルールは `physicsCore` に集約する。
3. `Game.ts` に新規ロジックを直接積み増ししない。
4. 設定追加時は `configSchema` に検証を追加する。
5. 変更後は `bun run check && bun test` を必ず通す。

## 参照ドキュメント
- `docs/architecture.md`
- `docs/refactor-roadmap.md`

## Git 運用メモ
- リポジトリ: `https://github.com/sakataka/brick-breaker`
- 既定ブランチ: `main`
- 変更は小さく分割し、テスト通過後にコミットする。
