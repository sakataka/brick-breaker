# Agent Notes (Brick Breaker)

このファイルは、このプロジェクトで今後の開発を進める際に、エージェントや人間開発者が参照する運用ガイドです。

## 1) プロジェクト概要
- プロジェクト名: Brick Breaker
- 目的: PC向けローカルWeb版ブロック崩し
- 技術構成:
  - TypeScript
  - Vite
  - HTML5 Canvas
- 実装済みの主ファイル:
  - `index.html`
  - `src/main.ts`
  - `src/styles.css`
  - `src/game/Game.ts`
  - `src/game/physics.ts`
  - `src/game/level.ts`
  - `src/game/types.ts`
  - `src/ui/overlay.ts`
  - `src/audio/sfx.ts`
  - `PLAN.md`

## 2) 実行コマンド
- 開発サーバ起動: `npm run dev`
- 本番ビルド: `npm run build`
- プレビュー: `npm run preview`
- 依存関係: `npm install`

## 3) コードの基本方針（これまでの仕様）
- マウス移動でパドルを操作
- 物理更新は固定タイムステップ
- 1ステージ（初期版）
- 3ライフ制
- 開始/一時停止/ゲームオーバー/クリアのUI状態を実装

## 4) 変更時の優先ルール
- `PLAN.md` を変更対象範囲の基準として優先参照
- 物理挙動（衝突・速度処理）は慎重に変更し、`src/game/physics.ts` を最優先で確認
- UIだけの変更を優先し、ゲーム中断や再開など状態管理は `src/game/Game.ts` で集中管理
- 既存のスタイル・アニメーション方向（ガラスモーフィズム）を維持しつつ、必要最小の差分で改善

## 5) Git運用（このプロジェクト固有）
- コミット運用: `main` と `codex/` 系ブランチを使用
- この実装で有効だったブランチ: `codex/brick-breaker-initial-web`
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
- ネットワークが必要な操作（GitHub認証/Push）は環境で権限確認が必要な場合がある
- この環境では `.git/config` への一部ロック権限で `git remote add` が失敗することがあるため、`git push <url>` 形式での運用が有効
