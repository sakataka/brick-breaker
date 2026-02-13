import { getActiveItemLabels } from "./itemSystem";
import type { GameState } from "./types";

export interface HudElements {
  score: HTMLSpanElement;
  lives: HTMLSpanElement;
  time: HTMLSpanElement;
  stage: HTMLSpanElement;
  items: HTMLSpanElement;
}

export function updateHud(hud: HudElements, state: GameState): void {
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
