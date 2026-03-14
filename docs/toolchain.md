# Toolchain

## 概要

このリポジトリは `Vite+` を開発コマンドの入口として採用しています。  
日常的な操作は `vp` を使い、`packageManager` は `pnpm`、unit test は `vite-plus/test` ベースの `vp test`、E2E は `Playwright` を継続利用します。
ローカルの標準シェルは `zsh` を前提とし、この文書のコマンド例も `zsh` 互換で記述します。

整理すると役割は次のとおりです。

- `vp dev / build / preview / check / lint / fmt`: Vite+ の統合コマンド
- `vp test`: Vitest 互換の unit test 入口
- `vp run e2e`, `vp run e2e:ci`: Playwright を呼ぶ E2E 入口
- `vp run deadcode`, `vp run check:arch`, `vp run verify:change-coverage`: 既存の補助検証を Vite+ 配下で呼ぶ
- `vp config`, `vp staged`: hook と staged-file チェックの入口

## セットアップ

1. `vp` をインストールする
2. `vp install` を実行する
3. `vp dev` で起動する

Node バージョンは `.node-version` を基準に揃えます。

`vp install` は依存解決に加えて `prepare` を通して `vp config` を実行し、`.vite-hooks/` に Vite+ の hook 設定を生成します。

## 主要コマンド

- `vp install`
- `vp dev`
- `vp build`
- `vp preview`
- `vp check`
- `vp lint`
- `vp fmt`
- `vp test`
- `vp run e2e`
- `vp run e2e:ci`
- `vp run check:fast`
- `vp run guard:local`
- `vp run guard:ci`
- `vp staged`

## 設定ファイル

- `vite.config.ts`
  - `build.rolldownOptions.output.codeSplitting` で `phaser` chunk を固定化
  - `test / lint / staged / run.tasks` を単一ファイルへ集約
- `.node-version`
  - `vp` と CI が使う Node バージョンの基準
- `playwright.config.ts`
  - 開発サーバ起動を `vp dev` に統一
- `.vite-hooks/`
  - `vp config` が生成する hook 設定
- `.github/workflows/*.yml`
  - `voidzero-dev/setup-vp` と `vp install` を使う

## 運用ルール

- formatter / linter / test / task / staged-file workflow は `vite.config.ts` に集約しています。
- package manager は `pnpm` ですが、日常運用は `pnpm` 直呼びではなく `vp` を優先します。
- `vp staged` は `vite.config.ts` の `staged` 設定に従って `vp check --fix` を実行します。
