import { appStore } from "../app/store";
import type { Renderer } from "./renderer";
import { buildHudViewModel, buildOverlayViewModel, buildRenderViewState } from "./renderPresenter";
import type { GameState } from "./types";

export function syncSceneOverlayUI(state: GameState): void {
  appStore.getState().setOverlayModel(buildOverlayViewModel(state));
}

export function renderGameFrame(renderer: Renderer, state: GameState): void {
  renderer.render(buildRenderViewState(state));
  appStore.getState().setHud(buildHudViewModel(state));
}
