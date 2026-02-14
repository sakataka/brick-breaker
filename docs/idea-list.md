# Brick Breaker アイディアリスト（実装前提・厳選版）

## 1. 目的と評価軸

- 目的:
  今のコードベースに乗せやすいゲーム性アイディアを厳選し、実装検討の起点を一本化する。
- 評価軸:
  「楽しさインパクト」を最重視し、次に導入しやすさ・回帰リスクの順で判断する。
- 対象:
  アイディア一覧と導入状況の参照。実装進捗は `docs/idea-progress.md` を正本とする。

## 実装状況サマリ（2026-02-14）

- 実装済み: `BB-IDEA-01` 〜 `BB-IDEA-18`
- 未着手: なし

## 実装接続ガイド（共通）

- ルール進行:
  `src/game/gamePipeline.ts`, `src/game/roundSystem.ts`
- 物理/衝突:
  `src/game/physicsCore.ts`, `src/game/physicsApply.ts`
- アイテム仕様:
  `src/game/itemRegistry.ts`, `src/game/itemSystem.ts`
- UI表示:
  `src/game/renderPresenter.ts`, `src/app/components/OverlayRoot.tsx`, `src/app/components/HudPanel.tsx`
- サウンド:
  `src/audio/audioDirector.ts`, `src/audio/sfx.ts`, `src/audio/bgmCatalog.ts`

---

## 2. すぐ実装候補（P1: 01〜08は実装済み）

