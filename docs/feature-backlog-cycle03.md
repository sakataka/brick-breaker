# 機能拡張バックログ（Cycle 03）

## 概要
- 本ドキュメントは Cycle 03 の機能拡張 To-Do リストです。
- 対象は「新規性 + 実装しやすさ」で厳選した 12 件です。
- 優先度は `P0(5件) -> P1(4件) -> P2(3件)` の 3 ウェーブで実装します。
- 実装状況: **12/12 完了（2026-02-15）**

## 前提
- 現状実装: 12ステージ、8アイテム、ショップ、敵、ボス、分岐、デイリー/デバッグ対応
- 優先軸: ゲーム性向上 > 実装コスト
- 依存追加: なし（既存アーキテクチャ前提）
- 文書言語: 日本語

## 実装順序（Wave）
1. Wave 1（P0）: `BB-C03-01 -> BB-C03-02 -> BB-C03-03 -> BB-C03-04 -> BB-C03-05`
2. Wave 2（P1）: `BB-C03-06 -> BB-C03-07 -> BB-C03-08 -> BB-C03-09`
3. Wave 3（P2）: `BB-C03-10 -> BB-C03-11 -> BB-C03-12`

---

## Backlog Items

### BB-C03-01
- ID: `BB-C03-01`
- タイトル: ボスフェーズ化（2〜3段階）
- 分類: 既存ブラッシュアップ
- 優先度: `P0`
- ランク: `1`
- 実装順序: `Wave 1`
- 体験価値: ボス戦の単調さを減らし、終盤の達成感を強化する。
- 変更対象モジュール: `roundSystem`, `physicsCore`, `renderPresenter`, `PhaserRenderPort`
- 実装難易度: `M`
- 回帰リスク: ボス戦テンポ・難易度の急変
- 受け入れ基準:
  - ボス戦でフェーズ遷移演出が確認できる
  - 各フェーズで攻撃/挙動差分が成立する
  - 既存ボスHP表示とクリア判定が壊れない
- 根拠ソース: Breakout Recharged, Arkanoid Eternal Battle

### BB-C03-02
- ID: `BB-C03-02`
- タイトル: チャレンジミッション拡張（時間以外）
- 分類: 既存ブラッシュアップ
- 優先度: `P0`
- ランク: `2`
- 実装順序: `Wave 1`
- 体験価値: ステージ攻略の目標を増やし、リプレイ動機を強化する。
- 変更対象モジュール: `roundSystem`, `runtimeTypes`, `overlay`
- 実装難易度: `M`
- 回帰リスク: 評価計算の不整合
- 受け入れ基準:
  - ノーミス/コンボ達成/ショップ未使用など複数ミッションを表示できる
  - ステージ結果表示で達成/未達が判定される
  - 既存星評価との整合性が維持される
- 根拠ソース: Breakout Recharged

### BB-C03-03
- ID: `BB-C03-03`
- タイトル: Focusモード（時間減速とスコアトレード）
- 分類: 新規
- 優先度: `P0`
- ランク: `3`
- 実装順序: `Wave 1`
- 体験価値: 緊急回避とハイスコアの駆け引きを生む。
- 変更対象モジュール: `gamePipeline`, `physicsCore`, `hud`, `store`
- 実装難易度: `M`
- 回帰リスク: 物理一貫性・スコアバランス崩れ
- 受け入れ基準:
  - Focus有効中に速度が低下し、スコア補正が適用される
  - UIで状態が明示される
  - Focus未使用時の挙動は従来通り
- 根拠ソース: Shatter Remastered Deluxe

### BB-C03-04
- ID: `BB-C03-04`
- タイトル: 攻撃系新アイテム2種（例: ホーミング/レール）
- 分類: 新規
- 優先度: `P0`
- ランク: `4`
- 実装順序: `Wave 1`
- 体験価値: 既存8アイテムに戦術差を追加する。
- 変更対象モジュール: `domainTypes`, `itemRegistry`, `itemSystem`, `pipeline/*`, `sfx`
- 実装難易度: `M`
- 回帰リスク: ドロップ重み・効果重複の崩壊
- 受け入れ基準:
  - 新アイテム2種がドロップ・取得・効果発動する
  - スタック設定ON/OFF時の挙動が明確
  - 既存アイテムとの競合がない
