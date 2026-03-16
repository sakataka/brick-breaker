import { describe, expect, test } from "vite-plus/test";

import { GAME_CONFIG } from "./config";
import { generateShopOffer, stepPlayingPipeline } from "./gamePipeline";
import { ITEM_ORDER } from "./itemRegistryData";
import { createInitialGameState } from "./stateFactory";
import type { Ball, RandomSource } from "./types";

const random: RandomSource = { next: () => 0.5 };
const sfxStub = {
  play: () => Promise.resolve(),
} as const;

function overrideSingleBall(state: ReturnType<typeof createInitialGameState>, ball: Ball): void {
  state.combat.balls = [ball];
}

describe("gamePipeline", () => {
  test("generateShopOffer excludes disabled items", () => {
    const offer = generateShopOffer({ next: () => 0.99 }, ITEM_ORDER.slice(0, 4));
    expect(offer.every((type) => ITEM_ORDER.slice(0, 4).includes(type))).toBe(true);
  });

  test("returns stageclear when final brick is destroyed", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.combat.bricks = [{ id: 1, x: 100, y: 70, width: 40, height: 12, alive: true }];
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
      playComboFillSfx: () => {},
      playMagicCastSfx: () => {},
    });

    expect(outcome).toBe("stageclear");
    expect(state.run.score).toBeGreaterThan(0);
  });

  test("returns ballloss when all balls are gone", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.combat.bricks = [];
    state.combat.items.active.multiballStacks = 2;
    state.combat.items.active.pierceStacks = 1;
    state.combat.items.active.laserStacks = 2;
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
      playComboFillSfx: () => {},
      playMagicCastSfx: () => {},
    });

    expect(outcome).toBe("ballloss");
    expect(state.combat.balls).toHaveLength(0);
    expect(state.combat.items.active.multiballStacks).toBe(0);
    expect(state.combat.items.active.pierceStacks).toBe(0);
    expect(state.combat.items.active.laserStacks).toBe(0);
    expect(state.combat.laserProjectiles).toHaveLength(0);
  });

  test("does not auto-respawn lasers after all balls are lost in the same tick", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.combat.bricks = [];
    state.combat.items.active.laserStacks = 2;
    state.combat.laserCooldownSec = 0;
    state.combat.laserProjectiles = [
      {
        id: 1,
        x: 100,
        y: 20,
        speed: 760,
      },
    ];
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
      playComboFillSfx: () => {},
      playMagicCastSfx: () => {},
    });

    expect(outcome).toBe("ballloss");
    expect(state.combat.balls).toHaveLength(0);
    expect(state.combat.laserProjectiles).toHaveLength(0);
    expect(state.combat.laserCooldownSec).toBe(0);
  });

  test("keeps running when shield rescue succeeds", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.combat.bricks = [];
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
      playComboFillSfx: () => {},
      playMagicCastSfx: () => {},
    });

    expect(outcome).toBe("continue");
    expect(state.combat.balls).toHaveLength(1);
    expect(state.run.elapsedSec).toBeGreaterThan(0);
  });

  test("keeps non-multiball effects while multiball stacks follow surviving balls", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.combat.bricks = [];
    state.combat.balls = [
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
    state.combat.items.active.multiballStacks = 1;
    state.combat.items.active.slowBallStacks = 1;
    state.combat.items.active.shieldCharges = 1;
    state.combat.items.active.paddlePlusStacks = 1;
    state.combat.items.active.pierceStacks = 1;
    state.combat.items.active.bombStacks = 1;

    const outcome = stepPlayingPipeline(state, {
      config,
      random,
      sfx: sfxStub as never,
      tryShieldRescue: () => false,
      playPickupSfx: () => {},
      playComboFillSfx: () => {},
      playMagicCastSfx: () => {},
    });

    expect(outcome).toBe("continue");
    expect(state.combat.balls).toHaveLength(1);
    expect(state.combat.items.active.multiballStacks).toBe(0);
    expect(state.combat.items.active.slowBallStacks).toBe(1);
    expect(state.combat.items.active.shieldCharges).toBe(1);
    expect(state.combat.items.active.paddlePlusStacks).toBe(1);
    expect(state.combat.items.active.pierceStacks).toBe(1);
    expect(state.combat.items.active.bombStacks).toBe(1);
  });

  test("multiball pickup adds one from current surviving balls instead of old stack history", () => {
    const config = {
      ...GAME_CONFIG,
      width: 260,
      height: 180,
      fixedDeltaSec: 1 / 60,
      multiballMaxBalls: 4,
    };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.combat.items.active.multiballStacks = 3;
    state.combat.balls = [
      {
        pos: { x: 130, y: 190 },
        vel: { x: 0, y: 260 },
        radius: 6,
        speed: config.initialBallSpeed,
      },
      {
        pos: { x: 100, y: 100 },
        vel: { x: 0, y: -120 },
        radius: 6,
        speed: config.initialBallSpeed,
      },
      {
        pos: { x: 150, y: 100 },
        vel: { x: 0, y: -120 },
        radius: 6,
        speed: config.initialBallSpeed,
      },
    ];
    state.combat.items.falling.push({
      id: 1,
      type: "multiball",
      pos: { x: 130, y: 150 },
      speed: 0,
      size: 16,
    });

    const outcome = stepPlayingPipeline(state, {
      config,
      random,
      sfx: sfxStub as never,
      tryShieldRescue: () => false,
      playPickupSfx: () => {},
      playComboFillSfx: () => {},
      playMagicCastSfx: () => {},
    });

    expect(outcome).toBe("continue");
    expect(state.combat.balls).toHaveLength(2);
    expect(state.combat.items.active.multiballStacks).toBe(1);
  });

  test("applies combo score within window and resets when window expires", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 0.8 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.combat.bricks = [
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
      playComboFillSfx: () => {},
      playMagicCastSfx: () => {},
    });
    const afterFirst = state.run.score;

    const secondBall = state.combat.balls[0];
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
      playComboFillSfx: () => {},
      playMagicCastSfx: () => {},
    });
    const secondGain = state.run.score - afterFirst;

    state.run.elapsedSec += 2.2;
    const thirdBall = state.combat.balls[0];
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
      playComboFillSfx: () => {},
      playMagicCastSfx: () => {},
    });
    const thirdGain = state.run.score - afterFirst - secondGain;

    expect(afterFirst).toBe(100);
    expect(secondGain).toBe(125);
    expect(thirdGain).toBe(100);
  });

  test("grants one guaranteed drop when combo reaches x2.0", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.combat.bricks = [
      { id: 1, x: 30, y: 40, width: 36, height: 10, alive: true },
      { id: 2, x: 70, y: 40, width: 36, height: 10, alive: true },
      { id: 3, x: 110, y: 40, width: 36, height: 10, alive: true },
      { id: 4, x: 150, y: 40, width: 36, height: 10, alive: true },
      { id: 5, x: 190, y: 40, width: 36, height: 10, alive: true },
      { id: 6, x: 190, y: 70, width: 36, height: 10, alive: true },
    ];
    state.combat.items.falling = [];
    overrideSingleBall(state, {
      pos: { x: 48, y: 36 },
      vel: { x: 0, y: 160 },
      radius: 8,
      speed: config.initialBallSpeed,
    });

    for (let i = 0; i < 5; i += 1) {
      const ball = state.combat.balls[0];
      if (!ball) {
        throw new Error("expected surviving ball");
      }
      ball.pos = { x: 48 + 40 * i, y: 36 };
      ball.vel = { x: 0, y: 160 };
      stepPlayingPipeline(state, {
        config,
        random,
        sfx: sfxStub as never,
        tryShieldRescue: () => false,
        playPickupSfx: () => {},
        playComboFillSfx: () => {},
        playMagicCastSfx: () => {},
      });
    }

    expect(state.run.combo.multiplier).toBeGreaterThanOrEqual(2);
    expect(state.run.combo.rewardGranted).toBe(true);
    expect(state.combat.items.falling.length).toBeGreaterThanOrEqual(1);
    const countAfterTrigger = state.combat.items.falling.length;

    const ball = state.combat.balls[0];
    if (!ball) {
      throw new Error("expected surviving ball");
    }
    ball.pos = { x: 190, y: 66 };
    ball.vel = { x: 0, y: 160 };
    stepPlayingPipeline(state, {
      config,
      random,
      sfx: sfxStub as never,
      tryShieldRescue: () => false,
      playPickupSfx: () => {},
      playComboFillSfx: () => {},
      playMagicCastSfx: () => {},
    });

    expect(state.combat.items.falling.length).toBe(countAfterTrigger);
  });

  test("destroying hazard brick clears slow stacks and starts temporary speed boost", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.combat.items.active.slowBallStacks = 2;
    state.combat.bricks = [
      { id: 1, x: 100, y: 70, width: 40, height: 12, alive: true, kind: "hazard", hp: 1 },
      { id: 2, x: 10, y: 10, width: 40, height: 12, alive: true, kind: "normal", hp: 1 },
    ];
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
      playComboFillSfx: () => {},
      playMagicCastSfx: () => {},
    });

    expect(outcome).toBe("continue");
    expect(state.combat.items.active.slowBallStacks).toBe(0);
    expect(state.combat.hazard.speedBoostUntilSec).toBeGreaterThan(state.run.elapsedSec);
    expect(state.combat.balls[0]?.speed).toBeGreaterThan(70);
  });
});
