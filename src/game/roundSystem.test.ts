import { describe, expect, test } from "bun:test";

import { GAME_CONFIG, STAGE_CATALOG } from "./config";
import { advanceStage, applyLifeLoss, resetRoundState, retryCurrentStage } from "./roundSystem";
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

  test("advanceStage carries active item effects but clears falling items", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "start");
    resetRoundState(state, GAME_CONFIG, false, fixedRandom);
    state.items.active.paddlePlusStacks = 2;
    state.items.active.shieldCharges = 1;
    state.items.active.pierceStacks = 3;
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
    expect(state.items.falling).toHaveLength(0);
  });

  test("advanceStage applies carried multiball stacks to next-stage serve count", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "start");
    resetRoundState(state, GAME_CONFIG, false, fixedRandom);
    state.items.active.multiballStacks = 3;

    const progressed = advanceStage(state, GAME_CONFIG, fixedRandom);

    expect(progressed).toBe(true);
    expect(state.balls).toHaveLength(4);
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
});
