# Brick Breaker リファクタリング計画（Bun前提）

最終更新: 2026-02-13

## 方針
- 実行環境は Bun を前提 (`bunx`/`bun install`)
- ゲーム性（物理安定性）を崩さない
- ファイル単位で責務を分離し、テストしやすい構成にする

## 0) Bun整備（優先度: 高）
1. `package.json` のスクリプトを Bun 統一にする
   - `dev`: `bunx vite`
   - `build`: `bunx vite build`
   - `preview`: `bunx vite preview`
2. `.gitignore` に環境依存ファイルを追加
   - `node_modules/`
   - `.bun/`
   - `bun.lockb`
3. lockfile/依存手順を明文化
   - 開発用メモ (`agent.md`) に `bun install` / `bun run` を追記

## 1) 設計の再整理（優先度: 高）
### 対象: `src/game/Game.ts`
- 状態遷移（start / paused / gameover / clear）を FSM 化
  - `Scene`, `Transition` を明示した関数に分離
- `startOrResume`, `togglePause`, `handlePhysicsResult` の分岐を簡潔化
- `createInitialState`, `resetRound`, `startPlay`, `serveBall` を独立メソッドに整理

### 対象: `src/game/physics.ts`
- 衝突系を責務別に分割
  - `integratePosition`, `resolveWall`, `resolvePaddle`, `resolveBricks`
- 1フレーム分割更新 (`iterations`) の上限（例: 8回）を追加して暴走防止
- `PhysicsResult` に「どこに当たったか」メタ情報を明示
  - `collision.kind: 'wall' | 'paddle' | 'brick' | 'bottom'`
  - `brickIndex?: number`, `wasCleared: boolean`

## 2) 可読性・保守性改善（優先度: 中）
### 対象: `src/game/renderer.ts`
- 描画設定を `RenderTheme` か `RENDER_STYLE` 定数へ
- `drawBackdrop` / `drawBricks` / `drawPaddle` / `drawBall` の戻り値を `void` 明示し、意図を分離

### 対象: `src/game/level.ts`
- `BRICK_LAYOUT` と `BUILD` ロジックを分離
- `buildBricks` の引数に `BRICK_LAYOUT` を受ける形にして後で難易度切替が効くようにする
- 色付けを行番号だけでなく行列定義に寄せる（テーマ差し替え容易）

### 対象: `src/ui/overlay.ts`
- `querySelector` を `getRequiredElement` で統一（NPE予防）
- 文言定義を `OVERLAY_COPY` 定数へ集約

### 対象: `src/game/input.ts`
- `keydown` 制御は残すが、`Mouse` 中心仕様に合わせて
  - `p`/`space` は操作ショートカットとして分離し、説明を表示
- `PointerEvent` + `touch-action: none` を将来対応のため検討

## 3) 型安全・品質（優先度: 中）
- `GameState` と `Scene` の不変条件を型として明示
  - スコア・残機・経過時間の更新を専用メソッドに閉じる
- 定数の直書き値を `GAME_CONFIG` に寄せる
  - パドル幅/高さ、初期速度、ボーナス等

## 4) テスト・検証（優先度: 中〜高）
- `bun test` で `src/game/physics.ts` の単体テストを追加
  - 壁反射、パドル反射、ブロック衝突、ライフ減算、全消し判定
- `bun run build` が通ることを CI 風チェック
- 起動確認
  - `bunx vite` 起動、`bunx vite build`, `bunx vite preview`

## 5) UI/体感調整（優先度: 低）
- 現在のモダンUI維持しつつ、カード表示/フェードのアクセシビリティ強化
  - `prefers-reduced-motion` 対応
  - キーボードでもボタン到達しやすいフォーカススタイル

## 実施順
1. Bun整備 → 2. `Game.ts` の状態管理分離 → 3. 物理分割 → 4. レンダ/レイアウト定数化 → 5. 物理テスト追加

