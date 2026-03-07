# Brick Breaker Local

Bun + Vite + TypeScript を基盤に、`Phaser` をホストにした描画/入力、`React + Zustand` の UI、`Tone/WebAudio` のサウンドで構成したローカル向けブロック崩しです。  
マウス操作を中心に、通常 12 ステージキャンペーン、EX 4 ステージ、12 種アイテム、複数ゲームモード、コンボ、評価、サウンド、開始前設定を備えています。

## セットアップ

```bash
bun install
bun run dev
```

`bun install` 時に `lefthook` の `pre-push` フックが自動インストールされます。

## 開発コマンド

```bash
# 型 + lint + deadcode + build
bun run check

# 翻訳辞書の型検証 / 生成
bun run typesafe-i18n --no-watch

# 反復開発向け（buildを省いた高速ゲート）
bun run check:fast

# pre-pushと同じガード
bun run guard:local

# 差分に応じた対応漏れ検知
bun run verify:change-coverage

# レイヤー依存の境界チェック
bun run check:arch

# リファクタ監査（ドキュメント乖離/重複設定/巨大ファイル）
bun run refactor:audit

# deadcode scan (CI-compatible)
bun run deadcode

# deadcode scan (report only)
bun run deadcode:report

# unit/integration tests
bun test

# e2e tests (Playwright)
bun run e2e

# CI同等のe2e（previewサーバ利用）
bun run e2e:ci

# 新機能の雛形生成（本体 + テスト + doc TODOコメント）
bun run scaffold:feature -- <feature-name>
```

初回のみ Playwright ブラウザをインストールしてください。

```bash
bunx playwright install chromium
```

## 操作

- マウス移動: パドル移動
- 左クリック / `Enter` / `Space`: 開始・再開・次ステージ
- `P`: 一時停止 / 再開
- 右クリック: 魔法スキル

## 開始前設定

タイトル画面でマウス選択できます。

- 開始画面は「ヘッダー / 設定スクロール領域 / 固定フッター（開始ボタン）」の3段構成です。
- 設定が多い場合も、カード内の設定領域だけがスクロールし、開始ボタンは常時表示されます。
- デバッグ設定は通常設定から分離され、`デバッグモード` を ON にしたときだけ展開されます。
- プレイ中UIは「上段情報バー（HUD+ショップ） / 下段ゲーム枠」の2分割で表示されます。

- 難易度: `カジュアル / スタンダード / ハード`（デフォルト `スタンダード`）
- 言語: `日本語 / English`（選択はローカル保存）
- モード: `キャンペーン / エンドレス / ボスラッシュ`
- コース: `Normal / EX`（EX は通常キャンペーンクリア後に解放、キャンペーン時のみ表示）
- 初期残機: `1..6`
- 速度: `75% / 100% / 125%`（初速/最高速のみに反映）
- マルチ上限: `2..6`（デフォルト `4`）
- 新アイテムスタック: `ON/OFF`（デフォルト `OFF`）
- Item Pool: 12 種アイテムを `アイコン + 名前 + チェックボックス` で個別に有効/無効化（初期値は全 ON、全 OFF は不可）
- ゴースト再生: `ON/OFF`（ローカル直近1件）
- デバッグモード: `ON/OFF`（デフォルト `OFF`）
  - 開始ステージ: `1..12`
  - シナリオ: `通常 / 敵確認(9面) / ボス確認(12面)`
  - アイテムプリセット: `なし / 戦闘確認 / ボス確認`
  - 結果記録: `記録しない / 記録する`（デフォルト `記録しない`）
  - カスタムステージJSON: `ON/OFF`（インポートJSONを優先）
- ルート選択: `自動 / A / B`
- チャレンジ固定シード: `ON/OFF`（ON時は毎回同一乱数で再現プレイ）
- シードコード（任意）: 文字列から固定シードを生成（入力時は最優先）
- リスク倍率モード: `ON/OFF`（ON時は高得点・高危険）
- サウンド: `BGM ON/OFF` / `効果音 ON/OFF`

## ゲーム仕様

- 通常 12 ステージキャンペーン + EX 4 ステージ + エンドレス + ボスラッシュ（5連戦）
- 4面クリア後の2ルート分岐（A/B）
- EX は通常キャンペーンを `非デバッグ / 記録あり / カスタムステージなし` でクリアすると解放
- デバッグモード有効時は開始ステージを任意にスキップ可能
- デバッグモードで「記録しない」を選んだ場合、HUD/Overlayに `DEBUG` バッジを表示し、結果一覧への保存を行わない
- ステージ間で残機を持ち越し（ステージクリアで回復しない）
- ライフ0で同ステージ再挑戦（ステージ開始スコアへ巻き戻し）
- コンボ倍率: `1.8s` 窓、`x1.00 -> x3.00`
- コンボ `x2.0` 到達時に1回だけ確定アイテムドロップ
- ステージ評価: ★1〜★3（時間/被弾/残機）+ ミッション補正
- ステージクリア時にミッション（`制限時間` / `ショップ未使用` / `被弾なし` / `コンボ x2.0` / `砲台先破壊` / `発生装置停止` / `Risk Chain 閾値`）の達成/未達を表示
- 盤面アーキタイプを段階的に変更し、`steel`（破壊不能遮蔽物）/ `generator`（近傍再生成）/ `gate`（周期開閉）/ `turret`（砲撃）でレーンと優先破壊対象を作る
- 9〜11面にエリートブロック（`durable` / `armored` / `regen` / `hazard` / `split` / `summon` / `thorns`）
- ステージ修飾子面では時限増援ウェーブが発生
- `hazard` 破壊時は `slow_ball` 効果が解除され、3秒間だけ球速上限が上がる
- 4 面と 8 面は中ボス戦、12 面は専用アリーナの 3 フェーズ最終ボス戦、EX4 は強化ボス戦
- ボス戦は `telegraph -> attack -> vulnerability` のサイクルで進み、HUD に `Boss HP / cast / weak window / Risk Chain / OVERDRIVE` を表示
- 危険状態や予兆中に攻撃を通すと `Risk Chain` が上昇し、閾値到達で短時間 `OVERDRIVE` が発動する
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

