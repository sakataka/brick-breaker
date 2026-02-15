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
        gameMode: "campaign",
        debugModeEnabled: false,
        debugScenario: "boss_check",
        debugStartStage: 12,
      } as never),
    ).toBe(0);
    expect(
      resolveStartStageIndex({
        gameMode: "campaign",
        debugModeEnabled: true,
        debugScenario: "enemy_check",
        debugStartStage: 1,
      } as never),
    ).toBe(8);
    expect(
      resolveStartStageIndex({
        gameMode: "campaign",
        debugModeEnabled: true,
        debugScenario: "boss_check",
        debugStartStage: 1,
      } as never),
    ).toBe(11);
    expect(
      resolveStartStageIndex({
        gameMode: "campaign",
        debugModeEnabled: true,
        debugScenario: "normal",
        debugStartStage: 5,
      } as never),
    ).toBe(4);
    expect(
      resolveStartStageIndex({
        gameMode: "boss_rush",
        debugModeEnabled: false,
        debugScenario: "normal",
        debugStartStage: 1,
      } as never),
    ).toBe(0);
  });

  test("computeAppliedStartSettings applies config/audio and challenge seed", () => {
    const selected = {
      difficulty: "hard",
      initialLives: 2,
      speedPreset: "1.25",
      multiballMaxBalls: 4,
      challengeMode: true,
      dailyMode: false,
      challengeSeedCode: "",
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
      gameMode: "boss_rush",
      riskMode: true,
      enableNewItemStacks: true,
      stickyItemEnabled: true,
      ghostReplayEnabled: true,
      debugModeEnabled: true,
      debugRecordResults: true,
      debugScenario: "enemy_check",
      debugItemPreset: "combat_check",
      routePreference: "B",
      customStageJsonEnabled: false,
      customStageJson: "",
    } as never);
    expect(state.options.gameMode).toBe("boss_rush");
    expect(state.options.riskMode).toBe(true);
    expect(state.options.enableNewItemStacks).toBe(true);
    expect(state.options.stickyItemEnabled).toBe(true);
    expect(state.options.ghostReplayEnabled).toBe(true);
    expect(state.options.debugModeEnabled).toBe(true);
    expect(state.options.debugRecordResults).toBe(true);
    expect(state.options.debugScenario).toBe("enemy_check");
    expect(state.options.debugItemPreset).toBe("combat_check");
    expect(state.campaign.routePreference).toBe("B");
  });

  test("applyStartSettingsToState safely ignores invalid custom stage json", () => {
    const state = createInitialGameState(GAME_CONFIG, true, "start");
    applyStartSettingsToState(state, {
      gameMode: "campaign",
      riskMode: false,
      enableNewItemStacks: false,
      stickyItemEnabled: false,
      ghostReplayEnabled: false,
      debugModeEnabled: false,
      debugRecordResults: false,
      debugScenario: "normal",
      debugItemPreset: "none",
      routePreference: "auto",
      customStageJsonEnabled: true,
      customStageJson: "{invalid",
    } as never);
    expect(state.options.customStageCatalog).toBeNull();
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
