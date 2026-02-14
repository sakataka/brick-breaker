# Refactor Roadmap（残タスク）

最終更新: 2026-02-14

## 現在の構成
- `Game` はオーケストレータ化済み
- `physicsCore` / `itemRegistry` / `renderPresenter` 分離済み
- `sceneMachine` による遷移管理導入済み
- `bun run check` + `bun test` 運用を継続

## 残タスク（未完了のみ）
1. パイプライン統合テストの拡張
   - `stageclear -> advanceStage -> playing` の連続動作検証
   - 落球によるアイテム全解除と持ち越し仕様の同時検証
2. パフォーマンス監視ポイントの整理
   - 多球時の描画・物理負荷の閾値を明示
   - デバッグ用メトリクスの表示手段を決定
3. 回帰検証の自動化
   - 手動チェック項目をテスト化（主要シーン遷移）
   - CIでの定常実行対象を明確化
4. 仕様変更時の追従ルール整備
   - `README` / `architecture` / `agent.md` の同時更新をルール化
   - 変更時に「完了タスクを残さない」運用を固定

## 変更時の固定手順
1. 実装変更
2. `bun run check`
3. `bun test`
4. ドキュメント更新（残タスクの整理）
5. コミット・プッシュ
