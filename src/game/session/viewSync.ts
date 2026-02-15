import type { RenderPort, UiPort } from "../../core/ports";
import { buildHudViewModel, buildOverlayViewModel, buildRenderViewState } from "../renderPresenter";
import type { HudViewModel, OverlayViewModel, RenderViewState } from "../renderTypes";
import { buildShopUiView } from "../shopUi";
import type { GameState } from "../types";

export function syncViewPorts(
  state: GameState,
  renderPort: RenderPort<RenderViewState>,
  uiPort: UiPort<OverlayViewModel, HudViewModel, ReturnType<typeof buildShopUiView>>,
): void {
  renderPort.render(buildRenderViewState(state));
  uiPort.syncHud(buildHudViewModel(state));
  uiPort.syncOverlay(buildOverlayViewModel(state));
  uiPort.syncShop(buildShopUiView(state));
}