### BB-IDEA-01
- ID: `BB-IDEA-01`
- アイディア名: ステージ目標ミッション（制限時間 / ノーミス / 指定コンボ）
- 体験価値（何が楽しくなるか）: 同じステージでも遊び方が変わり、達成感が増える。
- 実装対象モジュール: `src/game/roundSystem.ts`, `src/game/gamePipeline.ts`, `src/app/components/OverlayRoot.tsx`
- 実装難易度（S/M/L）: `M`
- 回帰リスク: クリア判定の分岐追加で既存ステージ進行に影響する可能性。
- 優先度（P1/P2/P3）: `P1`
- 実装状況: `DONE`（`docs/idea-progress.md` 参照）
- 参考ソース: [Breakout: Recharged](https://atari.com/products/breakout-recharged)
- 最小導入版: 12面に「時間内クリア」だけを1条件追加し、クリア画面に達成表示を出す。

### BB-IDEA-02
- ID: `BB-IDEA-02`
- アイディア名: エリートブロック派生（耐久回復型 / 分裂型）
- 体験価値（何が楽しくなるか）: 後半面の攻略順が生まれ、単純作業感が減る。
- 実装対象モジュール: `src/game/config/stages.ts`, `src/game/physicsCore.ts`, `src/phaser/render/PhaserRenderPort.ts`
- 実装難易度（S/M/L）: `M`
- 回帰リスク: `Brick` の状態更新ルール変更で衝突テストの更新が必要。
- 優先度（P1/P2/P3）: `P1`
- 実装状況: `DONE`（`docs/idea-progress.md` 参照）
- 参考ソース: [Arkanoid](https://en.wikipedia.org/wiki/Arkanoid)
- 最小導入版: `durable` の亜種を1つだけ追加し、9〜12面の一部に配置。

### BB-IDEA-03
- ID: `BB-IDEA-03`
- アイディア名: 危険ブロック（破壊時デバフ / 放置増殖）
- 体験価値（何が楽しくなるか）: 優先ターゲットが明確になり、緊張感が出る。
- 実装対象モジュール: `src/game/physicsCore.ts`, `src/game/gamePipeline.ts`, `src/phaser/render/PhaserRenderPort.ts`
- 実装難易度（S/M/L）: `M`
- 回帰リスク: ブロック破壊イベントの副作用が増え、スコア計算へ影響しうる。
- 優先度（P1/P2/P3）: `P1`
- 実装状況: `DONE`（`docs/idea-progress.md` 参照）
- 参考ソース: [Shatter (Steam)](https://store.steampowered.com/app/20820/Shatter/)
- 最小導入版: 「破壊時に3秒スロー解除（速度上昇）」の1デバフのみ。

### BB-IDEA-04
- ID: `BB-IDEA-04`
- アイディア名: コンボ報酬ドロップ（一定コンボで確定ドロップ）
- 体験価値（何が楽しくなるか）: コンボを維持する意味が強くなり、プレイが前向きになる。
- 実装対象モジュール: `src/game/comboSystem.ts`, `src/game/gamePipeline.ts`, `src/game/itemSystem.ts`
- 実装難易度（S/M/L）: `S`
- 回帰リスク: ドロップ頻度過多でゲームバランスが崩れる可能性。
- 優先度（P1/P2/P3）: `P1`
- 実装状況: `DONE`（`docs/idea-progress.md` 参照）
- 参考ソース: [Breakout: Recharged](https://atari.com/products/breakout-recharged)
- 最小導入版: `x2.0` 到達時に1回だけ確定ドロップ。

### BB-IDEA-05
- ID: `BB-IDEA-05`
- アイディア名: アイテム融合シナジー（貫通+スロー等）
- 体験価値（何が楽しくなるか）: 組み合わせを狙う楽しさが生まれ、ビルド感が増える。
- 実装対象モジュール: `src/game/itemRegistry.ts`, `src/game/gamePipeline.ts`, `src/game/physicsCore.ts`
- 実装難易度（S/M/L）: `M`
- 回帰リスク: 条件分岐の増加によりアイテム挙動の期待値が読みにくくなる。
- 優先度（P1/P2/P3）: `P1`
- 実装状況: `DONE`（`docs/idea-progress.md` 参照）
- 参考ソース: [Wizorb (Steam)](https://store.steampowered.com/app/207420/Wizorb/)
- 最小導入版: 1組だけ実装（`pierce + slow_ball` で貫通距離+1）。

### BB-IDEA-06
- ID: `BB-IDEA-06`
- アイディア名: ボスステージ拡張（4面ごと）
- 体験価値（何が楽しくなるか）: 節目の盛り上がりが明確になり、進行モチベーションが上がる。
- 実装対象モジュール: `src/game/config/stages.ts`, `src/game/physicsCore.ts`, `src/phaser/render/PhaserRenderPort.ts`, `src/app/components/OverlayRoot.tsx`
- 実装難易度（S/M/L）: `L`
- 回帰リスク: 新しい当たり判定オブジェクトの導入で物理回帰範囲が広い。
- 優先度（P1/P2/P3）: `P1`
- 実装状況: `DONE`（`docs/idea-progress.md` 参照）
- 参考ソース: [Arkanoid](https://en.wikipedia.org/wiki/Arkanoid)
- 最小導入版: 12面のみ簡易ボス（HPゲージ付き単一ターゲット）。

### BB-IDEA-07
- ID: `BB-IDEA-07`
- アイディア名: チャレンジモード（固定シード）
- 体験価値（何が楽しくなるか）: 再現性ある条件でリプレイ・比較がしやすくなる。
- 実装対象モジュール: `src/game/random.ts`, `src/game/Game.ts`, `src/app/components/OverlayRoot.tsx`
- 実装難易度（S/M/L）: `M`
- 回帰リスク: 通常モードと乱数経路を分離しないと既存体験へ混入する。
- 優先度（P1/P2/P3）: `P1`
- 実装状況: `DONE`（`docs/idea-progress.md` 参照）
- 参考ソース: [Breakout (Wikipedia)](https://en.wikipedia.org/wiki/Breakout_%28video_game%29)
- 最小導入版: スタート画面に「チャレンジ」トグルを追加して固定シードを適用。

### BB-IDEA-08
- ID: `BB-IDEA-08`
- アイディア名: デイリーチャレンジ（ローカル日替わり）
- 体験価値（何が楽しくなるか）: 毎日違う課題で短時間プレイの動機が生まれる。
- 実装対象モジュール: `src/game/random.ts`, `src/game/roundSystem.ts`, `src/app/components/OverlayRoot.tsx`
- 実装難易度（S/M/L）: `M`
- 回帰リスク: 日付依存ロジックでテストが不安定になる可能性。
- 優先度（P1/P2/P3）: `P1`
- 実装状況: `DONE`（`docs/idea-progress.md` 参照）
- 参考ソース: [Breakout: Recharged](https://atari.com/products/breakout-recharged)
- 最小導入版: 1日1シード+1目標（例: ノーミス）だけを表示。

---

## 3. 次点候補（P2）

### BB-IDEA-09
- ID: `BB-IDEA-09`
- アイディア名: 分岐ステージ選択（2ルート）
- 体験価値（何が楽しくなるか）: 自分で進行を選ぶ感覚が生まれ、周回価値が上がる。
- 実装対象モジュール: `src/game/roundSystem.ts`, `src/game/config/stages.ts`, `src/app/components/OverlayRoot.tsx`
- 実装難易度（S/M/L）: `M`
- 回帰リスク: キャンペーン履歴/表示の整合更新が必要。
- 優先度（P1/P2/P3）: `P2`
- 実装状況: `DONE`（`docs/idea-progress.md` 参照）
- 参考ソース: [Brickorium (Steam)](https://store.steampowered.com/app/2955960/Brickorium/)
- 最小導入版: 4面クリア時のみ `A/B` どちらか選択。

### BB-IDEA-10
- ID: `BB-IDEA-10`
- アイディア名: フィールドギミック（ワープ / 重力帯 / 可動壁）
- 体験価値（何が楽しくなるか）: 球道を読む楽しさが増え、単調さを抑えられる。
- 実装対象モジュール: `src/game/physicsCore.ts`, `src/game/config/stages.ts`, `src/phaser/render/PhaserRenderPort.ts`
- 実装難易度（S/M/L）: `L`
- 回帰リスク: 物理の分岐増加で衝突バグが入りやすい。
- 優先度（P1/P2/P3）: `P2`
- 実装状況: `DONE`（`docs/idea-progress.md` 参照）
- 参考ソース: [Shatter (Steam)](https://store.steampowered.com/app/20820/Shatter/)
- 最小導入版: ワープゾーン1種類のみ。

### BB-IDEA-11
- ID: `BB-IDEA-11`
- アイディア名: 敵ユニット導入（浮遊敵）
- 体験価値（何が楽しくなるか）: 「避ける/狙う」の判断が増え、アクション性が上がる。
- 実装対象モジュール: `src/game/gamePipeline.ts`, `src/game/physicsCore.ts`, `src/phaser/render/PhaserRenderPort.ts`
- 実装難易度（S/M/L）: `L`
- 回帰リスク: 新エンティティ更新で tick 負荷とロジック複雑度が上がる。
- 優先度（P1/P2/P3）: `P2`
- 実装状況: `DONE`（`docs/idea-progress.md` 参照）
- 参考ソース: [Arkanoid](https://en.wikipedia.org/wiki/Arkanoid)
- 最小導入版: 1種の低速敵のみ実装。

### BB-IDEA-12
- ID: `BB-IDEA-12`
- アイディア名: スコア倍率のリスク選択（高倍率 / 高危険）
- 体験価値（何が楽しくなるか）: プレイヤーが難易度を能動的に選び、緊張感が増す。
- 実装対象モジュール: `src/game/comboSystem.ts`, `src/game/gamePipeline.ts`, `src/app/components/HudPanel.tsx`
- 実装難易度（S/M/L）: `M`
- 回帰リスク: ハイスコア比較時の公平性ルールが必要。
- 優先度（P1/P2/P3）: `P2`
- 実装状況: `DONE`（`docs/idea-progress.md` 参照）
- 参考ソース: [Breakout: Recharged](https://atari.com/products/breakout-recharged)
- 最小導入版: ラウンド開始時に倍率モードを1つ選択するだけに限定。

### BB-IDEA-13
- ID: `BB-IDEA-13`
- アイディア名: ラウンド中ショップ（1回だけ強化購入）
- 体験価値（何が楽しくなるか）: スコアの使い道ができ、プレイ方針が分かれる。
- 実装対象モジュール: `src/game/roundSystem.ts`, `src/app/components/OverlayRoot.tsx`, `src/game/itemRegistry.ts`
- 実装難易度（S/M/L）: `M`
- 回帰リスク: ポーズ/進行との競合で状態遷移が複雑化する。
- 優先度（P1/P2/P3）: `P2`
- 実装状況: `DONE`（`docs/idea-progress.md` 参照）
- 参考ソース: [Wizorb (MobyGames)](https://www.mobygames.com/game/57770/wizorb/)
- 最小導入版: ステージ中1回、2択の強化購入のみ。

### BB-IDEA-14
- ID: `BB-IDEA-14`
- アイディア名: ステージ修飾子（低重力 / 高速球）
- 体験価値（何が楽しくなるか）: 同じ構成でも体験が変わり、飽きにくくなる。
- 実装対象モジュール: `src/game/config/stages.ts`, `src/game/gamePipeline.ts`, `src/game/physicsCore.ts`
- 実装難易度（S/M/L）: `M`
- 回帰リスク: 難易度の上下が大きく、調整コストがかかる。
- 優先度（P1/P2/P3）: `P2`
- 実装状況: `DONE`（`docs/idea-progress.md` 参照）
- 参考ソース: [Block Shot (Steam)](https://store.steampowered.com/app/4272730/)
- 最小導入版: 2種修飾子のみ（低重力/高速球）。

---

## 4. 実験候補（P3）

### BB-IDEA-15
- ID: `BB-IDEA-15`
- アイディア名: ローグライト進行（ラン内構築）
- 体験価値（何が楽しくなるか）: 毎回異なる育成ルートで長時間遊べる。
- 実装対象モジュール: `src/game/roundSystem.ts`, `src/game/itemRegistry.ts`, `src/app/components/OverlayRoot.tsx`
- 実装難易度（S/M/L）: `L`
- 回帰リスク: 現行の直線キャンペーン仕様と競合しやすい。
- 優先度（P1/P2/P3）: `P3`
- 実装状況: `DONE`（`docs/idea-progress.md` 参照）
- 参考ソース: [Brickorium (Steam)](https://store.steampowered.com/app/2955960/Brickorium/)
- 最小導入版: ラン中に3回だけ永続強化を選べる簡易版。

### BB-IDEA-16
- ID: `BB-IDEA-16`
- アイディア名: 魔法スキルシステム（Wizorb方向）
- 体験価値（何が楽しくなるか）: パドル以外の能動アクションが増え、操作幅が広がる。
- 実装対象モジュール: `src/game/gamePipeline.ts`, `src/phaser/scenes/RuntimeScene.ts`, `src/audio/sfx.ts`, `src/phaser/render/PhaserRenderPort.ts`
- 実装難易度（S/M/L）: `L`
- 回帰リスク: マウス中心操作と入力設計の再調整が必要。
- 優先度（P1/P2/P3）: `P3`
- 実装状況: `DONE`（`docs/idea-progress.md` 参照）
- 参考ソース: [Wizorb (Steam)](https://store.steampowered.com/app/207420/Wizorb/)
- 最小導入版: クールダウン付き単発スキル1種のみ。

### BB-IDEA-17
- ID: `BB-IDEA-17`
- アイディア名: サウンド同期イベント（特定行動でBGM変調）
- 体験価値（何が楽しくなるか）: ハイライト時の没入感が上がる。
- 実装対象モジュール: `src/audio/audioDirector.ts`, `src/audio/toneBgm.ts`, `src/game/comboSystem.ts`
- 実装難易度（S/M/L）: `M`
- 回帰リスク: 音切替が多いと聴感疲労や破綻が起こる可能性。
- 優先度（P1/P2/P3）: `P3`
- 実装状況: `DONE`（`docs/idea-progress.md` 参照）
- 参考ソース: [Shatter (Steam)](https://store.steampowered.com/app/20820/Shatter/)
- 最小導入版: `コンボ x2.5` 以上でフィルイン音を1回追加。

### BB-IDEA-18
- ID: `BB-IDEA-18`
- アイディア名: ストーリー演出ステージ（短いイベント挿入）
- 体験価値（何が楽しくなるか）: ステージ進行に意味づけができ、完走動機が上がる。
- 実装対象モジュール: `src/app/components/OverlayRoot.tsx`, `src/game/roundSystem.ts`, `src/audio/audioDirector.ts`
- 実装難易度（S/M/L）: `M`
- 回帰リスク: テンポ低下で周回プレイに不向きになる可能性。
- 優先度（P1/P2/P3）: `P3`
- 実装状況: `DONE`（`docs/idea-progress.md` 参照）
- 参考ソース: [Wizorb (MobyGames)](https://www.mobygames.com/game/57770/wizorb/)
- 最小導入版: 4面・8面・12面の開始前に1画面テキストを表示。

---

## 5. 非採用/後回し候補

- PvP対戦モード:
  ネットワーク同期が必要で、現スコープ（ローカル完結）から大きく外れるため後回し。
- ユーザー作成ステージエディタ:
  UI/保存フォーマット設計が大きく、ゲーム性強化より開発負荷が高いため後回し。
- フル3D化:
  レンダリング基盤の刷新が必要で、既存Canvas資産の再利用効率が低いため非採用。
- 課金/アカウント連携:
  現在の個人テスト用途に対して目的外のため非採用。

---

## 6. ソース一覧

- [Breakout (video game) - Wikipedia](https://en.wikipedia.org/wiki/Breakout_%28video_game%29)
- [Arkanoid - Wikipedia](https://en.wikipedia.org/wiki/Arkanoid)
- [Breakout: Recharged - Atari公式](https://atari.com/products/breakout-recharged)
- [Shatter - Steam](https://store.steampowered.com/app/20820/Shatter/)
- [Wizorb - Steam](https://store.steampowered.com/app/207420/Wizorb/)
- [Wizorb - MobyGames](https://www.mobygames.com/game/57770/wizorb/)
- [Brickorium - Steam](https://store.steampowered.com/app/2955960/Brickorium/)
- [Block Shot - Steam](https://store.steampowered.com/app/4272730/)
