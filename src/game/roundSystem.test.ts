import { describe, expect, test } from "bun:test";

import { GAME_CONFIG, STAGE_CATALOG } from "./config";
import {
  advanceStage,
  applyLifeLoss,
  applyRogueUpgradeSelection,
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

    expect(state.campaign.stageIndex).toBe(0);
    expect(state.campaign.totalStages).toBe(STAGE_CATALOG.length);
    expect(state.campaign.stageStartScore).toBe(0);
    expect(state.lives).toBe(GAME_CONFIG.initialLives);
    expect(state.balls).toHaveLength(1);
  });

  test("resetRoundState uses configured initial lives", () => {
    const customConfig = {
      ...GAME_CONFIG,
      initialLives: 6,
    };
    const state = createInitialGameState(customConfig, false, "start");

    resetRoundState(state, customConfig, false, fixedRandom);

    expect(state.lives).toBe(6);
  });

  test("advanceStage increments until final stage", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "start");
    resetRoundState(state, GAME_CONFIG, false, fixedRandom);

    let progressed = true;
    for (let i = 0; i < STAGE_CATALOG.length - 1; i += 1) {
      progressed = advanceStage(state, GAME_CONFIG, fixedRandom);
      expect(progressed).toBe(true);
      expect(state.campaign.stageIndex).toBe(i + 1);
    }

    expect(advanceStage(state, GAME_CONFIG, fixedRandom)).toBe(false);
  });

  test("route preference B is resolved after stage 4 clear", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "start");
    resetRoundState(state, GAME_CONFIG, false, fixedRandom);
    state.campaign.routePreference = "B";

    for (let i = 0; i < 4; i += 1) {
      expect(advanceStage(state, GAME_CONFIG, fixedRandom)).toBe(true);
    }

    expect(state.campaign.resolvedRoute).toBe("B");
  });

  test("advanceStage carries active item effects but clears falling items", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "start");
    resetRoundState(state, GAME_CONFIG, false, fixedRandom);
    state.lives = 2;
    state.items.active.paddlePlusStacks = 2;
    state.items.active.shieldCharges = 1;
    state.items.active.pierceStacks = 3;
    state.items.active.bombStacks = 1;
    state.items.falling.push({
      id: 99,
      type: "bomb",
      pos: { x: 120, y: 100 },
      speed: 160,
      size: 16,
    });

    const progressed = advanceStage(state, GAME_CONFIG, fixedRandom);

    expect(progressed).toBe(true);
    expect(state.items.active.paddlePlusStacks).toBe(2);
    expect(state.items.active.shieldCharges).toBe(1);
    expect(state.items.active.pierceStacks).toBe(3);
    expect(state.items.active.bombStacks).toBe(0);
    expect(state.items.falling).toHaveLength(0);
    expect(state.lives).toBe(2);
  });

  test("advanceStage applies carried multiball stacks to next-stage serve count", () => {
    const customConfig = { ...GAME_CONFIG, multiballMaxBalls: 5 };
    const state = createInitialGameState(customConfig, false, "start");
    resetRoundState(state, customConfig, false, fixedRandom);
    state.items.active.multiballStacks = 3;

    const progressed = advanceStage(state, customConfig, fixedRandom);

    expect(progressed).toBe(true);
    expect(state.balls).toHaveLength(4);

    state.items.active.multiballStacks = 8;
    expect(advanceStage(state, customConfig, fixedRandom)).toBe(true);
    expect(state.balls).toHaveLength(5);
  });

  test("retryCurrentStage rolls back to stageStartScore", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "start");
    resetRoundState(state, GAME_CONFIG, false, fixedRandom);
    state.campaign.stageStartScore = 1200;
    state.score = 3900;
    state.lives = 1;

    retryCurrentStage(state, GAME_CONFIG, fixedRandom);

    expect(state.score).toBe(1200);
    expect(state.lives).toBe(GAME_CONFIG.initialLives);
    expect(state.balls).toHaveLength(1);
  });

  test("applyLifeLoss returns false when lives are exhausted", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "start");
    resetRoundState(state, GAME_CONFIG, false, fixedRandom);
    state.lives = 1;

    const canContinue = applyLifeLoss(state, 1, GAME_CONFIG, fixedRandom);

    expect(canContinue).toBe(false);
  });

  test("applyLifeLoss keeps stage item stacks", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "start");
    resetRoundState(state, GAME_CONFIG, false, fixedRandom);
    state.items.active.multiballStacks = 2;
    state.items.active.pierceStacks = 3;
    state.items.active.shieldCharges = 4;

    const canContinue = applyLifeLoss(state, 1, GAME_CONFIG, fixedRandom);

    expect(canContinue).toBe(true);
    expect(state.items.active.multiballStacks).toBe(2);
    expect(state.items.active.pierceStacks).toBe(3);
    expect(state.items.active.shieldCharges).toBe(4);
  });

  test("retryCurrentStage resets stage item stacks", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "start");
    resetRoundState(state, GAME_CONFIG, false, fixedRandom);
    state.items.active.bombStacks = 2;
    state.items.active.slowBallStacks = 5;

    retryCurrentStage(state, GAME_CONFIG, fixedRandom);

    expect(state.items.active.bombStacks).toBe(0);
    expect(state.items.active.slowBallStacks).toBe(0);
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
    state.stageStats.startedAtSec = 10;
    state.elapsedSec = 74;
    state.stageStats.hitsTaken = 1;
    state.lives = 3;

    finalizeStageStats(state);

    expect(state.stageStats.starRating).toBe(3);
    expect(typeof state.stageStats.ratingScore).toBe("number");
    expect(getStageClearTimeSec(state)).toBe(64);
    expect(state.stageStats.missionTargetSec).toBeGreaterThan(0);
    expect(state.stageStats.missionAchieved).toBe(true);
    expect(state.campaign.results[0]?.stageNumber).toBe(1);
    expect(state.campaign.results[0]?.clearTimeSec).toBe(64);
    expect(state.campaign.results[0]?.missionAchieved).toBe(true);
  });

  test("finalizeStageStats marks mission failed when clear time exceeds target", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "playing");
    resetRoundState(state, GAME_CONFIG, false, fixedRandom);
    state.stageStats.startedAtSec = 0;
    state.elapsedSec = 180;

    finalizeStageStats(state);

    expect(state.stageStats.missionAchieved).toBe(false);
    expect(state.campaign.results[0]?.missionAchieved).toBe(false);
  });

  test("checkpoint stage prepares rogue upgrade offer", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "playing");
    resetRoundState(state, GAME_CONFIG, false, fixedRandom);
    state.campaign.stageIndex = 2;
    state.elapsedSec = 60;

    finalizeStageStats(state);

    expect(state.rogue.pendingOffer).not.toBeNull();
    expect(state.rogue.pendingOffer).toHaveLength(2);
  });

  test("applying rogue selection consumes pending offer and grants bonus", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "playing");
    state.rogue.pendingOffer = ["paddle_core", "speed_core"];

    applyRogueUpgradeSelection(state, "speed_core");

    expect(state.rogue.upgradesTaken).toBe(1);
    expect(state.rogue.maxSpeedScaleBonus).toBeGreaterThan(0);
    expect(state.rogue.pendingOffer).toBeNull();
    expect(state.rogue.lastChosen).toBe("speed_core");
  });

  test("prepareStageStory returns true once for story stages", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "stageclear");
    state.campaign.stageIndex = 3;

    expect(prepareStageStory(state)).toBe(true);
    expect(state.story.activeStageNumber).toBe(4);
    expect(prepareStageStory(state)).toBe(false);
  });
});
