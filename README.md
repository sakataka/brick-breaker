# Brick Breaker Local

Bun + Vite + TypeScript を基盤に、`Phaser` をホストにした描画/入力、`React + Zustand` の UI、`Tone/WebAudio` のサウンドで構成したローカル向けブロック崩しです。  
マウス操作を中心に、12ステージキャンペーン、10種アイテム、複数ゲームモード、コンボ、評価、サウンド、開始前設定を備えています。

## セットアップ

```bash
bun install
bun run dev
```

## 開発コマンド

```bash
# 型 + lint + build
bun run check

# unit/integration tests
bun test

# e2e tests (Playwright)
bun run e2e
```

初回のみ Playwright ブラウザをインストールしてください。

```bash
bunx playwright install chromium
```

## 操作

- マウス移動: パドル移動
- 左クリック / `Enter` / `Space`: 開始・再開・次ステージ
- `P`: 一時停止 / 再開
- `F`: Focus発動（スコア消費・時間減速）
- 右クリック: 魔法スキル

## 開始前設定

タイトル画面でマウス選択できます。

- 開始画面は「ヘッダー / 設定スクロール領域 / 固定フッター（開始ボタン）」の3段構成です。
- 設定が多い場合も、カード内の設定領域だけがスクロールし、開始ボタンは常時表示されます。
- デバッグ設定は通常設定から分離され、`デバッグモード` を ON にしたときだけ展開されます。
- プレイ中UIは「上段情報バー（HUD+ショップ） / 下段ゲーム枠」の2分割で表示されます。

- 難易度: `カジュアル / スタンダード / ハード`（デフォルト `スタンダード`）
- モード: `キャンペーン / エンドレス / ボスラッシュ`
- 初期残機: `1..6`
- 速度: `75% / 100% / 125%`（初速/最高速のみに反映）
- マルチ上限: `2..6`（デフォルト `4`）
- 新アイテムスタック: `ON/OFF`（デフォルト `OFF`）
- Stickyアイテム有効: `ON/OFF`（デフォルト `OFF`）
- ゴースト再生: `ON/OFF`（ローカル直近1件）
- デバッグモード: `ON/OFF`（デフォルト `OFF`）
  - 開始ステージ: `1..12`
  - シナリオ: `通常 / 敵確認(9面) / ボス確認(12面)`
  - アイテムプリセット: `なし / 戦闘確認 / ボス確認`
  - 結果記録: `記録しない / 記録する`（デフォルト `記録しない`）
  - カスタムステージJSON: `ON/OFF`（インポートJSONを優先）
- ルート選択: `自動 / A / B`
- チャレンジ固定シード: `ON/OFF`（ON時は毎回同一乱数で再現プレイ）
- デイリーモード: `ON/OFF`（日付ごとの固定シードと目標を適用、ON時はこちらが優先）
- シードコード（任意）: 文字列から固定シードを生成（入力時は最優先）
- リスク倍率モード: `ON/OFF`（ON時は高得点・高危険）
- サウンド: `BGM ON/OFF` / `効果音 ON/OFF`

## ゲーム仕様

- 12ステージ直線キャンペーン + エンドレス + ボスラッシュ（5連戦）
- 4面クリア後の2ルート分岐（A/B）
- デバッグモード有効時は開始ステージを任意にスキップ可能
- デバッグモードで「記録しない」を選んだ場合、HUD/Overlayに `DEBUG` バッジを表示し、結果一覧への保存を行わない
- ステージ間で残機を持ち越し（ステージクリアで回復しない）
- ライフ0で同ステージ再挑戦（ステージ開始スコアへ巻き戻し）
- コンボ倍率: `1.8s` 窓、`x1.00 -> x3.00`
- コンボ `x2.0` 到達時に1回だけ確定アイテムドロップ
- Focus: `250点`消費で短時間スローモーション（クールダウン制）
- ステージ評価: ★1〜★3（時間/被弾/残機）+ ミッション補正
- ステージクリア時にミッション（`制限時間` / `ショップ未使用`）の達成/未達を表示
- 9〜11面にエリートブロック（`durable` / `armored` / `regen` / `hazard` / `split` / `summon` / `thorns`）
- ステージ修飾子面では時限増援ウェーブが発生
- `hazard` 破壊時は `slow_ball` 効果が解除され、3秒間だけ球速上限が上がる
- 12面は単一ボス戦（HUDにボスHPを表示）
- ステージ修飾子（ワープ / 高速球 / フラックスフィールド）を後半面に適用
  - ワープは「青=入口 / 黄=出口 + ガイド線」で移動先を明示
