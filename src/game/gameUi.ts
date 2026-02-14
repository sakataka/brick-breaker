import { type getOverlayElements, setSceneUI } from "../ui/overlay";
import { applyHudViewModel, type HudElements } from "./hud";
import type { Renderer } from "./renderer";
import { buildHudViewModel, buildOverlayViewModel, buildRenderViewState } from "./renderPresenter";
import type { GameState } from "./types";

export function syncSceneOverlayUI(overlay: ReturnType<typeof getOverlayElements>, state: GameState): void {
  const view = buildOverlayViewModel(state);
  setSceneUI(
    overlay,
    view.scene,
    view.score,
    view.lives,
    view.clearTime,
    view.errorMessage,
    view.stageLabel,
    view.stageResult,
    view.campaignResults,
    view.rogueOffer,
    view.storyText,
  );
}

export function renderGameFrame(renderer: Renderer, hud: HudElements, state: GameState): void {
  renderer.render(buildRenderViewState(state));
  applyHudViewModel(hud, buildHudViewModel(state), state.score);
}
