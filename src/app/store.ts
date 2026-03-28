import { create } from "zustand";
import {
  createDefaultHudView,
  createDefaultOverlayView,
  createDefaultShopView,
  createInitialStartSettings,
} from "../game-v2/presenter/defaultViews";
import { readAccessibility } from "../game-v2/public/a11y";
import {
  DEFAULT_META_PROGRESS,
  type HudViewModel,
  type MetaProgress,
  type OverlayViewModel,
  readMetaProgress,
  type ShopUiView,
  type StartSettingsSelection,
} from "../game-v2/public";
import { type AppLocale, initializeLocale, setCurrentLocale } from "../i18n";

export interface UiOverlayState {
  model: OverlayViewModel;
}

interface UiHandlers {
  primaryAction: () => void;
  shopOption: (index: 0 | 1) => void;
}

interface AppStoreState {
  hud: HudViewModel;
  overlay: UiOverlayState;
  shop: ShopUiView;
  startSettings: StartSettingsSelection;
  locale: AppLocale;
  metaProgress: MetaProgress;
  handlers: UiHandlers;
  setHud: (hud: HudViewModel) => void;
  setOverlayModel: (model: OverlayViewModel) => void;
  setShop: (shop: ShopUiView) => void;
  setStartSettings: (patch: Partial<StartSettingsSelection>) => void;
  setLocale: (locale: AppLocale) => void;
  setMetaProgress: (metaProgress: MetaProgress) => void;
  setHandlers: (handlers: Partial<UiHandlers>) => void;
  triggerPrimaryAction: () => void;
  triggerShopOption: (index: 0 | 1) => void;
}

const initialLocale = typeof window === "undefined" ? "ja" : initializeLocale(window);
const initialMetaProgress =
  typeof window === "undefined" ? DEFAULT_META_PROGRESS : readMetaProgress(window.localStorage);
const initialAccessibility = typeof window === "undefined" ? null : readAccessibility(window);
const DEFAULT_HUD: HudViewModel = createDefaultHudView();
const DEFAULT_OVERLAY: OverlayViewModel = createDefaultOverlayView(initialMetaProgress);
const DEFAULT_SHOP: ShopUiView = createDefaultShopView();
const INITIAL_START_SETTINGS = createInitialStartSettings(initialAccessibility);

export const useAppStore = create<AppStoreState>((set, get) => ({
  hud: DEFAULT_HUD,
  overlay: { model: DEFAULT_OVERLAY },
  shop: DEFAULT_SHOP,
  startSettings: INITIAL_START_SETTINGS,
  locale: initialLocale,
  metaProgress: initialMetaProgress,
  handlers: {
    primaryAction: () => {},
    shopOption: () => {},
  },
  setHud: (hud) => set({ hud }),
  setOverlayModel: (model) => set({ overlay: { model } }),
  setShop: (shop) => set({ shop }),
  setStartSettings: (patch) =>
    set((state) => ({
      startSettings: {
        ...state.startSettings,
        ...patch,
      },
    })),
  setLocale: (locale) => {
    if (typeof window !== "undefined") {
      setCurrentLocale(locale, window.localStorage);
    } else {
      setCurrentLocale(locale);
    }
    set({ locale });
  },
  setMetaProgress: (metaProgress) => set({ metaProgress }),
  setHandlers: (handlers) =>
    set((state) => ({
      handlers: {
        ...state.handlers,
        ...handlers,
      },
    })),
  triggerPrimaryAction: () => {
    get().handlers.primaryAction();
  },
  triggerShopOption: (index) => {
    get().handlers.shopOption(index);
  },
}));

export const appStore = {
  getState: useAppStore.getState,
};
