import { getRequiredElement } from '../util/dom';
import type { Scene } from '../game/types';

interface OverlayCopy {
  message: string;
  sub: string;
  button: string;
}

export interface OverlayElements {
  overlay: HTMLDivElement;
  message: HTMLParagraphElement;
  sub: HTMLParagraphElement;
  button: HTMLButtonElement;
}

export const OVERLAY_COPY: Record<Scene, OverlayCopy> = {
  start: {
    message: 'クリックしてゲーム開始',
    sub: 'マウスでバーを移動してボールをたたき返してください。',
    button: 'ゲーム開始',
  },
  paused: {
    message: '一時停止中',
    sub: 'Pキーで再開できます。',
    button: '再開',
  },
  gameover: {
    message: 'ゲームオーバー',
    sub: '最終スコアを確認して、再開ボタンでリトライできます。',
    button: 'もう一度',
  },
  playing: {
    message: '',
    sub: '',
    button: '',
  },
  clear: {
    message: 'ステージクリア！',
    sub: '',
    button: 'やり直す',
  },
};

export function getOverlayElements(documentRef: Document): OverlayElements {
  const overlay = getRequiredElement<HTMLDivElement>(documentRef, '#overlay', 'overlay要素が見つかりません');
  const message = getRequiredElement<HTMLParagraphElement>(
    documentRef,
    '#overlay-message',
    'overlay-message要素が見つかりません',
  );
  const sub = getRequiredElement<HTMLParagraphElement>(documentRef, '#overlay-sub', 'overlay-sub要素が見つかりません');
  const button = getRequiredElement<HTMLButtonElement>(documentRef, '#overlay-button', 'overlay-button要素が見つかりません');

  return { overlay, message, sub, button };
}

export function setSceneUI(
  elements: OverlayElements,
  scene: Scene,
  score: number,
  lives: number,
  clearTime?: string,
): void {
  if (scene === 'playing') {
    elements.overlay.classList.add('hidden');
    return;
  }

  elements.overlay.classList.remove('hidden');
  const copy = OVERLAY_COPY[scene];
  elements.message.textContent = copy.message;
  elements.button.textContent = copy.button;
  elements.button.disabled = false;

  if (scene === 'start') {
    elements.sub.textContent = copy.sub;
    return;
  }

  if (scene === 'gameover') {
    elements.sub.textContent = `最終スコア ${score} / 残機 ${lives}`;
    return;
  }

  if (scene === 'clear') {
    elements.sub.textContent = `${score}点 ${clearTime ? `・${clearTime}` : ''} クリアしました。`;
    return;
  }

  elements.sub.textContent = copy.sub;
}
