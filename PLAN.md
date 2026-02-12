# ローカルWeb版ブロック崩し 実装計画（マウス操作・物理重視・モダンUI）

## 概要
PCローカルで遊べる1ステージ完結のブロック崩しを、`TypeScript + HTML5 Canvas`で実装します。  
操作はマウスのみ、バーはマウスXへ即時追従、ボールは固定タイムステップの物理更新で安定挙動を保証します。  
UIは「ミニマル + ガラス調」を採用し、開始・一時停止・ゲームオーバー導線を明確にします。

## 目標と成功基準
1. `bun run dev`でローカル起動し、ブラウザで即プレイできる。  
2. マウス移動だけでバー操作でき、入力遅延を感じない。  
3. ボール反射が破綻せず、壁・バー・ブロック衝突が一貫して正しく動く。  
4. 1ステージをクリア可能で、3ライフ制のゲームオーバーまで完走できる。  
5. 視認性の高いモダンUIで、状態遷移（開始/一時停止/終了）が直感的にわかる。

## スコープ
1. 初版に含む: 1ステージ、通常ブロックのみ、効果音のみ、開始/一時停止/ゲームオーバー。  
2. 初版に含まない: 複数ステージ、パワーアップ、ランキング、オンライン要素、モバイルタッチ最適化。

## ゲーム仕様（決定版）
1. 盤面サイズは内部解像度 `960x540`、表示はレスポンシブ拡大縮小。  
2. バーは幅 `120`、高さ `16`、下端固定、Xのみ移動、画面外クランプ。  
3. ボール半径は `8`、初速 `320 px/s`、最大 `620 px/s`。  
4. ライフは `3`、落球で `-1`、0でゲームオーバー。  
5. ブロックは `10列 x 6行`、全破壊でクリア。  
6. 得点は1ブロック `+100`、クリア時に残ライフボーナス `+500/ライフ`。  
7. バー反射はヒット位置で角度変化し、中央付近は浅く、端ほど最大 `±60°`。  
8. 連続衝突の不安定化を避けるため、1フレーム内で衝突解決を最大反復回数つきで実行。

## 物理・ループ仕様
1. 更新ループは `requestAnimationFrame` + 固定タイムステップ `1/120s`。  
2. 描画は可変FPS、物理は固定更新で分離。  
3. 衝突判定は円（ボール）対AABB（壁/バー/ブロック）。  
4. 反射ベクトルは法線ベースで算出し、毎フレーム速度を正規化してドリフト防止。  
5. トンネリング軽減として1ステップ内の移動量上限を管理し、高速時は分割更新。

## UI/ビジュアル仕様
1. トーンは「ミニマル + ガラス調」、背景は淡色グラデーション + ノイズ薄レイヤ。  
2. HUDは上部に `Score / Lives / Time` を横並び表示。  
3. オーバーレイは `Start`, `Paused`, `Game Over`, `Stage Clear` の4種。  
4. ボタンは半透明パネル、ぼかし、明確なホバー/フォーカス表示。  
5. 効果音は `壁反射`, `バー反射`, `破壊`, `ミス`, `クリア` の5種。  
6. 言語は日本語UI文言を標準とする。

## 主要インターフェース/型（追加予定）
```ts
type Scene = "start" | "playing" | "paused" | "gameover" | "clear";

interface Vector2 { x: number; y: number; }

interface Ball {
  pos: Vector2;
  vel: Vector2;
  radius: number;
  speed: number;
}

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  targetX: number;
}

interface Brick {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  alive: boolean;
}

interface GameState {
  scene: Scene;
  score: number;
  lives: number;
  elapsedSec: number;
  ball: Ball;
  paddle: Paddle;
  bricks: Brick[];
}

interface GameConfig {
  width: number;
  height: number;
  fixedDeltaSec: number;
  initialLives: number;
  initialBallSpeed: number;
  maxBallSpeed: number;
}
```

## 実装構成（ファイル計画）
1. `/Users/sakataka/youtube_speech/ブロック崩し/Brick Breaker/src/main.ts` エントリポイント。  
2. `/Users/sakataka/youtube_speech/ブロック崩し/Brick Breaker/src/game/Game.ts` ループと状態遷移。  
3. `/Users/sakataka/youtube_speech/ブロック崩し/Brick Breaker/src/game/physics.ts` 衝突・反射・速度制御。  
4. `/Users/sakataka/youtube_speech/ブロック崩し/Brick Breaker/src/game/level.ts` ブロック配置生成。  
5. `/Users/sakataka/youtube_speech/ブロック崩し/Brick Breaker/src/ui/overlay.ts` オーバーレイUI制御。  
6. `/Users/sakataka/youtube_speech/ブロック崩し/Brick Breaker/src/audio/sfx.ts` 効果音管理。  
7. `/Users/sakataka/youtube_speech/ブロック崩し/Brick Breaker/src/styles.css` ガラス調デザイン定義。  

## テストケースと受け入れ基準
1. バー追従: マウスX移動でバー中心が追従し、左右端で画面外に出ない。  
2. 壁反射: 左右上壁に当たるたび角度が反転し、速度が異常増減しない。  
3. バー反射: 左端/中央/右端ヒットで反射角が期待どおりに変化する。  
4. ブロック破壊: 接触したブロックのみ消え、スコアが100増える。  
5. 落球処理: 画面下に落ちたらライフ減少し、ボール再配置される。  
6. 終了条件: ライフ0でゲームオーバー、全破壊でクリア表示。  
7. 一時停止: プレイ中に一時停止すると物理更新が止まり、再開で継続。  
8. リサイズ: ウィンドウ変更時もアスペクト崩れなく表示される。  

## 実装フェーズ
1. プロジェクト雛形作成（Vite + TypeScript）とCanvas表示。  
2. コアゲームループとシーン管理。  
3. バー/ボール/壁の物理実装。  
4. ブロック配置と破壊判定、スコア/ライフ実装。  
5. オーバーレイUIとガラス調スタイル適用。  
6. 効果音実装とバランス調整。  
7. テスト観点の検証と最終調整。  

## 進捗
1. 完了（Bun運用整備）
2. 完了（Game.ts の状態遷移分割）
3. 完了（physics.ts の物理分割実装）
4. 進行中（UI/描画・レイアウト調整）

## 前提・デフォルト
1. 実行環境はPCブラウザ（最新のChrome/Edge/Safari想定）。  
2. ネット接続なしでもプレイ可能なローカル実行を前提。  
3. UI文言は日本語。  
4. 初版は操作性と物理安定性を最優先し、コンテンツ拡張は次段階とする。  
