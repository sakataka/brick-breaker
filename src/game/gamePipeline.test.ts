import { describe, expect, test } from "bun:test";

import { GAME_CONFIG } from "./config";
import { stepPlayingPipeline } from "./gamePipeline";
import { advanceStage } from "./roundSystem";
import { createInitialGameState } from "./stateFactory";
import type { Ball, RandomSource } from "./types";

const random: RandomSource = { next: () => 0.5 };
const sfxStub = {
  play: () => Promise.resolve(),
} as const;

function overrideSingleBall(state: ReturnType<typeof createInitialGameState>, ball: Ball): void {
  state.balls = [ball];
}

describe("gamePipeline", () => {
  test("returns stageclear when final brick is destroyed", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.bricks = [{ id: 1, x: 100, y: 70, width: 40, height: 12, alive: true }];
    overrideSingleBall(state, {
      pos: { x: 120, y: 68 },
      vel: { x: 0, y: 70 },
      radius: 8,
      speed: config.initialBallSpeed,
    });

    const outcome = stepPlayingPipeline(state, {
      config,
      random,
      sfx: sfxStub as never,
      tryShieldRescue: () => false,
      playPickupSfx: () => {},
    });

    expect(outcome).toBe("stageclear");
    expect(state.score).toBeGreaterThan(0);
  });

  test("returns ballloss when all balls are gone", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.bricks = [];
    overrideSingleBall(state, {
      pos: { x: 130, y: 190 },
      vel: { x: 0, y: 260 },
      radius: 6,
      speed: config.initialBallSpeed,
    });

    const outcome = stepPlayingPipeline(state, {
      config,
      random,
      sfx: sfxStub as never,
      tryShieldRescue: () => false,
      playPickupSfx: () => {},
    });

    expect(outcome).toBe("ballloss");
    expect(state.balls).toHaveLength(0);
  });

  test("keeps running when shield rescue succeeds", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.bricks = [];
    overrideSingleBall(state, {
      pos: { x: 130, y: 170 },
      vel: { x: 0, y: 240 },
      radius: 6,
      speed: config.initialBallSpeed,
    });

    const outcome = stepPlayingPipeline(state, {
      config,
      random,
      sfx: sfxStub as never,
      tryShieldRescue: (ball) => {
        ball.pos.y = config.height - ball.radius - 16;
        ball.vel.y = -Math.abs(ball.vel.y);
        return true;
      },
      playPickupSfx: () => {},
    });

    expect(outcome).toBe("continue");
    expect(state.balls).toHaveLength(1);
    expect(state.elapsedSec).toBeGreaterThan(0);
  });

  test("clears all item effects when any ball is dropped during multiball", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.bricks = [];
    state.balls = [
      {
        pos: { x: 80, y: 100 },
        vel: { x: 0, y: -120 },
        radius: 6,
        speed: config.initialBallSpeed,
      },
      {
        pos: { x: 130, y: 190 },
        vel: { x: 0, y: 260 },
        radius: 6,
        speed: config.initialBallSpeed,
      },
    ];
    state.items.active.multiballStacks = 2;
    state.items.active.slowBallStacks = 1;
    state.items.active.shieldCharges = 1;
    state.items.active.paddlePlusStacks = 1;
    state.items.active.pierceStacks = 1;
    state.items.active.bombStacks = 1;

    const outcome = stepPlayingPipeline(state, {
      config,
      random,
      sfx: sfxStub as never,
      tryShieldRescue: () => false,
      playPickupSfx: () => {},
    });

    expect(outcome).toBe("continue");
    expect(state.balls).toHaveLength(1);
    expect(state.items.active.multiballStacks).toBe(0);
    expect(state.items.active.slowBallStacks).toBe(0);
    expect(state.items.active.shieldCharges).toBe(0);
    expect(state.items.active.paddlePlusStacks).toBe(0);
    expect(state.items.active.pierceStacks).toBe(0);
    expect(state.items.active.bombStacks).toBe(0);
  });

  test("applies combo score within window and resets when window expires", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 0.8 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.bricks = [
      { id: 1, x: 30, y: 40, width: 40, height: 10, alive: true },
      { id: 2, x: 90, y: 40, width: 40, height: 10, alive: true },
      { id: 3, x: 150, y: 40, width: 40, height: 10, alive: true },
    ];
    overrideSingleBall(state, {
      pos: { x: 50, y: 36 },
      vel: { x: 0, y: 160 },
      radius: 8,
      speed: config.initialBallSpeed,
    });

    stepPlayingPipeline(state, {
      config,
      random,
      sfx: sfxStub as never,
      tryShieldRescue: () => false,
      playPickupSfx: () => {},
    });
    const afterFirst = state.score;

    const secondBall = state.balls[0];
    if (!secondBall) {
      throw new Error("expected first ball");
    }
    secondBall.pos = { x: 110, y: 36 };
    secondBall.vel = { x: 0, y: 160 };
    stepPlayingPipeline(state, {
      config,
      random,
      sfx: sfxStub as never,
      tryShieldRescue: () => false,
      playPickupSfx: () => {},
    });
    const secondGain = state.score - afterFirst;

    state.elapsedSec += 2.2;
    const thirdBall = state.balls[0];
    if (!thirdBall) {
      throw new Error("expected surviving ball");
    }
    thirdBall.pos = { x: 170, y: 36 };
    thirdBall.vel = { x: 0, y: 160 };
    stepPlayingPipeline(state, {
      config,
      random,
      sfx: sfxStub as never,
      tryShieldRescue: () => false,
      playPickupSfx: () => {},
    });
    const thirdGain = state.score - afterFirst - secondGain;

    expect(afterFirst).toBe(100);
    expect(secondGain).toBe(125);
    expect(thirdGain).toBe(100);
  });

  test("stageclear then advanceStage preserves active effects and starts next stage", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.items.active.multiballStacks = 3;
    state.items.active.pierceStacks = 1;
    state.bricks = [{ id: 1, x: 100, y: 70, width: 40, height: 12, alive: true }];
    overrideSingleBall(state, {
      pos: { x: 120, y: 68 },
      vel: { x: 0, y: 70 },
      radius: 8,
      speed: config.initialBallSpeed,
    });

    const outcome = stepPlayingPipeline(state, {
      config,
      random,
      sfx: sfxStub as never,
      tryShieldRescue: () => false,
      playPickupSfx: () => {},
    });

    expect(outcome).toBe("stageclear");
    expect(advanceStage(state, config, random)).toBe(true);
    expect(state.scene).toBe("playing");
    expect(state.campaign.stageIndex).toBe(1);
    expect(state.items.active.multiballStacks).toBe(3);
    expect(state.items.active.pierceStacks).toBe(1);
    expect(state.balls).toHaveLength(4);
  });
});