- シールド救済成立時に「シールドバースト」が発動（近傍2ブロックへ反撃 + 生存ボール押し戻し）
- 浮遊敵ユニット（後半面）を撃破して追加得点
- ステージ中1回限定ショップ（2択購入）
- ショップ価格はラン内購入回数で上昇（`1200 -> 1600 -> 2200 -> ...`）
- ラン内3回までの永続強化選択（幅/速度/スコア）
- 4/8/12面の開始前ストーリー演出
- 右クリックの単発魔法スキル（クールダウン制）

## アイテム仕様

- ドロップ率 `18%`、同時落下上限 `3`
- 種類: `paddle_plus`, `slow_ball`, `multiball`, `shield`, `pierce`, `bomb`, `laser`, `sticky`, `homing`, `rail`
- スタック加算型（`pierce` と `bomb` は上限1）
- `laser` は最大2スタック（自動発射間隔が短縮）
- `sticky` は最大1スタック（パドルで一時保持して自動リリース）
- `homing` はボール軌道を最近ブロック方向へ補正
- `rail` はレーザーの貫通ヒット数を増やす
- `Stickyアイテム有効` が `OFF` の場合、`sticky` はドロップ/ショップ/デバッグ付与の対象外
- 開始前設定で「新アイテムスタック」が `OFF` の場合、`laser` は1段階固定（重ね取り無効）
- デバッグモードのアイテムプリセット:
  - 戦闘確認: `paddle_plus=1, slow_ball=1, multiball=1, shield=1`
  - ボス確認: `shield=2, pierce=1, bomb=1, laser=2, sticky=1`（新アイテムスタックOFF時は `laser=1`、Sticky無効時は `sticky=0`）
- ステージクリア時はアクティブ効果を次面へ持ち越し（`bomb` は持ち越さない）
- 全ボール喪失で全効果解除
- `bomb` / `pierce` 有効中は同種アイテムを再ドロップしない
- シナジー: `pierce` + `slow_ball` 同時有効で貫通深度 `+1`
- 落下アイテム表示は「色付きタイル + 絵文字 + 短縮文字」のハイブリッド（高視認性）
- 描画は `DPR上限2` で高解像度表示（4K環境でも視認性を維持）

## アクセシビリティ（自動適用）

- `prefers-reduced-motion: reduce` を自動反映
- `prefers-contrast: more` を自動反映
- HUD に適用状態バッジを表示（`表示: 標準` / `表示: 動き抑制` など）

## サウンド

- WebAudio合成のみ（外部音源ファイルなし）
- タイトルBGM + ステージ別BGM（12トラック）
- BGMはパブリックドメイン旋律モチーフをベースに構成（Bach / Mozart / Beethoven）
- BGMは最大で「メロディ + ハーモニー2音 + ベース」の同時発音（3和音系）に対応
- 開始/ステージクリア/最終クリア/ゲームオーバーのジングル
- アイテム8種は個別SE
- コンボ `x2.5` 到達時にフィルインSE

## 公開（GitHub Pages）

- `vite.config.ts` は GitHub Actions 上で `base: /brick-breaker/` を自動適用
- Workflow:
  - CI: `.github/workflows/ci.yml`（`check` + `test` + `e2e`）
  - Deploy: `.github/workflows/deploy-pages.yml`

GitHub Pages 公開手順:

1. `main` へ push（`deploy-pages.yml` の `configure-pages` は `enablement: true` で自動有効化を試行）
2. `Deploy Pages` workflow の完了を確認
3. もし権限不足で失敗した場合のみ、GitHub の `Settings > Pages > Build and deployment` で `GitHub Actions` を手動設定して再実行

## 設計ドキュメント

- `docs/architecture.md`
- `README.md`

## 実装メモ

- 実行エントリは `src/game/GameSession.ts`（オーケストレータ）で、`src/core/engine.ts`（進行ロジック）を駆動します。
- `GameSession` の開始設定適用/ショップ操作/UI同期は `src/game/session/*` に分割し、クラス本体は配線中心にしています。
- フレーム進行は `src/game/gamePipeline.ts` が受け持ち、敵/レーザー/魔法/シールドは `src/game/pipeline/*` の個別フェーズで処理します。
- ブロックHP/破壊判定は `src/game/brickDamage.ts` に集約し、`physicsCore` と `gamePipeline` で共通利用します。
- 描画は `src/phaser/scenes/RuntimeScene.ts` + `src/phaser/render/PhaserRenderPort.ts` 経由で実行し、`src/phaser/render/layers/*` でレイヤー別に管理します。
- UI は `src/app/AppUi.tsx` と `src/app/components/*` で宣言的に構成し、`src/app/store.ts` の `START_SETTINGS_OPTIONS` を開始設定UIの単一定義として使います。
- 音制御は `src/audio/audioDirector.ts`（facade） -> `src/audio/toneDirector.ts` の経路で管理します。

未完了タスク管理は `docs/architecture.md` の `Open Backlog` に統一しています。
