# Toolchain

## 概要

このリポジトリは `Bun` を package manager と開発コマンドの入口として採用しています。  
日常操作は `bun run ...` を使い、unit test は `Vitest`、E2E は `Playwright` を使います。

サポート対象の compiler は `TypeScript 6.0` です。  

ローカルの標準シェルは `zsh` を前提とし、この文書のコマンド例も `zsh` 互換で記述します。

## セットアップ

1. `Bun 1.3.13` を用意する
2. `bun install` を実行する
3. `bun run dev` で起動する

`bun install` は依存解決を実行します。

## 主要コマンド

- `bun install`
- `bun run dev`
- `bun run build`
- `bun run preview`
- `bun run test`
- `bun run typecheck`
- `bun run e2e`
- `bun run e2e:ci`
- `bun run typesafe-i18n`

## 役割分担

- `bun run dev / build / preview`
  - Vite の dev server / build / preview
- `bun run test`
  - Vitest unit test の入口
- `bun run typecheck`
  - app/test/node の TypeScript 型検証
- `bun run e2e`
  - Playwright 実行
- `bun run e2e:ci`
  - `bun run preview -- --host 127.0.0.1 --port 4173` を使う CI 相当の E2E

## 設定ファイル

- `vite.config.ts`
  - primary config
  - `test / build` を集約
- `tsconfig.app.json` / `tsconfig.test.json` / `tsconfig.node.json`
  - app / test / Node-side config の TypeScript 境界
- `package.json`
  - project 固有 script の定義
- `bun.lock`
  - Bun の依存 lockfile
- `playwright.config.ts`
  - E2E 設定

## 運用ルール

- `bun` を唯一の package manager として扱う
- test / build workflow は `package.json` scripts と `vite.config.ts` を基準に扱う
- CI とローカルで使う task 名は README / AGENTS / architecture と一致させる
- docs に存在しない script 名を書かない
