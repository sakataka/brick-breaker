# Refactor Roadmap

## 旧構成からの移行マッピング
- `Game.ts`
  - 旧: ループ/進行/物理注入/アイテム/VFX/HUD/描画を集中管理。
  - 新: オーケストレータ専用。処理は `gamePipeline`/`gameRuntime`/`gameUi` に委譲。
- `physics.ts`
  - 旧: 物理本体を保持。
  - 新: 互換ラッパー。実体は `physicsCore.ts`。
- `itemSystem.ts`
  - 旧: 効果計算・分岐中心。
  - 新: `itemRegistry.ts` を利用した定義駆動。
- `renderer.ts`
  - 旧: 状態判定 + 描画。
  - 新: 描画専任。判定は `renderPresenter.ts`。

## 変更理由
- 機能追加時に変更箇所を絞るため。
- 物理・描画・アイテムを独立テスト可能にするため。
- 回帰バグ時の切り分け速度を上げるため。

## 変更履歴ポリシー
- 変更は「型/基盤」「ロジック」「表示」「ドキュメント」で可能な限り分割コミット。
- 新規機能は必ずテストと docs 更新を同コミットに含める。

## 回帰チェックリスト
1. 起動直後にキャンバス描画が見える。
2. start/pause/resume/gameover/clear/error 遷移が成立。
3. stage clear -> 次ステージ進行、最終面で clear。
4. ライフ喪失時の同面再挑戦とスコア巻き戻し。
5. アイテム取得（6種）とスタック反映。
6. 貫通/爆発/多球/シールドの同時動作。
7. 4K 相当表示でも入力追従と描画品質が維持。

## 今後の拡張手順
1. 仕様を `domainTypes` / `runtimeTypes` / `renderTypes` に先に反映。
2. ルール追加は `itemRegistry` または `physicsCore` に集約。
3. `gamePipeline` に注入値と適用順を追加。
4. `renderPresenter` / `renderer` へ表示反映。
5. テスト追加（unit + pipeline）。
6. `bun run check && bun test` を通してから docs 更新。
