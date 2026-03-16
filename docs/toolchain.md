# Toolchain

## 概要

このリポジトリは `Vite+` を開発コマンドの入口として採用しています。  
日常操作は `vp` を使い、package manager は `pnpm`、unit test は `vp test`、E2E は `Playwright` を使います。

ローカルの標準シェルは `zsh` を前提とし、この文書のコマンド例も `zsh` 互換で記述します。

## セットアップ

1. `vp` をインストールする
2. `vp install` を実行する
3. `vp dev` で起動する

`vp install` は依存解決に加えて `prepare` を通して `vp config` を実行し、`.vite-hooks/` を生成します。

## 主要コマンド

- `vp install`
- `vp dev`
- `vp build`
- `vp preview`
- `vp check`
- `vp lint`
- `vp fmt`
- `vp test`
- `vp run typecheck`
- `vp run deadcode`
- `vp run deadcode:report`
- `vp run check:arch`
- `vp run check:fast`
- `vp run guard:local`
- `vp run guard:ci`
- `vp run guard:test-state-shape`
- `vp run verify:change-coverage`
- `vp run e2e`
- `vp run e2e:ci`
- `vp run typesafe-i18n`
- `vp staged`

## 役割分担

- `vp dev / build / preview / check / lint / fmt`
  - Vite+ の統合コマンド
- `vp test`
  - unit test の入口
- `vp run typecheck`
  - app/test の TypeScript 型検証
- `vp run deadcode` / `vp run deadcode:report`
  - `knip` ベースの dead code 確認
- `vp run check:arch`
  - `dependency-cruiser` による依存境界チェック
- `vp run check:fast`
  - `vp check + vp test + vp run deadcode`
- `vp run guard:local`
  - `check:fast + check:arch`
- `vp run guard:ci`
  - `guard:local + verify:change-coverage + e2e:ci`
- `vp run guard:test-state-shape`
  - test code が旧 flat runtime state 参照へ戻っていないかを確認
- `vp run e2e`
  - Playwright 実行
- `vp run e2e:ci`
  - `vp preview --host 127.0.0.1 --port 4173` を使う CI 相当の E2E

## 設定ファイル

- `vite.config.ts`
  - primary config
  - `lint / test / staged / run.tasks / build` を集約
- `package.json`
  - project 固有 script の定義
- `.node-version`
  - Node バージョンの基準
- `playwright.config.ts`
  - E2E 設定
- `.vite-hooks/`
  - `vp config` が生成する hook 設定

## 運用ルール

- `pnpm` を直接使うより `vp` を優先する
- formatter / lint / test / staged-file workflow は `vite.config.ts` を基準に扱う
- CI とローカルで使う task 名は README / AGENTS / architecture と一致させる
- docs に存在しない script 名を書かない
