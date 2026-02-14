import { buildHudViewModel } from "./renderPresenter";
import type { HudViewModel } from "./renderTypes";
import type { GameState } from "./types";

const previousScores = new WeakMap<HTMLSpanElement, number>();
const popTimers = new WeakMap<HTMLSpanElement, ReturnType<typeof setTimeout>>();

export interface HudElements {
  score: HTMLSpanElement;
  lives: HTMLSpanElement;
  time: HTMLSpanElement;
  stage: HTMLSpanElement;
  combo: HTMLSpanElement;
  items: HTMLSpanElement;
  a11y: HTMLSpanElement;
}

export function updateHud(hud: HudElements, state: GameState): void {
  const model = buildHudViewModel(state);
  applyHudViewModel(hud, model, state.score);
}

export function applyHudViewModel(hud: HudElements, model: HudViewModel, score: number): void {
  animateScorePop(hud.score, score);
  hud.score.textContent = model.scoreText;
  hud.lives.textContent = model.livesText;
  hud.time.textContent = model.timeText;
  hud.stage.textContent = model.stageText;
  hud.combo.textContent = model.comboText;
  hud.items.textContent = model.itemsText;
  hud.a11y.textContent = model.accessibilityText;
  const hudRoot = hud.score.parentElement;
  if (hudRoot) {
    hudRoot.style.setProperty("--hud-accent", model.accentColor);
  }
}

function animateScorePop(element: HTMLSpanElement, score: number): void {
  const previous = previousScores.get(element);
  previousScores.set(element, score);
  if (previous === undefined || score <= previous) {
    return;
  }

  const gain = score - previous;
  element.classList.remove("pop", "pop-large");
  void element.offsetWidth;
  element.classList.add("pop");
  if (gain >= 300) {
    element.classList.add("pop-large");
  }

  const active = popTimers.get(element);
  if (active) {
    clearTimeout(active);
  }
  const timer = setTimeout(() => {
    element.classList.remove("pop", "pop-large");
  }, 130);
  popTimers.set(element, timer);
}
