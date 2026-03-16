import { describe, expect, test } from "vite-plus/test";
import { GAME_CONFIG } from "../config";
import { createInitialGameState } from "../stateFactory";
import type { RandomSource } from "../types";
import {
  applyDebugPresetOnRoundStart,
  applyStartSettingsToState,
  computeAppliedStartSettings,
  resolveStartStageIndex,
} from "./startSettings";

const baseRandom: RandomSource = { next: () => 0.123 };

describe("session/startSettings", () => {
  test("resolveStartStageIndex stays at the first encounter in shipped mode", () => {
    expect(
      resolveStartStageIndex({
        difficulty: "standard",
        reducedMotionEnabled: false,
        highContrastEnabled: false,
        bgmEnabled: true,
        sfxEnabled: true,
      }),
    ).toBe(0);
  });

  test("computeAppliedStartSettings applies difficulty and audio without changing random", () => {
    const selected = {
      difficulty: "hard",
      reducedMotionEnabled: true,
      highContrastEnabled: true,
      bgmEnabled: false,
      sfxEnabled: true,
    } as const;
    const applied = computeAppliedStartSettings(
      GAME_CONFIG,
      baseRandom,
      selected,
      (base, setup) => ({
        ...base,
        difficulty: setup.difficulty,
        initialLives: 2,
      }),
    );

    expect(applied.config.difficulty).toBe("hard");
    expect(applied.config.initialLives).toBe(2);
    expect(applied.audioSettings).toEqual({ bgmEnabled: false, sfxEnabled: true });
    expect(applied.pendingStartStageIndex).toBe(0);
    expect(applied.random).toBe(baseRandom);
  });

  test("applyStartSettingsToState copies the shipped accessibility and audio surface", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "start");
    state.run.options.threatTier = 2;
    state.run.modulePolicy.allowExtendedStacks = true;
    state.run.modulePolicy.enabledTypes = [];

    applyStartSettingsToState(state, {
      difficulty: "standard",
      reducedMotionEnabled: true,
      highContrastEnabled: true,
      bgmEnabled: true,
      sfxEnabled: true,
    });

    expect(state.run.options.threatTier).toBe(1);
    expect(state.run.modulePolicy.allowExtendedStacks).toBe(true);
    expect(state.run.modulePolicy.enabledTypes).toEqual([]);
    expect(state.run.options.reducedMotionEnabled).toBe(true);
    expect(state.run.options.highContrastEnabled).toBe(true);
    expect(state.ui.a11y.reducedMotion).toBe(true);
    expect(state.ui.a11y.highContrast).toBe(true);
    expect(state.ui.vfx.reducedMotion).toBe(true);
  });

  test("applyDebugPresetOnRoundStart is intentionally empty in shipped mode", () => {
    expect(() => applyDebugPresetOnRoundStart()).not.toThrow();
  });
});
