import { GAME_CONFIG, type SpeedPreset } from "./config/gameplay";
import { ITEM_ORDER } from "./itemRegistry";
import type { CampaignCourse, Difficulty, ItemType } from "./types";

export interface GameSettings {
  campaignCourse: CampaignCourse;
  difficulty: Difficulty;
  initialLives: number;
  speedPreset: SpeedPreset;
  multiballMaxBalls: number;
  enableNewItemStacks: boolean;
  enabledItems: ItemType[];
  debugModeEnabled: boolean;
  debugStartStage: number;
  debugRecordResults: boolean;
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
  campaignCourse: readonly SelectOption<CampaignCourse>[];
  difficulty: readonly SelectOption<Difficulty>[];
  initialLives: readonly SelectOption<number>[];
  speedPreset: readonly SelectOption<SpeedPreset>[];
  multiballMaxBalls: readonly SelectOption<number>[];
  debugStartStage: readonly SelectOption<number>[];
  debugRecordResults: readonly SelectOption<"false" | "true">[];
}

type SelectFieldKey =
  | "campaignCourse"
  | "difficulty"
  | "initialLives"
  | "speedPreset"
  | "multiballMaxBalls"
  | "debugStartStage"
  | "debugRecordResults";

type ToggleFieldKey = "enableNewItemStacks" | "bgmEnabled" | "sfxEnabled" | "debugModeEnabled";

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
  campaignCourse: [{ value: "normal" }, { value: "ex" }] as const,
  difficulty: [{ value: "casual" }, { value: "standard" }, { value: "hard" }] as const,
  initialLives: [1, 2, 3, 4, 5, 6].map((value) => ({ value })),
  speedPreset: [{ value: "0.75" }, { value: "1.00" }, { value: "1.25" }] as const,
  multiballMaxBalls: [2, 3, 4, 5, 6].map((value) => ({ value })),
  debugStartStage: Array.from({ length: 12 }, (_, index) => index + 1).map((value) => ({ value })),
  debugRecordResults: [{ value: "false" }, { value: "true" }] as const,
};

export const START_SETTINGS_DEFAULT: StartSettingsSelection = {
  campaignCourse: "normal",
  difficulty: "standard",
  initialLives: GAME_CONFIG.initialLives,
  speedPreset: "1.00",
  multiballMaxBalls: GAME_CONFIG.multiballMaxBalls,
  enableNewItemStacks: false,
  enabledItems: [...ITEM_ORDER],
  debugModeEnabled: false,
  debugStartStage: 1,
  debugRecordResults: false,
  bgmEnabled: true,
  sfxEnabled: true,
};

export const BASIC_SELECT_FIELDS: readonly StartSettingsSelectField[] = [
  { id: "setting-campaign-course", field: "campaignCourse", optionsKey: "campaignCourse" },
  { id: "setting-difficulty", field: "difficulty", optionsKey: "difficulty" },
  { id: "setting-lives", field: "initialLives", optionsKey: "initialLives" },
  { id: "setting-speed", field: "speedPreset", optionsKey: "speedPreset" },
  { id: "setting-multiball-max", field: "multiballMaxBalls", optionsKey: "multiballMaxBalls" },
];

export const BASIC_TOGGLE_FIELDS: readonly StartSettingsToggleField[] = [
  { id: "setting-new-item-stacks", field: "enableNewItemStacks" },
  { id: "setting-bgm-enabled", field: "bgmEnabled" },
  { id: "setting-sfx-enabled", field: "sfxEnabled" },
];

export const DEBUG_SELECT_FIELDS: readonly StartSettingsSelectField[] = [
  { id: "setting-debug-start-stage", field: "debugStartStage", optionsKey: "debugStartStage" },
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
    case "enableNewItemStacks":
    case "bgmEnabled":
    case "sfxEnabled":
    case "debugModeEnabled":
      return Boolean(value) as StartSettingsSelection[K];
    case "enabledItems":
      return normalizeEnabledItems(Array.isArray(value) ? value : []) as StartSettingsSelection[K];
    default:
      return value as StartSettingsSelection[K];
  }
}

function parseIntegerSetting(value: string | boolean, fallback: number): number {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function normalizeEnabledItems(enabledItems: readonly ItemType[]): ItemType[] {
  const deduped = ITEM_ORDER.filter((type: ItemType) => enabledItems.includes(type));
  return deduped.length > 0 ? deduped : [...ITEM_ORDER];
}
