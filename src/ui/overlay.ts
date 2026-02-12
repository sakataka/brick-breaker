export type Scene = 'start' | 'playing' | 'paused' | 'gameover' | 'clear';

export interface OverlayElements {
  overlay: HTMLDivElement;
  message: HTMLParagraphElement;
  sub: HTMLParagraphElement;
  button: HTMLButtonElement;
}

export function getOverlayElements(documentRef: Document): OverlayElements {
  const overlay = documentRef.querySelector('#overlay') as HTMLDivElement;
  const message = documentRef.querySelector('#overlay-message') as HTMLParagraphElement;
  const sub = documentRef.querySelector('#overlay-sub') as HTMLParagraphElement;
  const button = documentRef.querySelector('#overlay-button') as HTMLButtonElement;

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

  if (scene === 'start') {
    elements.message.textContent = 'クリックしてゲーム開始';
    elements.sub.textContent = 'マウスでバーを移動してボールをたたき返してください。';
    elements.button.textContent = 'ゲーム開始';
    elements.button.disabled = false;
  }

  if (scene === 'paused') {
    elements.message.textContent = '一時停止中';
    elements.sub.textContent = 'Pキーで再開できます。';
    elements.button.textContent = '再開';
    elements.button.disabled = false;
  }

  if (scene === 'gameover') {
    elements.message.textContent = 'ゲームオーバー';
    elements.sub.textContent = `最終スコア ${score} / 残機 ${lives}`;
    elements.button.textContent = 'もう一度';
    elements.button.disabled = false;
  }

  if (scene === 'clear') {
    elements.message.textContent = 'ステージクリア！';
    elements.sub.textContent = `${score}点 ${clearTime ? `・${clearTime}` : ''} クリアしました。`;
    elements.button.textContent = 'やり直す';
    elements.button.disabled = false;
  }
}
