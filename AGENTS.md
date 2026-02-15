# AGENTS.md

このファイルは、`Brick Breaker` リポジトリで作業するエージェント向けの運用ガイドです。  
目的は「機能追加しやすく、誤修正を減らし、ドキュメントと実装の乖離を防ぐ」ことです。

## 基本原則
- シンプルさを優先する（`YAGNI` / `KISS` / `DRY`）。
- 複雑性を増やす後方互換用の shim や fallback は、コストゼロで入れられる場合を除き追加しない。

## 1. プロジェクト概要
- 構成: `Bun + Vite + TypeScript`
- ゲーム実行: `Phaser`（描画/入力）
- UI: `React + Zustand`
- サウンド: `Tone/WebAudio`
- 仕様: 12ステージキャンペーン、アイテム、コンボ、評価、開始前設定、デバッグモード

## 2. 必ず参照する場所
- 利用者向け仕様: `README.md`
- 実装者向け設計: `docs/architecture.md`
- 未完了タスク管理: `docs/architecture.md` の `Open Backlog`

## 3. アーキテクチャ責務
- Coreロジック: `src/core/*`, `src/game/gamePipeline.ts`, `src/game/physicsCore.ts`, `src/game/itemSystem.ts`, `src/game/roundSystem.ts`
- Orchestrator: `src/game/GameSession.ts`, `src/game/Game.ts`
- 描画Host: `src/phaser/*`
- UI: `src/app/*`
- Audio: `src/audio/*`

ルール:
1. ゲームルールを UI コンポーネントへ直接書かない。
2. Core は DOM / Phaser / Audio API を直接触らない。
3. 仕様分岐はできるだけ `itemRegistry` / `config` / presenter に寄せる。

## 4. 実装ガイドライン
1. 破壊的変更を避け、既存フロー（start -> playing -> stageclear -> clear / gameover）を維持する。
2. 追加仕様は「型 -> ロジック -> 表示 -> テスト -> ドキュメント」の順で反映する。
3. 絶対パス記述をドキュメントに残さない（相対パスを使う）。
4. 新しい設定値は `src/game/config/*` に追加し、必要な検証とテストを揃える。
5. 新アイテム追加時は `src/game/itemRegistry.ts` を仕様の参照元として更新する。
6. ショップ仕様は「1ステージ1回の2択購入」を維持し、無料交換（リロール）は追加しない。

## 5. 変更時のチェックリスト
1. 型定義更新（必要な場合）
2. ロジック反映（Core/System）
3. UI反映（React/Phaser）
4. サウンド反映（必要な場合）
5. テスト追加・更新
6. ドキュメント更新（`README.md`, `docs/architecture.md`）

## 6. 品質ゲート（必須）
```bash
bun run check
bun test
bun run e2e
```

## 7. デバッグモード関連ルール
- デフォルトは `OFF`。
- デバッグ設定は開始画面でのみ変更可能。
- 通常モードの体験を変えない。
- `debugRecordResults=false` の場合は結果を保存しない（DEBUG識別を維持）。

## 8. UI/UXルール（開始画面）
- 開始画面は「ヘッダー / 設定スクロール / 固定フッター（開始CTA）」を維持する。
- 設定が増えても開始ボタンが常時操作可能であること。
- デバッグ設定は通常設定と視覚分離すること。

## 9. コミット運用
- 変更は機能単位でまとめる。
- コミットメッセージは「何を変えたか」を明確にする。
- コミット前に最低限 `bun run check` と `bun test` を通す（可能なら `bun run e2e` まで実施）。
