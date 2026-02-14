import type { Scene } from "../../game/types";

export interface OverlayCopy {
  message: string;
  sub: string;
  button: string;
}

export const OVERLAY_COPY: Record<Scene, OverlayCopy> = {
  start: {
    message: "ブロック崩し",
    sub: "マウスでバーを移動してボールをたたき返してください。",
    button: "ゲーム開始",
  },
  story: {
    message: "ステージ演出",
    sub: "物語テキスト",
    button: "続行",
  },
  paused: {
    message: "一時停止中",
    sub: "Pキーで再開できます。",
    button: "再開",
  },
  gameover: {
    message: "ゲームオーバー",
    sub: "最終スコアを確認して、再開ボタンでリトライできます。",
    button: "もう一度",
  },
  playing: {
    message: "",
    sub: "",
    button: "",
  },
  clear: {
    message: "全ステージクリア！",
    sub: "キャンペーン結果",
    button: "タイトルへ戻る",
  },
  stageclear: {
    message: "ステージクリア！",
    sub: "次のステージへ進みます。",
    button: "次へ",
  },
  error: {
    message: "エラーが発生しました",
    sub: "画面を再読み込みして再開してください。",
    button: "再読み込み",
  },
};
