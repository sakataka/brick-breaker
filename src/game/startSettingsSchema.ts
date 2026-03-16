import type { Difficulty } from "./types";

export interface GameSettings {
  difficulty: Difficulty;
  reducedMotionEnabled: boolean;
  highContrastEnabled: boolean;
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
  difficulty: readonly SelectOption<Difficulty>[];
}

type SelectFieldKey = "difficulty";

type ToggleFieldKey = "reducedMotionEnabled" | "highContrastEnabled" | "bgmEnabled" | "sfxEnabled";

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
  difficulty: [{ value: "casual" }, { value: "standard" }, { value: "hard" }] as const,
};

export const START_SETTINGS_DEFAULT: StartSettingsSelection = {
  difficulty: "standard",
  reducedMotionEnabled: false,
  highContrastEnabled: false,
  bgmEnabled: true,
  sfxEnabled: true,
};

export const BASIC_SELECT_FIELDS: readonly StartSettingsSelectField[] = [
  { id: "setting-difficulty", field: "difficulty", optionsKey: "difficulty" },
];

export const BASIC_TOGGLE_FIELDS: readonly StartSettingsToggleField[] = [
  { id: "setting-reduced-motion-enabled", field: "reducedMotionEnabled" },
  { id: "setting-high-contrast-enabled", field: "highContrastEnabled" },
  { id: "setting-bgm-enabled", field: "bgmEnabled" },
  { id: "setting-sfx-enabled", field: "sfxEnabled" },
];

export function buildStartSettingsPatch<K extends keyof StartSettingsSelection>(
  field: K,
  value: string | boolean,
): Partial<StartSettingsSelection> {
  return {
    [field]: coerceStartSettingsValue(field, value),
  } as Partial<StartSettingsSelection>;
}

function coerceStartSettingsValue<K extends keyof StartSettingsSelection>(
  field: K,
  value: string | boolean,
): StartSettingsSelection[K] {
  switch (field) {
    case "reducedMotionEnabled":
    case "highContrastEnabled":
    case "bgmEnabled":
    case "sfxEnabled":
      return Boolean(value) as StartSettingsSelection[K];
    default:
      return value as StartSettingsSelection[K];
  }
}
