# Brick Breaker リファクタ残タスク

最終更新: 2026-02-14

## 現在の到達点
- `Game.ts` はオーケストレータ中心へ縮小済み
- `physicsCore` / `physicsApply` / `itemRegistry` / `renderPresenter` 分離済み
- `configSchema` による設定検証導入済み
- Bun運用と型・lint・build・testゲート整備済み

## 未完了タスクのみ
1. `Game` の責務最終整理
   - `syncSceneUI` を専用ユーティリティへ切り出し完了確認
   - ループ周辺の依存注入ポイントをテストしやすく整理
2. 物理回帰テストの強化
   - 長時間プレイ相当の反復シナリオを追加
   - 多球 + 爆発 + 貫通同時時の境界ケースを拡張
3. レンダラ差分検証
   - reduced-motion時の描画差分をスナップショット化
   - 4K/DPR環境向けの見た目回帰テストを整備
4. CIの最終強化
   - `bun run check` / `bun test` に加え、将来用の軽量e2eを追加
   - 主要シナリオ（start/pause/clear/gameover/error）を自動確認

## 完了判定
- 追加機能の実装時に変更ファイル数が局所化されること
- 回帰検知が unit + integration で再現できること
- ドキュメント更新が実装変更と同時に行われること
