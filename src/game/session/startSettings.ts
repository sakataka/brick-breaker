import type { StartSettingsSelection } from "../startSettingsSchema";
import type { GameAudioSettings, GameConfig, GameState, RandomSource } from "../types";

export interface AppliedStartSettings {
  config: GameConfig;
  random: RandomSource;
  audioSettings: GameAudioSettings;
  pendingStartStageIndex: number;
}

export function resolveStartStageIndex(_selected: StartSettingsSelection): number {
  return 0;
}

export function applyStartSettingsToState(
  state: GameState,
  selected: StartSettingsSelection,
): void {
  state.run.options.threatTier = 1;
  state.run.options.difficulty = selected.difficulty;
  state.run.options.reducedMotionEnabled = selected.reducedMotionEnabled;
  state.run.options.highContrastEnabled = selected.highContrastEnabled;
  state.run.options.bgmEnabled = selected.bgmEnabled;
  state.run.options.sfxEnabled = selected.sfxEnabled;
  state.ui.a11y.reducedMotion = selected.reducedMotionEnabled;
  state.ui.a11y.highContrast = selected.highContrastEnabled;
  state.ui.vfx.reducedMotion = selected.reducedMotionEnabled;
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
