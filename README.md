# Brick Breaker Local

Vite+ + TypeScript 6.0 を基盤に、`Phaser` の描画/入力、`React + Zustand` の UI、`Tone/WebAudio` のサウンドで構成した browser-first のブロック崩しです。  
公開仕様は `12 encounter の campaign` を中心に設計しており、Tier 1 クリア後に `Threat Tier 2` が解放されます。

## 前提環境

- `vp`（Vite+ CLI）
- `pnpm 10.x`（`vp install` から利用）
- `Node.js 20.19+` または `22.12+`
- 推奨 Node: `.node-version` に合わせた版
- 想定シェル: `zsh`

## セットアップ

```bash
curl -fsSL https://vite.plus | bash
vp install
vp dev
```

依存解決、hook 設定、日常的な dev/build/test/check は `vp` を基準に使います。  
project 固有 script は `vp run ...` で呼びます。

## 標準ループ

```bash
vp install
vp check
vp test
vp build
```

E2E を含める場合は初回にブラウザを入れてから実行します。

```bash
vp exec playwright install chromium
vp run e2e:ci
```

ローカル確認用の preview:

```bash
vp preview
```

ツールチェーンの詳細は `docs/toolchain.md` を参照してください。

`TypeScript 7` の native preview は `vp run typecheck:ts7` で advisory に確認します。  
`knip` など既存の TypeScript API に依存するツールは、引き続き `typescript` package を基準に扱います。

## 開発コマンド

```bash
# 型 + lint + format check
vp check

# unit tests
vp test

# app/test/node の型検証
vp run typecheck

# TS7 native preview の advisory check
vp run typecheck:ts7

# 翻訳辞書の型検証 / 生成
vp run typesafe-i18n

# deadcode scan
vp run deadcode

# deadcode report only
vp run deadcode:report

# レイヤー依存の境界チェック
vp run check:arch

# 反復開発向けの高速ゲート
vp run check:fast

# ローカル品質ゲート
vp run guard:local

# CI 相当の品質ゲート
vp run guard:ci

# テストが旧 flat runtime state に戻っていないかを確認
vp run guard:test-state-shape

# 差分に応じた対応漏れ検知
vp run verify:change-coverage

# e2e tests
vp run e2e

# preview サーバ利用の e2e
vp run e2e:ci
```

## 操作

- マウス移動: パドル移動
- 左クリック / `Enter` / `Space`: 開始・再開・次へ進む
- `P`: 一時停止 / 再開
- 右クリック: active skill

## 開始設定

タイトル画面の shipped UI は次の設定だけを公開しています。

- 言語: `日本語 / English`
- 難易度: `casual / standard / hard`
- アクセシビリティ: `reduced motion / high contrast`
- サウンド: `BGM ON/OFF` / `SFX ON/OFF`

開始画面は「ヘッダー / 設定スクロール領域 / 固定フッター（開始 CTA）」の構成です。  
プレイ中 UI は「上段情報バー（HUD + ショップ） / 下段ゲーム枠」の2分割で表示します。

## ゲーム仕様

- campaign は `12 encounter` の一本道です
- Tier 1 をクリアすると同じ campaign 商品の上位難度として `Threat Tier 2` が解放されます
- ステージ間で残機を持ち越し、ライフ 0 で同 encounter を再挑戦します
- コンボ倍率は `1.8s` 窓で上昇し、スコアは `通常加点 + style bonus + shot cancel` で積み上がります
- 各 encounter は `scoreFocus` を持ち、`連鎖破壊 / 弾消し / ボス弱点集中 / ノーミス継続` のどこで稼ぐ面かを HUD とショップ preview に表示します
- ショップは `1 encounter 1 回 / 2 択購入` です
- 右クリックの active skill はクールダウン制です
- 敵弾はプレイヤーボールと色と形を分離し、`spike orb / plasma bolt / void core` の 3 系統で常時識別できます
- ボス戦は `telegraph -> attack -> punish window` のサイクルで進みます
- 次 encounter の `previewTags` と `scoreFocus` を HUD とショップで先読みできます

## スコアと保存

- HUD には `score / recent gain / chain / record 状態 / current score focus` を表示します
- ラン終了時の総合点はローカル保存します
- 保存する record は次の 4 系統です
  - `overallBestScore`
  - `tier1BestScore`
  - `tier2BestScore`
  - `latestRunScore`
- progression と records は `src/game/metaProgress.ts` で別保存します

## ビジュアルとサウンド

- UI は `Space Grotesk + Public Sans`、`Phosphor`、`motion` を使った premium SF arena 方向です
- 背景とアリーナは `far field + mid structure + arena frame + warning overlay` の多層構成です
- ブロック、警告帯、枠、背景タイルは `src/art/visualAssets.ts` の manifest から組み立てます
- BGM は cue ベースで `title / chapter1 / chapter2 / chapter3 / midboss / finalboss / tier2` を切り替えます
- `Threat Tier 2` は上位 cue と visual profile を使って通常 campaign と見た目・テンションを切り替えます

## 公開

- `vite.config.ts` は GitHub Actions 上で `base: /brick-breaker/` を自動適用します
- build は `Rolldown` 前提で、`phaser` を専用 chunk に分離します
- unit test は `vp test`、E2E は `vp run e2e:ci` を使います

## 設計ドキュメント

- `README.md`
- `docs/architecture.md`
- `docs/toolchain.md`
- `AGENTS.md`

## 実装メモ

- 実行エントリは `src/game/GameSession.ts`
- runtime orchestration は `src/game/session/RuntimeController.ts`
- frame 進行は `src/game/gamePipeline.ts` と `src/game/pipeline/*`
- run / encounter 定義は `src/game/content/runDefinition.ts` と `src/game/content/encounters.ts`
- module catalog は `src/game/content/modules.ts`
- runtime state の正式 shape は `scene / run / encounter / combat / ui`
- 保存は `src/game/metaProgress.ts`、表示変換は `src/game/presenter/*`
