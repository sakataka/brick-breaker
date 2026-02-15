import { create } from "zustand";
import { GAME_CONFIG, type SpeedPreset } from "../game/config";
import type { HudViewModel, OverlayViewModel } from "../game/renderTypes";
import type {
  DebugItemPreset,
  DebugScenario,
  Difficulty,
  RogueUpgradeType,
  RoutePreference,
} from "../game/types";

export interface GameSettings {
  difficulty: Difficulty;
  initialLives: number;
  speedPreset: SpeedPreset;
  routePreference: RoutePreference;
  multiballMaxBalls: number;
  riskMode: boolean;
  enableNewItemStacks: boolean;
  stickyItemEnabled: boolean;
  debugModeEnabled: boolean;
  debugStartStage: number;
  debugScenario: DebugScenario;
  debugItemPreset: DebugItemPreset;
  debugRecordResults: boolean;
  challengeMode: boolean;
  dailyMode: boolean;
}

export interface AudioSettings {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
}

export interface StartSettingsSelection extends GameSettings, AudioSettings {}

export interface UiOverlayState {
  model: OverlayViewModel;
}

export interface ShopViewState {
  visible: boolean;
  status: string;
  currentCostText: string;
  optionALabel: string;
  optionBLabel: string;
  optionADisabled: boolean;
  optionBDisabled: boolean;
  rerollVisible: boolean;
  rerollDisabled: boolean;
  rerollLabel: string;
}

interface UiHandlers {
  primaryAction: () => void;
  shopOption: (index: 0 | 1) => void;
  shopReroll: () => void;
}

interface AppStoreState {
  hud: HudViewModel;
  overlay: UiOverlayState;
  shop: ShopViewState;
  startSettings: StartSettingsSelection;
  rogueSelection: RogueUpgradeType;
  handlers: UiHandlers;
  setHud: (hud: HudViewModel) => void;
  setOverlayModel: (model: OverlayViewModel) => void;
  setShop: (shop: ShopViewState) => void;
  setStartSettings: (patch: Partial<StartSettingsSelection>) => void;
  setRogueSelection: (selection: RogueUpgradeType) => void;
  setHandlers: (handlers: Partial<UiHandlers>) => void;
  triggerPrimaryAction: () => void;
  triggerShopOption: (index: 0 | 1) => void;
  triggerShopReroll: () => void;
}

const DEFAULT_HUD: HudViewModel = {
  scoreText: "スコア: 0",
  livesText: "残機: 4",
  timeText: "時間: 00:00",
  stageText: "ステージ: 1/12",
  comboText: "コンボ x1.00",
  itemsText: "アイテム: -",
  accessibilityText: "表示: 標準",
  accentColor: "#29d3ff",
};

const DEFAULT_OVERLAY: OverlayViewModel = {
  scene: "start",
  score: 0,
  lives: 4,
  stageLabel: "ステージ 1 / 12",
};

const DEFAULT_SHOP: ShopViewState = {
  visible: false,
  status: "ショップ",
  currentCostText: "0点",
  optionALabel: "選択肢A",
  optionBLabel: "選択肢B",
  optionADisabled: true,
  optionBDisabled: true,
  rerollVisible: false,
  rerollDisabled: true,
  rerollLabel: "リロール",
};

const DEFAULT_SETTINGS: StartSettingsSelection = {
  difficulty: "standard",
  initialLives: GAME_CONFIG.initialLives,
  speedPreset: "1.00",
  routePreference: "auto",
  multiballMaxBalls: GAME_CONFIG.multiballMaxBalls,
  riskMode: false,
  enableNewItemStacks: false,
  stickyItemEnabled: false,
  debugModeEnabled: false,
  debugStartStage: 1,
  debugScenario: "normal",
  debugItemPreset: "none",
  debugRecordResults: false,
  challengeMode: false,
  dailyMode: false,
  bgmEnabled: true,
  sfxEnabled: true,
};

export const useAppStore = create<AppStoreState>((set, get) => ({
  hud: DEFAULT_HUD,
  overlay: { model: DEFAULT_OVERLAY },
  shop: DEFAULT_SHOP,
  startSettings: DEFAULT_SETTINGS,
  rogueSelection: "score_core",
  handlers: {
    primaryAction: () => {},
    shopOption: () => {},
    shopReroll: () => {},
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
  triggerShopReroll: () => {
    get().handlers.shopReroll();
  },
}));

export const appStore = {
  getState: useAppStore.getState,
};
