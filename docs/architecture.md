# Architecture

## 目的

`README.md` の shipped 仕様を唯一の product spec として扱い、実装はその仕様を最短で追える構造に保つこと。  
game logic の owner は `src/game-v2/*` のみとし、削除済みの旧 runtime tree は再導入しません。

## TypeScript 方針

- サポート対象の compiler は `TypeScript 6.0`
- `tsconfig.app.json` / `tsconfig.test.json` / `tsconfig.node.json` に責務を分ける
- `TypeScript 7` native preview は `tsgo` による advisory check のみで扱う
- 新規実装は `src/game-v2/*` に集約する

## 実装の基準線

- product spec: `README.md`
- 実装方針: `docs/architecture.md`
- ツール運用: `docs/toolchain.md`

README に書かれていない仕様は shipped contract とみなしません。  
細かい runtime 事情より、公開仕様に直結する content / presenter / session contract を先に固定します。

## v2 レイヤー構成

### 1. Session

- `src/game-v2/session/GameSession.ts`

責務:

- `GameSession` を唯一の composition root とする
- public API は `start() / destroy() / createTestBridge()` に限定する

### 2. Adapters

- `src/game-v2/adapters/storeBridge.ts`

責務:

- `storeBridge` は app store と runtime の唯一の接続点
- `src/game-v2/*` はこの adapter を除き `src/app/*` を直接 import しない

### 2.5. Public Contracts

- `src/game-v2/public/*`

責務:

- app / phaser / main の公開依存先をここへ集約する
- HUD / Overlay / Shop / Render / StartSettings / TestBridge / theme helper の owner を v2 側へ置く
- 内部実装都合を UI/host へ漏らさない

### 3. Content

- `src/game-v2/content/runDefinition.ts`
- `src/game-v2/content/encounters.ts`
- `src/game-v2/content/modules.ts`
- `src/game-v2/content/themes.ts`

責務:

- shipped 仕様として見せる content contract を直接 authoring する
- `12 encounter campaign`、`Threat Tier 2`、`1 encounter 1 回 / 2 択購入` を public contract として固定する
- preview tags、score focus、theme catalog を UI と test で直接参照できる形にする

### 4. Engine Contract

- `src/game-v2/engine/runtimeContract.ts`

責務:

- runtime state の正式 shape を `scene / run / encounter / combat / ui` の 5 区画で固定する
- UI や test が旧 flat state に戻らないための確認点を提供する

### 5. Presenter

- `src/game-v2/presenter/defaultViews.ts`

責務:

- HUD / Overlay / Shop の default view を shipped contract から構成する
- store 側へ巨大な default literal を残さない
- React は presenter が返す view model を描画するだけに留める

## Runtime State

runtime の正式 shape は次の 5 区画です。

- `scene`
- `run`
- `encounter`
- `combat`
- `ui`

旧 flat runtime state を前提にした contract は使いません。  
state を外部へ見せる場合は、この 5 区画の投影で扱います。

## Data Flow

1. `src/main.ts` が `GameSession` を起動する
2. `src/game-v2/session/GameSession.ts` が store bridge と native runtime controller を組み立てる
3. `src/game-v2/session/RuntimeController.ts` が state を更新する
4. `src/game-v2/presenter/projectors.ts` が HUD / Overlay / Shop / Render に投影する
5. Phaser / React / Audio がそれぞれの port で同期する

## Test 方針

- public content contract は `src/game-v2/content/*.test.ts` で固定する
- runtime の 5 区画 shape は `src/game-v2/engine/runtimeContract.test.ts` で固定する
- `GameSession` の public API は `src/game-v2/session/GameSession.test.ts` で固定する
- default HUD / Overlay / Shop は `src/game-v2/presenter/defaultViews.test.ts` で固定する
- shipped 品質ゲートは引き続き `vp test`, `vp run typecheck`, `vp run check:arch`, `vp run guard:test-state-shape`, `vp run e2e` を使う
