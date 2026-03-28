import { appStore } from "../../app/store";
import type {
  HudViewModel,
  MetaProgress,
  OverlayViewModel,
  ShopUiView,
  StartSettingsSelection,
} from "../public";

export interface AppUiBridge {
  uiPort: {
    syncOverlay: (view: OverlayViewModel) => void;
    syncHud: (view: HudViewModel) => void;
    syncShop: (view: ShopUiView) => void;
  };
  getStartSettings: () => StartSettingsSelection;
  setUiHandlers: (handlers: {
    primaryAction: () => void;
    shopOption: (index: 0 | 1) => void;
  }) => void;
  setMetaProgress: (metaProgress: MetaProgress) => void;
}

export function createAppUiBridge(): AppUiBridge {
  return {
    uiPort: {
      syncOverlay: (view) => appStore.getState().setOverlayModel(view),
      syncHud: (view) => appStore.getState().setHud(view),
      syncShop: (view) => appStore.getState().setShop(view),
    },
    getStartSettings: () => appStore.getState().startSettings,
    setUiHandlers: (handlers) => appStore.getState().setHandlers(handlers),
    setMetaProgress: (metaProgress) => appStore.getState().setMetaProgress(metaProgress),
  };
}