- 根拠ソース: Arkanoid 系パワーアップ

### BB-C03-05
- ID: `BB-C03-05`
- タイトル: ショップ強化（2択の質向上・価格帯演出）
- 分類: 既存ブラッシュアップ
- 優先度: `P0`
- ランク: `5`
- 実装順序: `Wave 1`
- 体験価値: 「買う/温存」の意思決定をより楽しくする。
- 変更対象モジュール: `shopUi`, `session/shopActions`, `store`, `ShopPanel`
- 実装難易度: `S-M`
- 回帰リスク: 購入不能バグ・UI表示ずれ
- 受け入れ基準:
  - 候補提示ロジックが改善される
  - 価格帯の演出/可視化が追加される
  - 1ステージ1回購入ルールは維持される
- 根拠ソース: 現代ローグライト系ショップ設計（一般傾向）

### BB-C03-06
- ID: `BB-C03-06`
- タイトル: エリートブロック派生（分裂/召喚/反撃）
- 分類: 新規
- 優先度: `P1`
- ランク: `6`
- 実装順序: `Wave 2`
- 体験価値: 中盤以降の盤面読みと優先破壊判断を強化する。
- 変更対象モジュール: `config/stages`, `physicsCore`, `brickDamage`, `renderer`
- 実装難易度: `M-L`
- 回帰リスク: 盤面難易度の急激な上振れ
- 受け入れ基準:
  - 新エリート特性が明確に判別できる
  - ブロック挙動が再現性を持って動作する
  - 既存エリート種（durable/armored/regen/hazard）に回帰なし
- 根拠ソース: Arkanoid 系耐久/特殊ブロック

### BB-C03-07
- ID: `BB-C03-07`
- タイトル: 敵ウェーブイベント（時限増援）
- 分類: 新規
- 優先度: `P1`
- ランク: `7`
- 実装順序: `Wave 2`
- 体験価値: ステージ進行に時間的緊張感を追加する。
- 変更対象モジュール: `pipeline/enemyPhase`, `roundSystem`, `renderPresenter`
- 実装難易度: `M`
- 回帰リスク: 敵数過多による難易度破綻
- 受け入れ基準:
  - 指定タイミングで増援が発生する
  - ステージ進行やクリア判定に矛盾がない
  - HUD/演出で増援が認識できる
- 根拠ソース: Breakout Recharged, Arkanoid Eternal Battle

### BB-C03-08
- ID: `BB-C03-08`
- タイトル: Endlessモード（解放型）
- 分類: 新規
- 優先度: `P1`
- ランク: `8`
- 実装順序: `Wave 2`
- 体験価値: クリア後の継続プレイ導線を作る。
- 変更対象モジュール: `sceneMachine`, `roundSystem`, `overlay`, `store`
- 実装難易度: `M`
- 回帰リスク: 通常キャンペーン遷移との競合
- 受け入れ基準:
  - 専用モードとして開始できる
  - 無限進行ロジックとスコア継続が動作する
  - 通常12面キャンペーンは従来通り
- 根拠ソース: DX-Ball 系の継続プレイ設計

### BB-C03-09
- ID: `BB-C03-09`
- タイトル: Boss Rushモード
- 分類: 新規
- 優先度: `P1`
- ランク: `9`
- 実装順序: `Wave 2`
- 体験価値: 短時間で高難易度に挑戦できる。
- 変更対象モジュール: `roundSystem`, `sceneMachine`, `renderPresenter`
- 実装難易度: `M`
- 回帰リスク: ボス初期化状態の不整合
- 受け入れ基準:
  - 連続ボス戦がモードとして成立する
  - 進行/リザルト表示が破綻しない
  - 通常モードには影響しない
- 根拠ソース: ボスラッシュ型アーケード設計の一般傾向

