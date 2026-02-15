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
  label: string;
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
  status: string;
  currentCostText: string;
  priceBandText: string;
  optionALabel: string;
  optionBLabel: string;
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
}

const DEFAULT_HUD: HudViewModel = {
  scoreText: "スコア: 0",
  livesText: "残機: 4",
  timeText: "時間: 00:00",
  stageText: "ステージ: 1/12",
  comboText: "コンボ x1.00",
  focusText: "FOCUS: READY(F)",
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
  priceBandText: "",
  optionALabel: "選択肢A",
  optionBLabel: "選択肢B",
  optionADisabled: true,
  optionBDisabled: true,
};

export const START_SETTINGS_OPTIONS: StartSettingsOptionCatalog = {
  gameMode: [
    { value: "campaign", label: "キャンペーン" },
    { value: "endless", label: "エンドレス" },
    { value: "boss_rush", label: "ボスラッシュ" },
  ] as const,
  difficulty: [
    { value: "casual", label: "カジュアル" },
    { value: "standard", label: "スタンダード" },
    { value: "hard", label: "ハード" },
  ] as const,
  initialLives: [1, 2, 3, 4, 5, 6].map((value) => ({ value, label: String(value) })),
  speedPreset: [
    { value: "0.75", label: "75%" },
    { value: "1.00", label: "100%" },
    { value: "1.25", label: "125%" },
  ] as const,
  routePreference: [
    { value: "auto", label: "自動" },
    { value: "A", label: "Aルート" },
    { value: "B", label: "Bルート" },
  ] as const,
  multiballMaxBalls: [2, 3, 4, 5, 6].map((value) => ({ value, label: String(value) })),
  debugStartStage: Array.from({ length: 12 }, (_, index) => index + 1).map((value) => ({
    value,
    label: String(value),
  })),
  debugScenario: [
    { value: "normal", label: "通常" },
    { value: "enemy_check", label: "敵確認（9面）" },
    { value: "boss_check", label: "ボス確認（12面）" },
  ] as const,
  debugItemPreset: [
    { value: "none", label: "なし" },
    { value: "combat_check", label: "戦闘確認" },
    { value: "boss_check", label: "ボス確認" },
  ] as const,
  debugRecordResults: [
    { value: "false", label: "記録しない" },
    { value: "true", label: "記録する" },
  ] as const,
};

export const START_SETTINGS_DEFAULT: StartSettingsSelection = {
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
