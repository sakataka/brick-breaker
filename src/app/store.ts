import { create } from "zustand";
import { GAME_CONFIG, type SpeedPreset } from "../game/config";
import type { HudViewModel, OverlayViewModel } from "../game/renderTypes";
import type {
  DebugItemPreset,
  DebugScenario,
  Difficulty,
  GameMode,
  RogueUpgradeType,
  RoutePreference,
} from "../game/types";
import { type AppLocale, initializeLocale, setCurrentLocale } from "../i18n";

export interface GameSettings {
  gameMode: GameMode;
  difficulty: Difficulty;
  initialLives: number;
  speedPreset: SpeedPreset;
  routePreference: RoutePreference;
  multiballMaxBalls: number;
  riskMode: boolean;
  enableNewItemStacks: boolean;
  stickyItemEnabled: boolean;
  ghostReplayEnabled: boolean;
  debugModeEnabled: boolean;
  debugStartStage: number;
  debugScenario: DebugScenario;
  debugItemPreset: DebugItemPreset;
  debugRecordResults: boolean;
  challengeMode: boolean;
  dailyMode: boolean;
  challengeSeedCode: string;
  customStageJsonEnabled: boolean;
  customStageJson: string;
}

export interface AudioSettings {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
}

export interface StartSettingsSelection extends GameSettings, AudioSettings {}

export interface SelectOption<T extends string | number> {
  value: T;
}

export interface StartSettingsOptionCatalog {
  gameMode: readonly SelectOption<GameMode>[];
  difficulty: readonly SelectOption<Difficulty>[];
  initialLives: readonly SelectOption<number>[];
  speedPreset: readonly SelectOption<SpeedPreset>[];
  routePreference: readonly SelectOption<RoutePreference>[];
  multiballMaxBalls: readonly SelectOption<number>[];
  debugStartStage: readonly SelectOption<number>[];
  debugScenario: readonly SelectOption<DebugScenario>[];
  debugItemPreset: readonly SelectOption<DebugItemPreset>[];
  debugRecordResults: readonly SelectOption<"false" | "true">[];
}

export interface UiOverlayState {
  model: OverlayViewModel;
}

export interface ShopViewState {
  visible: boolean;
  status: "hidden" | "one_time" | "purchased";
  cost: number;
  priceBandVisible: boolean;
  optionAType: import("../game/types").ItemType | null;
  optionBType: import("../game/types").ItemType | null;
  optionADisabled: boolean;
  optionBDisabled: boolean;
}

interface UiHandlers {
  primaryAction: () => void;
  shopOption: (index: 0 | 1) => void;
}

interface AppStoreState {
  hud: HudViewModel;
  overlay: UiOverlayState;
  shop: ShopViewState;
  startSettings: StartSettingsSelection;
  locale: AppLocale;
  rogueSelection: RogueUpgradeType;
  handlers: UiHandlers;
  setHud: (hud: HudViewModel) => void;
  setOverlayModel: (model: OverlayViewModel) => void;
  setShop: (shop: ShopViewState) => void;
  setStartSettings: (patch: Partial<StartSettingsSelection>) => void;
  setLocale: (locale: AppLocale) => void;
  setRogueSelection: (selection: RogueUpgradeType) => void;
  setHandlers: (handlers: Partial<UiHandlers>) => void;
  triggerPrimaryAction: () => void;
  triggerShopOption: (index: 0 | 1) => void;
}

const initialLocale = typeof window === "undefined" ? "ja" : initializeLocale(window);

const DEFAULT_HUD: HudViewModel = {
  score: 0,
  lives: 4,
  elapsedSec: 0,
  comboMultiplier: 1,
  stage: {
    mode: "campaign",
    current: 1,
    total: 12,
    route: null,
    debugModeEnabled: false,
    debugRecordResults: false,
  },
  activeItems: [],
  flags: {
    hazardBoostActive: false,
    pierceSlowSynergy: false,
    riskMode: false,
    rogueUpgradesTaken: 0,
    rogueUpgradeCap: 3,
    magicCooldownSec: 0,
    warpLegendVisible: false,
  },
  progressRatio: 0,
  accentColor: "#29d3ff",
};

const DEFAULT_OVERLAY: OverlayViewModel = {
  scene: "start",
  score: 0,
  lives: 4,
  stage: {
    mode: "campaign",
    current: 1,
    total: 12,
    debugModeEnabled: false,
    debugRecordResults: false,
  },
};

const DEFAULT_SHOP: ShopViewState = {
  visible: false,
  status: "hidden",
  cost: 0,
  priceBandVisible: false,
  optionAType: null,
  optionBType: null,
  optionADisabled: true,
  optionBDisabled: true,
};

export const START_SETTINGS_OPTIONS: StartSettingsOptionCatalog = {
  gameMode: [{ value: "campaign" }, { value: "endless" }, { value: "boss_rush" }] as const,
  difficulty: [{ value: "casual" }, { value: "standard" }, { value: "hard" }] as const,
  initialLives: [1, 2, 3, 4, 5, 6].map((value) => ({ value })),
  speedPreset: [{ value: "0.75" }, { value: "1.00" }, { value: "1.25" }] as const,
  routePreference: [{ value: "auto" }, { value: "A" }, { value: "B" }] as const,
  multiballMaxBalls: [2, 3, 4, 5, 6].map((value) => ({ value })),
  debugStartStage: Array.from({ length: 12 }, (_, index) => index + 1).map((value) => ({ value })),
  debugScenario: [{ value: "normal" }, { value: "enemy_check" }, { value: "boss_check" }] as const,
  debugItemPreset: [{ value: "none" }, { value: "combat_check" }, { value: "boss_check" }] as const,
  debugRecordResults: [{ value: "false" }, { value: "true" }] as const,
};

const START_SETTINGS_DEFAULT: StartSettingsSelection = {
  gameMode: "campaign",
  difficulty: "standard",
  initialLives: GAME_CONFIG.initialLives,
  speedPreset: "1.00",
  routePreference: "auto",
  multiballMaxBalls: GAME_CONFIG.multiballMaxBalls,
  riskMode: false,
  enableNewItemStacks: false,
  stickyItemEnabled: false,
  ghostReplayEnabled: false,
  debugModeEnabled: false,
  debugStartStage: 1,
  debugScenario: "normal",
  debugItemPreset: "none",
  debugRecordResults: false,
  challengeMode: false,
  dailyMode: false,
  challengeSeedCode: "",
  customStageJsonEnabled: false,
  customStageJson: "",
  bgmEnabled: true,
  sfxEnabled: true,
};

export const useAppStore = create<AppStoreState>((set, get) => ({
  hud: DEFAULT_HUD,
  overlay: { model: DEFAULT_OVERLAY },
  shop: DEFAULT_SHOP,
  startSettings: START_SETTINGS_DEFAULT,
  locale: initialLocale,
  rogueSelection: "score_core",
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
  setRogueSelection: (selection) => set({ rogueSelection: selection }),
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
