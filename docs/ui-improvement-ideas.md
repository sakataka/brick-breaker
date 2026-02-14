# Brick Breaker UI改善方針（採用判断付き）

このドキュメントは、`UI Brush-up Ideas` を現行コードベースに照らして再評価し、
「採用」「改善して採用」「見送り」を明示した実行方針です。

## 1. 判断基準

- 優先: プレイ中の視認性と手応えの向上
- 制約: 既存の Canvas 2D + Bun/Vite 構成を維持
- 安全性: `prefers-reduced-motion` と低スペック時の破綻回避
- 段階導入: まず低コストで体感差が大きいものを実装

## 2. 現状（実装済み）

- グラスモーフィックHUD
- パーティクル / 画面シェイク / フラッシュ / ボール残像
- 高DPI対応
- シーンオーバーレイ（start/pause/gameover/stageclear/clear/error）
- 12ステージキャンペーン + アイテム4種

## 3. 採用判断一覧

## 3.1 採用（そのまま）

1. `1-A` Hit-stop（Freeze Frames）
2. `10-C` Impact ring（ブロック破壊時）
3. `3-A` Item pickup flash + floating label
4. `4-A` Score pop animation
5. `4-C` Block progress bar
6. `9-C` Ball position indicator

## 3.2 改善して採用

1. `10-A` Bloom/Glow
- 全面適用はしない
- `ball/paddle/falling item` のみに限定
- `reduced-motion` 時は無効化

2. `7-C` Speed-linked trail intensity
- 描画点数を過度に増やさず、色変化を主軸にする
- 最大点数は軽微拡張に留める

3. `3-C` Active effect visual indicators
- フル演出ではなく色/輪郭変化中心
- 既存HUDのテキスト情報を補助する位置づけ

## 3.3 今回は見送り

1. `2-A` Brick shatter fragments（負荷増）
2. `5-A` Stage clear fireworks（演出負荷と実装範囲が大きい）
3. `6-B` Per-stage color theme（設定と描画の差分が広い）
4. `9-A` Color-blind mode（重要だが別タスク化）
5. `4-B` Combo counter（コンボ仕様と整合設計が先）

## 4. 実装スコープ（今回）

1. VFXデータ拡張
- `hitFreezeMs`
- `impactRings[]`
- `floatingTexts[]`

2. ループ統合
- hit-freeze中は物理更新を停止
- freezeはVFX更新側で減衰

3. アイテム取得演出
- 取得地点にリングとラベル
- ラベル寿命・件数上限を制御

4. HUD強化
- スコア増加時の pop アニメーション（CSS）

5. 視認性補助
- 進捗バー（破壊率）
- ボール位置インジケータ（見失い防止）

6. 軽量グロー
- ボール/パドル/アイテムのみ shadowBlur

## 5. reduced-motion / 性能方針

- `prefers-reduced-motion: reduce` 時:
  - hit-stop無効
  - glow無効
  - floating label寿命短縮・生成量抑制
- pool上限
  - impact rings: `<= 10`
  - floating texts: `<= 8`
- 既存の粒子上限管理（220）を維持

## 6. 受け入れ基準

1. 既存プレイ（開始/クリア/ゲームオーバー/再開）が壊れない
2. ブロックヒット時に手応え（freeze + ring）が体感できる
3. アイテム取得時に種類が即時認識できる
4. 高速時・多球時でもボール見失いが減る
5. `bun run check` / `bun test` / `bun run build` が通る

## 7. 次フェーズ候補

- Combo仕様と連動した視覚/音響強化（`2-C`, `8-B`, `4-B`）
- Stage別テーマ（`6-B`）
- Accessibility拡張（`9-A`）