### BB-C03-10
- ID: `BB-C03-10`
- タイトル: シード共有チャレンジ（コード入力）
- 分類: 新規
- 優先度: `P2`
- ランク: `10`
- 実装順序: `Wave 3`
- 体験価値: 同条件での比較プレイが簡単になる。
- 変更対象モジュール: `start settings`, `random`, `dailyChallenge`, `overlay`
- 実装難易度: `M`
- 回帰リスク: シード解釈差による再現性欠如
- 受け入れ基準:
  - シードコード入力で再現プレイ可能
  - 同一コードで同一挙動が再現される
  - 通常ランダムモードは維持される
- 根拠ソース: チャレンジシード共有の一般実装

### BB-C03-11
- ID: `BB-C03-11`
- タイトル: ローカルゴースト再生（直近1件）
- 分類: 新規
- 優先度: `P2`
- ランク: `11`
- 実装順序: `Wave 3`
- 体験価値: 自己ベスト追走で上達導線を作る。
- 変更対象モジュール: `runtimeTypes`, `gameRuntime`, `phaser/render/layers/*`
- 実装難易度: `L`
- 回帰リスク: 描画負荷増・同期ズレ
- 受け入れ基準:
  - 直近プレイの軌跡を再生表示できる
  - プレイ本体の操作に干渉しない
  - オフ設定で完全無効化できる
- 根拠ソース: スコアアタック系のゴースト機能

### BB-C03-12
- ID: `BB-C03-12`
- タイトル: ステージエディタLite（JSON入出力）
- 分類: 新規
- 優先度: `P2`
- ランク: `12`
- 実装順序: `Wave 3`
- 体験価値: 長期的にコンテンツを増やしやすくする。
- 変更対象モジュール: `config/stages`, `configSchema`, `debug UI`
- 実装難易度: `L`
- 回帰リスク: 不正データ読込時のクラッシュ
- 受け入れ基準:
  - JSONインポート/エクスポートが可能
  - バリデーション失敗時は安全にエラー表示
  - 既存固定ステージ運用は維持
- 根拠ソース: レベルエディタ付きアーケード拡張の一般傾向

---

## 将来の型/API変更候補（実装時検討）
- `Scene` 拡張: `endless`, `bossrush`
- `GameState` 拡張: ミッション進捗、focusゲージ、モード識別
- `ItemType` 拡張: 攻撃系2種
- `StartSettingsSelection` 拡張: モード選択、シード入力

---

## 品質チェック（この文書の受け入れ基準）
1. バックログ項目が 12 件あること
2. 各項目に `優先度/ランク/実装順序` があること
3. 各項目に `変更対象モジュール` と `受け入れ基準` があること
4. 実装順序が `P0 -> P1 -> P2` で矛盾しないこと
5. 既存実装と重複する内容が主軸になっていないこと
6. 各項目に根拠ソースがあること

---

## 調査ソース（ネット）
- [Breakout: Recharged（Atari公式）](https://atari.com/products/breakout-recharged)
- [Breakout: Recharged（Steam）](https://store.steampowered.com/app/1714190/Breakout_Recharged/)
- [Breakout Beyond（Atari公式）](https://atari.com/products/breakout-beyond)
- [Shatter Remastered Deluxe（Steam）](https://store.steampowered.com/app/1937230/Shatter_Remastered_Deluxe/)
- [Arkanoid: Gameplay（StrategyWiki）](https://strategywiki.org/wiki/Arkanoid/Gameplay)
- [Arkanoid: Revenge of Doh Gameplay（StrategyWiki）](https://strategywiki.org/wiki/Arkanoid%3A_Revenge_of_Doh/Gameplay)
- [Arkanoid - Eternal Battle（Steam）](https://store.steampowered.com/app/1717270/Arkanoid__Eternal_Battle/)
- [Wizorb（Steam）](https://store.steampowered.com/app/207420/Wizorb/)
- [DX-Ball 2: 20th Anniversary Edition（Steam）](https://store.steampowered.com/app/922400/DXBall_2_20th_Anniversary_Edition/)