- 通常ドロップ率 `12%`、同時落下上限 `2`、1 fixed-step あたり通常ドロップ上限 `1`
- コンボ `x2.0` の確定ドロップは通常ドロップ上限の対象外
- 種類: `paddle_plus`, `slow_ball`, `multiball`, `shield`, `pierce`, `bomb`, `shockwave`, `pulse`, `decoy`, `laser`, `homing`, `rail`
- スタック加算型（`pierce` と `bomb` は上限1）
- `shockwave` は取得時に近くの通常ブロックへ追加ダメージを与え、ボールを少し押し戻す即時効果
- `pulse` はパドル反射時に近距離バーストを発生させる継続打点補助
- `decoy` は一定時間、砲台弾とボス弾の狙いを逸らす防御寄り効果
- `laser` は最大2スタック（自動発射間隔が短縮）
- `homing` はボール軌道を最近ブロック方向へ補正
- `rail` はレーザーの貫通ヒット数を増やす
- 開始前の `Item Pool` で OFF にしたアイテムはドロップ / ショップ / デバッグ付与 / 開始時プリセットから除外
- 開始前設定で「新アイテムスタック」が `OFF` の場合、`laser` は1段階固定（重ね取り無効）
- デバッグモードのアイテムプリセット:
  - 戦闘確認: `paddle_plus=1, slow_ball=1, multiball=1, shield=1`
  - ボス確認: `shield=2, pierce=1, bomb=1, laser=2`（新アイテムスタックOFF時は `laser=1`、Item Pool で無効化したアイテムは 0）
- ステージクリア時はアクティブ効果を次面へ持ち越し（`bomb` は持ち越さない）
- 全ボール喪失で全効果解除
- `bomb` / `pierce` 有効中は同種アイテムを再ドロップしない
- シナジー: `pierce` + `slow_ball` 同時有効で貫通深度 `+1`
- pickup 時は短いヒットストップ、色フラッシュ、HUDトースト、パドル/ボールの一時オーラを表示
- 落下アイテム表示は「色付きタイル + 短縮文字」を軸に高視認性を維持
- 描画は `DPR連動（上限4）` + サブピクセルsnap補正で高解像度表示

## アクセシビリティ（自動適用）

- `prefers-reduced-motion: reduce` を自動反映
- `prefers-contrast: more` を自動反映
- HUDバッジ表示は行わず、描画・演出の挙動側へ自動反映

## サウンド

- WebAudio合成のみ（外部音源ファイルなし）
- タイトルBGM + cue ベースBGM（`chapter1 / chapter2 / chapter3 / midboss / finalboss / ex`）
- BGM は Tone synth によるポップ寄りのオリジナル進行で構成
- BGMは「リード + ベース + 和音 + 対旋律/パッド」の4声標準で同時発音
- 中ボス / 大ボス / EX は通常面より高テンポで、3和音/7和音を常用した厚い伴奏に切り替わる
- 開始/ステージクリア/最終クリア/ゲームオーバーのジングル
- アイテム SE は取得演出と連動し、`pulse` / `decoy` / `OVERDRIVE` を含む主要イベントを個別再生
- コンボ `x2.5` 到達時にフィルインSE

## 公開（GitHub Pages）

- `vite.config.ts` は GitHub Actions 上で `base: /brick-breaker/` を自動適用
- Workflow:
  - CI: `.github/workflows/ci.yml`（`quick-guard` + `build` + `e2e`）
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
- `GameSession` は app/store との composition root とし、実際の進行は `src/game/session/SessionController.ts` と `src/game/session/*` に分割しています。
- フレーム進行は `src/game/gamePipeline.ts` が受け持ち、敵/レーザー/魔法/盤面制御/ボス攻撃/シールドは `src/game/pipeline/*` の個別フェーズで処理します。
- ブロックHP/破壊判定は `src/game/brickDamage.ts` に集約し、`physicsCore` と `gamePipeline` で共通利用します。
- 描画は `src/phaser/scenes/RuntimeScene.ts` + `src/phaser/render/PhaserRenderPort.ts` 経由で実行し、`src/phaser/render/layers/*` でレイヤー別に管理します。
- UI は `src/app/AppUi.tsx` と `src/app/components/*` で宣言的に構成し、開始設定の単一定義は `src/game/startSettingsSchema.ts` に集約しています。
- ステージ解決は `src/game/stageContext.ts` に集約し、chapter / tags / events / modifier を round/pipeline/render で共通利用します。
- 多言語基盤は `typesafe-i18n` を使用し、`src/i18n/*` の辞書を単一の翻訳ソースとして扱います。
- UI 文言は React / Phaser の両方で現在ロケールから解決し、Core 側には表示文字列ではなくキーや数値を保持します。
- 音制御は `src/audio/audioDirector.ts`（facade） -> `src/audio/toneDirector.ts` の経路で管理します。

未完了タスク管理は `docs/architecture.md` の `Open Backlog` に統一しています。
