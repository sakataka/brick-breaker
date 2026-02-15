import { describe, expect, test } from "bun:test";
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
  test("resolveStartStageIndex follows debug scenario overrides", () => {
    expect(
      resolveStartStageIndex({
        debugModeEnabled: false,
        debugScenario: "boss_check",
        debugStartStage: 12,
      } as never),
    ).toBe(0);
    expect(
      resolveStartStageIndex({
        debugModeEnabled: true,
        debugScenario: "enemy_check",
        debugStartStage: 1,
      } as never),
    ).toBe(8);
    expect(
      resolveStartStageIndex({
        debugModeEnabled: true,
        debugScenario: "boss_check",
        debugStartStage: 1,
      } as never),
    ).toBe(11);
    expect(
      resolveStartStageIndex({
        debugModeEnabled: true,
        debugScenario: "normal",
        debugStartStage: 5,
      } as never),
    ).toBe(4);
  });

  test("computeAppliedStartSettings applies config/audio and challenge seed", () => {
    const selected = {
      difficulty: "hard",
      initialLives: 2,
      speedPreset: "1.25",
      multiballMaxBalls: 4,
      challengeMode: true,
      dailyMode: false,
      bgmEnabled: false,
      sfxEnabled: true,
      debugModeEnabled: true,
      debugScenario: "boss_check",
      debugStartStage: 1,
    } as never;
    const applied = computeAppliedStartSettings(GAME_CONFIG, baseRandom, selected, (base, setup) => ({
      ...base,
      difficulty: setup.difficulty,
    }));

    expect(applied.config.difficulty).toBe("hard");
    expect(applied.audioSettings).toEqual({ bgmEnabled: false, sfxEnabled: true });
    expect(applied.pendingStartStageIndex).toBe(11);
    expect(applied.random.next()).not.toBe(baseRandom.next());
  });

  test("applyStartSettingsToState copies run options to state", () => {
    const state = createInitialGameState(GAME_CONFIG, true, "start");
    applyStartSettingsToState(state, {
      riskMode: true,
      enableNewItemStacks: true,
      stickyItemEnabled: true,
      debugModeEnabled: true,
      debugRecordResults: true,
      debugScenario: "enemy_check",
      debugItemPreset: "combat_check",
      routePreference: "B",
    } as never);
    expect(state.options.riskMode).toBe(true);
    expect(state.options.enableNewItemStacks).toBe(true);
    expect(state.options.stickyItemEnabled).toBe(true);
    expect(state.options.debugModeEnabled).toBe(true);
    expect(state.options.debugRecordResults).toBe(true);
    expect(state.options.debugScenario).toBe("enemy_check");
    expect(state.options.debugItemPreset).toBe("combat_check");
    expect(state.campaign.routePreference).toBe("B");
  });

  test("applyDebugPresetOnRoundStart only applies in debug mode", () => {
    const state = createInitialGameState(GAME_CONFIG, true, "playing");
    state.options.debugModeEnabled = false;
    state.options.debugItemPreset = "boss_check";
    applyDebugPresetOnRoundStart(state, baseRandom, GAME_CONFIG.multiballMaxBalls);
    expect(state.items.active.shieldCharges).toBe(0);

    state.options.debugModeEnabled = true;
    applyDebugPresetOnRoundStart(state, baseRandom, GAME_CONFIG.multiballMaxBalls);
    expect(state.items.active.shieldCharges).toBeGreaterThan(0);
  });
});
