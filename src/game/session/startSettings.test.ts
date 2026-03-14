import { describe, expect, test } from "vite-plus/test";
import { GAME_CONFIG } from "../config";
import { ITEM_ORDER } from "../itemRegistry";
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
  test("resolveStartStageIndex only honors debug start stage when debug is enabled", () => {
    expect(
      resolveStartStageIndex({
        campaignCourse: "normal",
        difficulty: "standard",
        initialLives: 4,
        speedPreset: "1.00",
        multiballMaxBalls: 4,
        enableNewItemStacks: false,
        enabledItems: [...ITEM_ORDER],
        debugRecordResults: false,
        bgmEnabled: true,
        sfxEnabled: true,
        debugModeEnabled: false,
        debugStartStage: 12,
      }),
    ).toBe(0);
    expect(
      resolveStartStageIndex({
        campaignCourse: "normal",
        difficulty: "standard",
        initialLives: 4,
        speedPreset: "1.00",
        multiballMaxBalls: 4,
        enableNewItemStacks: false,
        enabledItems: [...ITEM_ORDER],
        debugRecordResults: false,
        bgmEnabled: true,
        sfxEnabled: true,
        debugModeEnabled: true,
        debugStartStage: 5,
      }),
    ).toBe(4);
  });

  test("computeAppliedStartSettings applies config and audio without changing random source", () => {
    const selected = {
      campaignCourse: "ex",
      difficulty: "hard",
      initialLives: 2,
      speedPreset: "1.25",
      multiballMaxBalls: 4,
      enableNewItemStacks: true,
      enabledItems: ITEM_ORDER.slice(0, -1),
      debugModeEnabled: true,
      debugStartStage: 3,
      debugRecordResults: true,
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
        initialLives: setup.initialLives,
      }),
    );

    expect(applied.config.difficulty).toBe("hard");
    expect(applied.config.initialLives).toBe(2);
    expect(applied.audioSettings).toEqual({ bgmEnabled: false, sfxEnabled: true });
    expect(applied.pendingStartStageIndex).toBe(2);
    expect(applied.random).toBe(baseRandom);
  });

  test("applyStartSettingsToState copies reduced run options to state", () => {
    const state = createInitialGameState(GAME_CONFIG, true, "start");
    applyStartSettingsToState(state, {
      campaignCourse: "normal",
      difficulty: "standard",
      initialLives: 4,
      speedPreset: "1.00",
      multiballMaxBalls: 4,
      enableNewItemStacks: true,
      enabledItems: ITEM_ORDER.slice(0, -1),
      debugModeEnabled: true,
      debugStartStage: 4,
      debugRecordResults: true,
      bgmEnabled: true,
      sfxEnabled: true,
    });

    expect(state.options.campaignCourse).toBe("normal");
    expect(state.options.enableNewItemStacks).toBe(true);
    expect(state.options.enabledItems).toEqual(ITEM_ORDER.slice(0, -1));
    expect(state.options.debugModeEnabled).toBe(true);
    expect(state.options.debugRecordResults).toBe(true);
  });

  test("applyDebugPresetOnRoundStart is intentionally empty in campaign-first mode", () => {
    expect(() => applyDebugPresetOnRoundStart()).not.toThrow();
  });
});
