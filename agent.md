# Agent Notes (Brick Breaker)

このファイルは、このプロジェクトで今後の開発を進める際に、エージェントや人間開発者が参照する運用ガイドです。

## 1) プロジェクト概要
- プロジェクト名: Brick Breaker
- 目的: PC向けローカルWeb版ブロック崩し
- 技術構成:
  - TypeScript
  - Vite
  - Bun
  - HTML5 Canvas
- 実装済みの主ファイル:
  - `index.html`
  - `src/main.ts`
  - `src/styles.css`
  - `src/game/Game.ts`
  - `src/game/physics.ts`
  - `src/game/level.ts`
  - `src/game/config.ts`
  - `src/game/renderer.ts`
  - `src/game/input.ts`
  - `src/game/types.ts`
  - `src/ui/overlay.ts`
  - `src/audio/sfx.ts`
  - `src/util/dom.ts`
  - `PLAN.md`

## 2) 実行コマンド
- 開発サーバ起動: `bun run dev`
- 本番ビルド: `bun run build`
- プレビュー: `bun run preview`
- 依存関係: `bun install`

## 3) コードの基本方針（仕様）
- マウス移動でパドルを操作
- 物理更新は固定タイムステップ
- 1ステージ（初期版）
- 3ライフ制
- 開始/一時停止/ゲームオーバー/クリアのUI状態を実装

## 4) 変更時の優先ルール
- `PLAN.md` を変更対象範囲の基準として優先参照
- 物理挙動（衝突・速度処理）は慎重に変更し、`src/game/physics.ts` を最優先で確認
- UI変更は `src/game/renderer.ts` / `src/styles.css` を主体にし、状態管理は `src/game/Game.ts` に集約
- 共通設定は `src/game/config.ts` にまとめる
- DOM取得は `src/util/dom.ts` を経由して欠損を明示

## 5) Git運用（このプロジェクト固有）
- コミット運用: `main` と `codex/` 系ブランチを使用
- 有効ブランチ: `codex/brick-breaker-initial-web`
- リモート先: `https://github.com/sakataka/brick-breaker.git`
- 例: 
  - `git add -A`
  - `git commit -m "Your message"`
  - `git push https://github.com/sakataka/brick-breaker.git <branch>`

## 6) 今後の拡張候補（優先度順）
1. 難易度設定（複数速度/速度上昇ルール）
2. パワーアップ追加
3. サウンド素材の差し替え（現状はWeb Audio合成音）
4. ステージ追加機能

## 7) 注意事項
- 環境依存で `.git/config` 更新が制限される場合があるため、リモート追加は `git remote add` よりも `git push https://github.com/...` を優先
