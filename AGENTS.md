# AGENTS.md

このファイルは `Brick Breaker` リポジトリで作業するエージェント向けの運用ガイドです。  
目的は「現行 shipped 実装に沿って変更し、機能追加しやすく、誤修正と doc drift を減らす」ことです。

## 基本原則

- シンプルさを優先する（`YAGNI` / `KISS` / `DRY`）
- 高コストな互換 shim や fallback を安易に追加しない
- 日常の操作は `vp` を使う
- package manager は `pnpm` だが、通常の dev/build/check/test は `vp` を優先する
- ローカルの標準シェルは `zsh`

## 1. プロジェクト概要

- 構成: `Vite+ + TypeScript`
- ゲーム実行: `Phaser`
- UI: `React + Zustand`
- サウンド: `Tone/WebAudio`
- shipped 仕様: browser-first campaign、`12 encounter + Threat Tier 2`

## 2. 必ず参照する場所

- 利用者向け仕様: `README.md`
- 実装者向け設計: `docs/architecture.md`
- ツール運用: `docs/toolchain.md`

## 3. アーキテクチャ責務

- Core ロジック: `src/game-v2/engine/*`, `src/game-v2/content/*`, `src/game-v2/public/*`
- Orchestrator: `src/game-v2/session/GameSession.ts`, `src/game-v2/session/RuntimeController.ts`
- 描画 host: `src/phaser/*`
- UI: `src/app/*`
- Audio: `src/audio/*`

ルール:

1. ゲームルールを React コンポーネントへ直接書かない
2. `src/game-v2/engine/*` は DOM / Phaser / Audio API を直接触らない
3. 仕様分岐は `content` / `config` / presenter に寄せる
4. runtime state は `scene / run / encounter / combat / ui` を正式 contract とする

## 4. 実装ガイドライン

1. 既存の shipped flow（start -> playing -> stageclear -> clear / gameover）を維持する
2. 追加仕様は「型 -> ロジック -> 表示 -> テスト -> ドキュメント」の順で反映する
3. ドキュメントには相対パスを使う
4. shipped 開始設定は `difficulty / reducedMotionEnabled / highContrastEnabled / bgmEnabled / sfxEnabled` を前提に扱う
5. run 進行は `threatTier: 1 | 2` を前提にする
6. ショップ仕様は「1 encounter 1 回の 2 択購入」を維持し、無料交換は追加しない
7. 新 encounter は `src/game-v2/content/encounters.ts` + `src/game-v2/content/stageBlueprints.ts` を入口に追加する
8. 新 module は `src/game-v2/content/modules.ts` を入口にし、低レベル effect は `src/game-v2/public/items.ts` / `src/game-v2/engine/*` に追加する
9. 新 theme は `src/game-v2/content/themes.ts` と `src/art/themePalettes.ts` を入口にし、palette を `src/art/visualAssets.ts` に戻さない

## 5. 変更時のチェックリスト

1. 型定義更新
2. ロジック反映
3. UI / Phaser 反映
4. サウンド反映
5. テスト追加・更新
6. ドキュメント更新（`README.md`, `docs/architecture.md`, 必要なら `docs/toolchain.md`）

## 6. 品質ゲート

```bash
vp fmt . --check
vp test
vp run typecheck
vp run check:arch
vp run deadcode:report
vp run guard:test-state-shape
vp run guard:ai-first-boundaries
vp run e2e
```

## 7. UI / UX ルール

- 開始画面は「ヘッダー / 設定スクロール / 固定フッター（開始 CTA）」を維持する
- shipped UI には debug 設定を出さない
- プレイ中 UI は「上段情報バー（HUD + ショップ） / 下段ゲーム枠」を維持する
- HUD / Overlay / Shop の score, threat, preview 表示は presenter で正規化し、UI 側にロジックを増やさない

## 8. ドキュメント運用

- README には現行の公開仕様だけを書く
- architecture には現行実装だけを書く
- toolchain には実在するコマンドだけを書く
- 実装を変えたら、対応する docs も同じ turn で更新する

## 9. コミット運用

- 変更は機能単位でまとめる
- コミットメッセージは「何を変えたか」を明確にする
- コミット前に最低限 `vp fmt . --check` と `vp test` を通す
