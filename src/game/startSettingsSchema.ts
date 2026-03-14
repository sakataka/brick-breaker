import { GAME_CONFIG, type SpeedPreset } from "./config/gameplay";
import { STAGE_CATALOG } from "./config/stages";
import { validateStageCatalog } from "./configSchema";
import { ITEM_ORDER } from "./itemRegistryData";
import type {
  CampaignCourse,
  DebugItemPreset,
  DebugScenario,
  Difficulty,
  GameMode,
  ItemType,
  RoutePreference,
  StageDefinition,
} from "./types";

export interface GameSettings {
  gameMode: GameMode;
  campaignCourse: CampaignCourse;
  difficulty: Difficulty;
  initialLives: number;
  speedPreset: SpeedPreset;
  routePreference: RoutePreference;
  multiballMaxBalls: number;
  riskMode: boolean;
  enableNewItemStacks: boolean;
  enabledItems: ItemType[];
  ghostReplayEnabled: boolean;
  debugModeEnabled: boolean;
  debugStartStage: number;
  debugScenario: DebugScenario;
  debugItemPreset: DebugItemPreset;
  debugRecordResults: boolean;
  challengeMode: boolean;
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
  campaignCourse: readonly SelectOption<CampaignCourse>[];
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
  | "campaignCourse"
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
  | "riskMode"
  | "enableNewItemStacks"
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
  campaignCourse: [{ value: "normal" }, { value: "ex" }] as const,
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
  campaignCourse: "normal",
  difficulty: "standard",
  initialLives: GAME_CONFIG.initialLives,
  speedPreset: "1.00",
  routePreference: "auto",
  multiballMaxBalls: GAME_CONFIG.multiballMaxBalls,
  riskMode: false,
  enableNewItemStacks: false,
  enabledItems: [...ITEM_ORDER],
  ghostReplayEnabled: false,
  debugModeEnabled: false,
  debugStartStage: 1,
  debugScenario: "normal",
  debugItemPreset: "none",
  debugRecordResults: false,
  challengeMode: false,
  challengeSeedCode: "",
  customStageJsonEnabled: false,
  customStageJson: "",
  bgmEnabled: true,
  sfxEnabled: true,
};

export const BASIC_SELECT_FIELDS: readonly StartSettingsSelectField[] = [
  { id: "setting-mode", field: "gameMode", optionsKey: "gameMode" },
  { id: "setting-campaign-course", field: "campaignCourse", optionsKey: "campaignCourse" },
  { id: "setting-difficulty", field: "difficulty", optionsKey: "difficulty" },
  { id: "setting-lives", field: "initialLives", optionsKey: "initialLives" },
  { id: "setting-speed", field: "speedPreset", optionsKey: "speedPreset" },
  { id: "setting-route", field: "routePreference", optionsKey: "routePreference" },
  { id: "setting-multiball-max", field: "multiballMaxBalls", optionsKey: "multiballMaxBalls" },
];

export const BASIC_TOGGLE_FIELDS: readonly StartSettingsToggleField[] = [
  { id: "setting-challenge-mode", field: "challengeMode" },
  { id: "setting-risk-mode", field: "riskMode" },
  { id: "setting-new-item-stacks", field: "enableNewItemStacks" },
  { id: "setting-ghost-replay-enabled", field: "ghostReplayEnabled" },
  { id: "setting-bgm-enabled", field: "bgmEnabled" },
  { id: "setting-sfx-enabled", field: "sfxEnabled" },
];

export const DEBUG_SELECT_FIELDS: readonly StartSettingsSelectField[] = [
  { id: "setting-debug-start-stage", field: "debugStartStage", optionsKey: "debugStartStage" },
  { id: "setting-debug-scenario", field: "debugScenario", optionsKey: "debugScenario" },
  { id: "setting-debug-item-preset", field: "debugItemPreset", optionsKey: "debugItemPreset" },
  {
    id: "setting-debug-record-results",
    field: "debugRecordResults",
    optionsKey: "debugRecordResults",
  },
];

export function buildStartSettingsPatch<K extends keyof StartSettingsSelection>(
  field: K,
  value: string | boolean,
): Partial<StartSettingsSelection> {
  return {
    [field]: coerceStartSettingsValue(field, value),
  } as Partial<StartSettingsSelection>;
}

export function toggleEnabledItem(
  selected: Pick<StartSettingsSelection, "enabledItems">,
  itemType: ItemType,
  checked: boolean,
): Partial<StartSettingsSelection> {
  const current = normalizeEnabledItems(selected.enabledItems);
  if (checked) {
    return {
      enabledItems: current.includes(itemType) ? current : [...current, itemType],
    };
  }
  const next = current.filter((type) => type !== itemType);
  return {
    enabledItems: next.length > 0 ? next : current,
  };
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
      return parseIntegerSetting(
        value,
        START_SETTINGS_DEFAULT.initialLives,
      ) as StartSettingsSelection[K];
    case "multiballMaxBalls":
      return parseIntegerSetting(
        value,
        START_SETTINGS_DEFAULT.multiballMaxBalls,
      ) as StartSettingsSelection[K];
    case "debugStartStage":
      return parseIntegerSetting(
        value,
        START_SETTINGS_DEFAULT.debugStartStage,
      ) as StartSettingsSelection[K];
    case "debugRecordResults":
      return (value === true || value === "true") as StartSettingsSelection[K];
    case "challengeMode":
    case "riskMode":
    case "enableNewItemStacks":
    case "ghostReplayEnabled":
    case "bgmEnabled":
    case "sfxEnabled":
    case "debugModeEnabled":
    case "customStageJsonEnabled":
      return Boolean(value) as StartSettingsSelection[K];
    case "challengeSeedCode":
      return String(value).trim() as StartSettingsSelection[K];
    case "enabledItems":
      return normalizeEnabledItems(Array.isArray(value) ? value : []) as StartSettingsSelection[K];
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

function normalizeEnabledItems(value: readonly ItemType[]): ItemType[] {
  const filtered = ITEM_ORDER.filter((type) => value.includes(type));
  return filtered.length > 0 ? filtered : [...ITEM_ORDER];
}
