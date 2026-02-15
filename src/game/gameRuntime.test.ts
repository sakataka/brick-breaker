import { describe, expect, test } from "bun:test";

import { GAME_CONFIG } from "./config";
import { computeFrameDelta, handleBallLoss, handleStageClear, runPlayingLoop } from "./gameRuntime";
import { createInitialGameState } from "./stateFactory";
import type { RandomSource } from "./types";

const random: RandomSource = { next: () => 0.5 };
const sfxStub = {
  play: () => Promise.resolve(),
};

describe("gameRuntime", () => {
  test("computeFrameDelta clamps large frame gaps", () => {
    const first = computeFrameDelta(0, 3);
    expect(first.delta).toBe(0);
    expect(first.nextFrameTime).toBe(3);

    const second = computeFrameDelta(1, 2);
    expect(second.delta).toBe(0.25);
    expect(second.nextFrameTime).toBe(2);
  });

  test("runPlayingLoop consumes hit-freeze frame without progressing pipeline", () => {
    const config = { ...GAME_CONFIG, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, false, "playing");
    state.scene = "playing";
    state.vfx.hitFreezeMs = 18;
    state.bricks = [];

    let stageClearCount = 0;
    let ballLossCount = 0;
    const next = runPlayingLoop(
      state,
      {
        config,
        random,
        sfx: sfxStub as never,
        playPickupSfx: () => {},
        playComboFillSfx: () => {},
        playMagicCastSfx: () => {},
      },
      0,
      config.fixedDeltaSec,
      () => {
        stageClearCount += 1;
      },
      () => {
        ballLossCount += 1;
      },
    );

    expect(next).toBe(0);
    expect(state.vfx.hitFreezeMs).toBeGreaterThan(0);
    expect(stageClearCount).toBe(0);
    expect(ballLossCount).toBe(0);
  });

  test("runPlayingLoop triggers stage clear callback when bricks are cleared", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.bricks = [{ id: 1, x: 100, y: 70, width: 40, height: 12, alive: true }];
    state.balls = [
      {
        pos: { x: 120, y: 68 },
        vel: { x: 0, y: 70 },
        radius: 8,
        speed: config.initialBallSpeed,
      },
    ];

    let stageClearCount = 0;
    let ballLossCount = 0;
    runPlayingLoop(
      state,
      {
        config,
        random,
        sfx: sfxStub as never,
        playPickupSfx: () => {},
        playComboFillSfx: () => {},
        playMagicCastSfx: () => {},
      },
      0,
      config.fixedDeltaSec,
      () => {
        stageClearCount += 1;
      },
      () => {
        ballLossCount += 1;
      },
    );

    expect(stageClearCount).toBe(1);
    expect(ballLossCount).toBe(0);
  });

  test("runPlayingLoop uses shield rescue before ball-loss callback", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.items.active.shieldCharges = 1;
    state.bricks = [];
    state.balls = [
      {
        pos: { x: 130, y: 190 },
        vel: { x: 0, y: 260 },
        radius: 6,
        speed: config.initialBallSpeed,
      },
    ];

    let ballLossCount = 0;
    runPlayingLoop(
      state,
      {
        config,
        random,
        sfx: sfxStub as never,
        playPickupSfx: () => {},
        playComboFillSfx: () => {},
        playMagicCastSfx: () => {},
      },
      0,
      config.fixedDeltaSec,
      () => {},
      () => {
        ballLossCount += 1;
      },
    );

    expect(ballLossCount).toBe(0);
    expect(state.items.active.shieldCharges).toBe(0);
    expect(state.vfx.impactRings.length).toBeGreaterThan(0);
    expect(state.balls).toHaveLength(1);
  });

  test("runPlayingLoop does not one-shot boss during high-delta catch-up with pierce", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 120 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.bricks = [
      {
        id: 1,
        x: 48,
        y: 50,
        width: 144,
        height: 26,
        alive: true,
        kind: "boss",
        hp: 12,
        maxHp: 12,
      },
    ];
    state.items.active.pierceStacks = 1;
    state.balls = [
      {
        pos: { x: 120, y: 88 },
        vel: { x: 0, y: -220 },
        radius: 8,
        speed: config.initialBallSpeed,
      },
    ];

    runPlayingLoop(
      state,
      {
        config,
        random,
        sfx: sfxStub as never,
        playPickupSfx: () => {},
        playComboFillSfx: () => {},
        playMagicCastSfx: () => {},
      },
      0,
      0.25,
      () => {},
      () => {},
    );

    expect(state.bricks[0]?.alive).toBe(true);
    expect((state.bricks[0]?.hp ?? 0) > 0).toBe(true);
  });

  test("handleBallLoss retries stage and emits game over when lives are exhausted", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.lives = 1;
    state.score = 3000;
    state.campaign.stageStartScore = 1200;

    let gameOverCount = 0;
    handleBallLoss(state, config, random, () => {
      gameOverCount += 1;
    });

    expect(gameOverCount).toBe(1);
    expect(state.score).toBe(1200);
    expect(state.lives).toBe(config.initialLives);
  });

  test("handleStageClear applies life bonus and transition event", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.campaign.stageIndex = 0;
    state.campaign.totalStages = 12;
    state.stageStats.startedAtSec = 0;
    state.elapsedSec = 30;
    state.lives = 2;
    const before = state.score;

    let transition: "GAME_CLEAR" | "STAGE_CLEAR" | null = null;
    handleStageClear(state, config, (event) => {
      transition = event;
    });

    expect(transition === "STAGE_CLEAR").toBe(true);
    expect(state.score).toBe(before + 1000);
    expect(state.stageStats.starRating).toBeDefined();
  });
});
