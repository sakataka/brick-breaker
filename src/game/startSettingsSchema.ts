import { GAME_CONFIG, type SpeedPreset, STAGE_CATALOG } from "./config";
import { validateStageCatalog } from "./configSchema";
import type {
  DebugItemPreset,
  DebugScenario,
  Difficulty,
  GameMode,
  RoutePreference,
  StageDefinition,
} from "./types";

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

type SelectFieldKey =
  | "gameMode"
  | "difficulty"
  | "initialLives"
  | "speedPreset"
  | "routePreference"
  | "multiballMaxBalls"
  | "debugStartStage"
  | "debugScenario"
  | "debugItemPreset"
  | "debugRecordResults";

type ToggleFieldKey =
  | "challengeMode"
  | "dailyMode"
  | "riskMode"
  | "enableNewItemStacks"
  | "stickyItemEnabled"
  | "ghostReplayEnabled"
  | "bgmEnabled"
  | "sfxEnabled"
  | "debugModeEnabled"
  | "customStageJsonEnabled";

export interface StartSettingsSelectField<K extends SelectFieldKey = SelectFieldKey> {
  id: string;
  field: K;
  optionsKey: keyof StartSettingsOptionCatalog;
}

export interface StartSettingsToggleField<K extends ToggleFieldKey = ToggleFieldKey> {
  id: string;
  field: K;
}

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

export const BASIC_SELECT_FIELDS: readonly StartSettingsSelectField[] = [
  { id: "setting-mode", field: "gameMode", optionsKey: "gameMode" },
  { id: "setting-difficulty", field: "difficulty", optionsKey: "difficulty" },
  { id: "setting-lives", field: "initialLives", optionsKey: "initialLives" },
  { id: "setting-speed", field: "speedPreset", optionsKey: "speedPreset" },
  { id: "setting-route", field: "routePreference", optionsKey: "routePreference" },
  { id: "setting-multiball-max", field: "multiballMaxBalls", optionsKey: "multiballMaxBalls" },
];

export const BASIC_TOGGLE_FIELDS: readonly StartSettingsToggleField[] = [
  { id: "setting-challenge-mode", field: "challengeMode" },
  { id: "setting-daily-mode", field: "dailyMode" },
  { id: "setting-risk-mode", field: "riskMode" },
  { id: "setting-new-item-stacks", field: "enableNewItemStacks" },
  { id: "setting-sticky-item-enabled", field: "stickyItemEnabled" },
  { id: "setting-ghost-replay-enabled", field: "ghostReplayEnabled" },
  { id: "setting-bgm-enabled", field: "bgmEnabled" },
  { id: "setting-sfx-enabled", field: "sfxEnabled" },
];

export const DEBUG_SELECT_FIELDS: readonly StartSettingsSelectField[] = [
  { id: "setting-debug-start-stage", field: "debugStartStage", optionsKey: "debugStartStage" },
  { id: "setting-debug-scenario", field: "debugScenario", optionsKey: "debugScenario" },
  { id: "setting-debug-item-preset", field: "debugItemPreset", optionsKey: "debugItemPreset" },
  { id: "setting-debug-record-results", field: "debugRecordResults", optionsKey: "debugRecordResults" },
];

export function buildStartSettingsPatch<K extends keyof StartSettingsSelection>(
  field: K,
  value: string | boolean,
): Partial<StartSettingsSelection> {
  return {
    [field]: coerceStartSettingsValue(field, value),
  } as Partial<StartSettingsSelection>;
}

export function getDefaultCustomStageJson(): string {
  return JSON.stringify(STAGE_CATALOG, null, 2);
}

export function parseCustomStageCatalog(
  selected: Pick<StartSettingsSelection, "customStageJsonEnabled" | "customStageJson">,
): StageDefinition[] | null {
  if (!selected.customStageJsonEnabled) {
    return null;
  }
  const raw = selected.customStageJson.trim();
  if (raw.length <= 0) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as StageDefinition[];
    return validateStageCatalog(parsed);
  } catch {
    return null;
  }
}

function coerceStartSettingsValue<K extends keyof StartSettingsSelection>(
  field: K,
  value: string | boolean,
): StartSettingsSelection[K] {
  switch (field) {
    case "initialLives":
      return parseIntegerSetting(value, START_SETTINGS_DEFAULT.initialLives) as StartSettingsSelection[K];
    case "multiballMaxBalls":
      return parseIntegerSetting(
        value,
        START_SETTINGS_DEFAULT.multiballMaxBalls,
      ) as StartSettingsSelection[K];
    case "debugStartStage":
      return parseIntegerSetting(value, START_SETTINGS_DEFAULT.debugStartStage) as StartSettingsSelection[K];
    case "debugRecordResults":
      return (value === true || value === "true") as StartSettingsSelection[K];
    case "challengeMode":
    case "dailyMode":
    case "riskMode":
    case "enableNewItemStacks":
    case "stickyItemEnabled":
    case "ghostReplayEnabled":
    case "bgmEnabled":
    case "sfxEnabled":
    case "debugModeEnabled":
    case "customStageJsonEnabled":
      return Boolean(value) as StartSettingsSelection[K];
    case "challengeSeedCode":
      return String(value).trim() as StartSettingsSelection[K];
    case "customStageJson":
      return String(value) as StartSettingsSelection[K];
    default:
      return value as StartSettingsSelection[K];
  }
}

function parseIntegerSetting(value: string | boolean, fallback: number): number {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}
