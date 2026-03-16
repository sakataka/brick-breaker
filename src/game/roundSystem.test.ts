import { describe, expect, test } from "vite-plus/test";

import { GAME_CONFIG, STAGE_CATALOG } from "./config";
import {
  advanceStage,
  applyLifeLoss,
  finalizeStageStats,
  getStageClearTimeSec,
  getStarRatingByScore,
  prepareStageStory,
  resetRoundState,
  retryCurrentStage,
} from "./roundSystem";
import { createInitialGameState } from "./stateFactory";
import type { RandomSource } from "./types";

const fixedRandom: RandomSource = {
  next: () => 0.5,
};

describe("roundSystem", () => {
  test("resetRoundState starts campaign from stage 1", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "start");
    resetRoundState(state, GAME_CONFIG, false, fixedRandom);

    expect(state.run.progress.encounterIndex).toBe(0);
    expect(state.run.progress.totalEncounters).toBe(STAGE_CATALOG.length);
    expect(state.run.progress.encounterStartScore).toBe(0);
    expect(state.run.lives).toBe(GAME_CONFIG.initialLives);
    expect(state.combat.balls).toHaveLength(1);
  });

  test("resetRoundState can start from a specific stage index", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "start");
    resetRoundState(state, GAME_CONFIG, false, fixedRandom, { startStageIndex: 10 });

    expect(state.run.progress.encounterIndex).toBe(10);
    expect(state.encounter.stats.missionTargetSec).toBeGreaterThan(0);
    expect(state.combat.bricks.length).toBeGreaterThan(0);
  });

  test("advanceStage increments until final stage", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "start");
    resetRoundState(state, GAME_CONFIG, false, fixedRandom);

    let progressed = true;
    for (let i = 0; i < STAGE_CATALOG.length - 1; i += 1) {
      progressed = advanceStage(state, GAME_CONFIG, fixedRandom);
      expect(progressed).toBe(true);
      expect(state.run.progress.encounterIndex).toBe(i + 1);
    }

    expect(advanceStage(state, GAME_CONFIG, fixedRandom)).toBe(false);
  });

  test("campaign progression keeps a linear encounter flow", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "start");
    resetRoundState(state, GAME_CONFIG, false, fixedRandom);

    for (let i = 0; i < 4; i += 1) {
      expect(advanceStage(state, GAME_CONFIG, fixedRandom)).toBe(true);
    }

    expect(state.run.progress.encounterIndex).toBe(4);
  });

  test("advanceStage carries active item effects but clears falling items", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "start");
    resetRoundState(state, GAME_CONFIG, false, fixedRandom);
    state.run.lives = 2;
    state.combat.items.active.paddlePlusStacks = 2;
    state.combat.items.active.shieldCharges = 1;
    state.combat.items.active.pierceStacks = 3;
    state.combat.items.active.bombStacks = 1;
    state.combat.items.falling.push({
      id: 99,
      type: "bomb",
      pos: { x: 120, y: 100 },
      speed: 160,
      size: 16,
    });

    const progressed = advanceStage(state, GAME_CONFIG, fixedRandom);

    expect(progressed).toBe(true);
    expect(state.combat.items.active.paddlePlusStacks).toBe(2);
    expect(state.combat.items.active.shieldCharges).toBe(1);
    expect(state.combat.items.active.pierceStacks).toBe(3);
    expect(state.combat.items.active.bombStacks).toBe(0);
    expect(state.combat.items.falling).toHaveLength(0);
    expect(state.run.lives).toBe(2);
  });

  test("retryCurrentStage rolls back to stageStartScore", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "start");
    resetRoundState(state, GAME_CONFIG, false, fixedRandom);
    state.run.progress.encounterStartScore = 1200;
    state.run.score = 3900;
    state.run.lives = 1;

    retryCurrentStage(state, GAME_CONFIG, fixedRandom);

    expect(state.run.score).toBe(1200);
    expect(state.run.lives).toBe(GAME_CONFIG.initialLives);
    expect(state.combat.balls).toHaveLength(1);
  });

  test("applyLifeLoss returns false when lives are exhausted", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "start");
    resetRoundState(state, GAME_CONFIG, false, fixedRandom);
    state.run.lives = 1;

    const canContinue = applyLifeLoss(state, 1, GAME_CONFIG, fixedRandom);

    expect(canContinue).toBe(false);
  });

  test("star rating boundary thresholds are correct", () => {
    expect(getStarRatingByScore(80)).toBe(3);
    expect(getStarRatingByScore(79)).toBe(2);
    expect(getStarRatingByScore(55)).toBe(2);
    expect(getStarRatingByScore(54)).toBe(1);
  });

  test("finalizeStageStats stores stage clear details", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "playing");
    resetRoundState(state, GAME_CONFIG, false, fixedRandom);
    state.encounter.stats.startedAtSec = 10;
    state.run.elapsedSec = 74;
    state.encounter.stats.hitsTaken = 1;
    state.run.lives = 3;

    finalizeStageStats(state);

    expect(state.encounter.stats.starRating).toBe(3);
    expect(typeof state.encounter.stats.ratingScore).toBe("number");
    expect(getStageClearTimeSec(state)).toBe(64);
    expect(state.encounter.stats.missionTargetSec).toBeGreaterThan(0);
    expect(state.encounter.stats.missionAchieved).toBe(true);
    expect(state.run.progress.results[0]?.stageNumber).toBe(1);
  });

  test("prepareStageStory returns true once for story stages", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "stageclear");
    state.run.progress.encounterIndex = 3;

    expect(prepareStageStory(state)).toBe(true);
    expect(state.encounter.story.activeStageNumber).toBe(4);
    expect(prepareStageStory(state)).toBe(false);
  });
});
