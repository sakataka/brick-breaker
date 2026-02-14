# Refactor Roadmap（残タスク）

最終更新: 2026-02-14

## 現在の構成
- `Game` はオーケストレータ化済み
- `physicsCore` / `itemRegistry` / `renderPresenter` 分離済み
- `sceneMachine` による遷移管理導入済み
- `bun run check` + `bun test` 運用を継続
- コンボ/評価/エリート/テーマ帯の回帰テストを追加済み

## 残タスク（未完了のみ）
1. パフォーマンス監視ポイントの整理
   - 多球時の描画・物理負荷の閾値を明示
   - デバッグ用メトリクスの表示手段を決定
2. 回帰検証の自動化（次段）
   - `check/test` に加え軽量e2eを導入
   - 主要シーン（start/pause/clear/gameover/error）のUI遷移を自動確認
3. 仕様変更時の追従ルール整備
   - `README` / `architecture` / `agent.md` の同時更新をルール化
   - 変更時に「完了タスクを残さない」運用を固定

## 変更時の固定手順
1. 実装変更
2. `bun run check`
3. `bun test`
4. ドキュメント更新（残タスクの整理）
5. コミット・プッシュ
