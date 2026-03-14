import { applyDebugItemPreset, ensureMultiballCount } from "../itemSystem";
import { createSeededRandomSource } from "../random";
import { parseCustomStageCatalog, type StartSettingsSelection } from "../startSettingsSchema";
import type { GameAudioSettings, GameConfig, GameState, RandomSource } from "../types";

const CHALLENGE_MODE_SEED = 0x2f6e2b1d;

export interface AppliedStartSettings {
  config: GameConfig;
  random: RandomSource;
  audioSettings: GameAudioSettings;
  pendingStartStageIndex: number;
}

export function resolveStartStageIndex(selected: StartSettingsSelection): number {
  if (!selected.debugModeEnabled && selected.gameMode === "boss_rush") {
    return 0;
  }
  if (!selected.debugModeEnabled) {
    return 0;
  }
  if (selected.debugScenario === "enemy_check") {
    return 8;
  }
  if (selected.debugScenario === "boss_check") {
    return 11;
  }
  return Math.max(0, Math.min(11, Math.round(selected.debugStartStage) - 1));
}

export function applyStartSettingsToState(
  state: GameState,
  selected: StartSettingsSelection,
): void {
  state.options.gameMode = selected.gameMode;
  state.options.campaignCourse = selected.campaignCourse;
  state.options.riskMode = selected.riskMode;
  state.options.enableNewItemStacks = selected.enableNewItemStacks;
  state.options.enabledItems = [...selected.enabledItems];
  state.options.ghostReplayEnabled = selected.ghostReplayEnabled;
  state.options.customStageCatalog = parseCustomStageCatalog(selected);
  state.options.debugModeEnabled = selected.debugModeEnabled;
  state.options.debugRecordResults = selected.debugRecordResults;
  state.options.debugScenario = selected.debugScenario;
  state.options.debugItemPreset = selected.debugItemPreset;
  state.campaign.routePreference = selected.routePreference;
}

export function computeAppliedStartSettings(
  baseConfig: GameConfig,
  baseRandom: RandomSource,
  selected: StartSettingsSelection,
  buildStartConfig: (base: GameConfig, setup: StartSettingsSelection) => GameConfig,
): AppliedStartSettings {
  const config = buildStartConfig(baseConfig, selected);
  const random = resolveRandomSource(baseRandom, selected);
  return {
    config,
    random,
    audioSettings: {
      bgmEnabled: selected.bgmEnabled,
      sfxEnabled: selected.sfxEnabled,
    },
    pendingStartStageIndex: resolveStartStageIndex(selected),
  };
}

export function applyDebugPresetOnRoundStart(
  state: GameState,
  random: RandomSource,
  multiballMaxBalls: number,
): void {
  if (!state.options.debugModeEnabled) {
    return;
  }
  applyDebugItemPreset(
    state.items,
    state.options.debugItemPreset,
    state.options.enableNewItemStacks,
    state.options.enabledItems,
  );
  state.balls = ensureMultiballCount(state.items, state.balls, random, multiballMaxBalls);
}

function resolveRandomSource(
  baseRandom: RandomSource,
  selected: StartSettingsSelection,
): RandomSource {
  const customSeed = selected.challengeSeedCode.trim();
  if (customSeed.length > 0) {
    return createSeededRandomSource(hashSeedText(customSeed));
  }
  if (selected.challengeMode) {
    return createSeededRandomSource(CHALLENGE_MODE_SEED);
  }
  return baseRandom;
}

function hashSeedText(seedText: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seedText.length; i += 1) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
