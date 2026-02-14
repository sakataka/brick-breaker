import { getActiveItemLabels } from "./itemSystem";
import type { GameState } from "./types";

const previousScores = new WeakMap<HTMLSpanElement, number>();
const popTimers = new WeakMap<HTMLSpanElement, ReturnType<typeof setTimeout>>();

export interface HudElements {
  score: HTMLSpanElement;
  lives: HTMLSpanElement;
  time: HTMLSpanElement;
  stage: HTMLSpanElement;
  items: HTMLSpanElement;
}

export function updateHud(hud: HudElements, state: GameState): void {
  animateScorePop(hud.score, state.score);
  hud.score.textContent = `SCORE: ${state.score}`;
  hud.lives.textContent = `LIVES: ${state.lives}`;
  hud.time.textContent = `TIME: ${formatTime(state.elapsedSec)}`;
  hud.stage.textContent = `STAGE: ${state.campaign.stageIndex + 1}/${state.campaign.totalStages}`;
  const activeItems = getActiveItemLabels(state.items, state.elapsedSec);
  hud.items.textContent = activeItems.length > 0 ? `ITEM: ${activeItems.join(" / ")}` : "ITEM: -";
}

export function formatTime(totalSec: number): string {
  const min = Math.floor(totalSec / 60);
  const sec = Math.floor(totalSec % 60);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
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
