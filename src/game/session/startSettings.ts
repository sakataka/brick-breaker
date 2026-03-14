import type { StartSettingsSelection } from "../startSettingsSchema";
import type { GameAudioSettings, GameConfig, GameState, RandomSource } from "../types";

export interface AppliedStartSettings {
  config: GameConfig;
  random: RandomSource;
  audioSettings: GameAudioSettings;
  pendingStartStageIndex: number;
}

export function resolveStartStageIndex(selected: StartSettingsSelection): number {
  if (!selected.debugModeEnabled) {
    return 0;
  }
  return Math.max(0, Math.min(11, Math.round(selected.debugStartStage) - 1));
}

export function applyStartSettingsToState(
  state: GameState,
  selected: StartSettingsSelection,
): void {
  state.options.campaignCourse = selected.campaignCourse;
  state.options.enableNewItemStacks = selected.enableNewItemStacks;
  state.options.enabledItems = [...selected.enabledItems];
  state.options.debugModeEnabled = selected.debugModeEnabled;
  state.options.debugRecordResults = selected.debugRecordResults;
}

export function computeAppliedStartSettings(
  baseConfig: GameConfig,
  baseRandom: RandomSource,
  selected: StartSettingsSelection,
  buildStartConfig: (base: GameConfig, setup: StartSettingsSelection) => GameConfig,
): AppliedStartSettings {
  const config = buildStartConfig(baseConfig, selected);
  return {
    config,
    random: baseRandom,
    audioSettings: {
      bgmEnabled: selected.bgmEnabled,
      sfxEnabled: selected.sfxEnabled,
    },
    pendingStartStageIndex: resolveStartStageIndex(selected),
  };
}

export function applyDebugPresetOnRoundStart(): void {}
