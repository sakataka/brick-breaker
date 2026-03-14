import { create } from "zustand";
import { type MetaProgress, readMetaProgress } from "../game/metaProgress";
import type { HudViewModel, OverlayViewModel } from "../game/renderTypes";
import type { ShopUiView } from "../game/shopUi";
import { START_SETTINGS_DEFAULT, type StartSettingsSelection } from "../game/startSettingsSchema";
import { getFallbackThemeTokens } from "../game/uiTheme";
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
  typeof window === "undefined" ? { exUnlocked: false } : readMetaProgress(window.localStorage);
const fallbackTokens = getFallbackThemeTokens();

const DEFAULT_HUD: HudViewModel = {
  score: 0,
  lives: 4,
  elapsedSec: 0,
  comboMultiplier: 1,
  stage: {
    current: 1,
    total: 12,
    route: null,
    debugModeEnabled: false,
    debugRecordResults: false,
  },
  activeItems: [],
  visual: {
    themeId: "chapter1",
    assetProfileId: "chapter1",
    chapterLabel: "Chapter 1",
    warningLevel: "calm",
    encounterEmphasis: "chapter",
    motionProfile: "full",
    tokens: fallbackTokens,
  },
  missionProgress: [],
  flags: {
    hazardBoostActive: false,
    pierceSlowSynergy: false,
    magicCooldownSec: 0,
    warpLegendVisible: false,
    steelLegendVisible: false,
    generatorLegendVisible: false,
    gateLegendVisible: false,
    turretLegendVisible: false,
  },
  progressRatio: 0,
};

const DEFAULT_OVERLAY: OverlayViewModel = {
  scene: "start",
  score: 0,
  lives: 4,
  stage: {
    current: 1,
    total: 12,
    debugModeEnabled: false,
    debugRecordResults: false,
  },
  visual: {
    themeId: "chapter1",
    assetProfileId: "chapter1",
    chapterLabel: "Chapter 1",
    warningLevel: "calm",
    encounterEmphasis: "chapter",
    motionProfile: "full",
    tokens: fallbackTokens,
  },
};

const DEFAULT_SHOP: ShopUiView = {
  visible: false,
  status: "hidden",
  cost: 0,
  priceBandVisible: false,
  optionAType: null,
  optionBType: null,
  optionADisabled: true,
  optionBDisabled: true,
};

export const useAppStore = create<AppStoreState>((set, get) => ({
  hud: DEFAULT_HUD,
  overlay: { model: DEFAULT_OVERLAY },
  shop: DEFAULT_SHOP,
  startSettings: START_SETTINGS_DEFAULT,
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
