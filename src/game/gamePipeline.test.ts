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
      playComboFillSfx: () => {},
      playMagicCastSfx: () => {},
    });

    expect(outcome).toBe("stageclear");
    expect(state.score).toBeGreaterThan(0);
  });

  test("returns ballloss when all balls are gone", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.bricks = [];
    state.items.active.multiballStacks = 2;
    state.items.active.pierceStacks = 1;
    state.items.active.laserStacks = 2;
    state.items.active.stickyStacks = 1;
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
    expect(state.balls).toHaveLength(0);
    expect(state.items.active.multiballStacks).toBe(0);
    expect(state.items.active.pierceStacks).toBe(0);
    expect(state.items.active.laserStacks).toBe(0);
    expect(state.items.active.stickyStacks).toBe(0);
    expect(state.combat.laserProjectiles).toHaveLength(0);
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
      playComboFillSfx: () => {},
      playMagicCastSfx: () => {},
    });

    expect(outcome).toBe("continue");
    expect(state.balls).toHaveLength(1);
    expect(state.elapsedSec).toBeGreaterThan(0);
  });

  test("keeps non-multiball effects while multiball stacks follow surviving balls", () => {
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
    state.items.active.multiballStacks = 1;
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
      playComboFillSfx: () => {},
      playMagicCastSfx: () => {},
    });

    expect(outcome).toBe("continue");
    expect(state.balls).toHaveLength(1);
    expect(state.items.active.multiballStacks).toBe(0);
    expect(state.items.active.slowBallStacks).toBe(1);
    expect(state.items.active.shieldCharges).toBe(1);
    expect(state.items.active.paddlePlusStacks).toBe(1);
    expect(state.items.active.pierceStacks).toBe(1);
    expect(state.items.active.bombStacks).toBe(1);
  });

  test("multiball pickup adds one from current surviving balls instead of old stack history", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60, multiballMaxBalls: 4 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.items.active.multiballStacks = 3;
    state.balls = [
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
    state.items.falling.push({
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
    expect(state.balls).toHaveLength(2);
    expect(state.items.active.multiballStacks).toBe(1);
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
      playComboFillSfx: () => {},
      playMagicCastSfx: () => {},
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
      playComboFillSfx: () => {},
      playMagicCastSfx: () => {},
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
      playComboFillSfx: () => {},
      playMagicCastSfx: () => {},
    });
    const thirdGain = state.score - afterFirst - secondGain;

    expect(afterFirst).toBe(100);
    expect(secondGain).toBe(125);
    expect(thirdGain).toBe(100);
  });

  test("grants one guaranteed drop when combo reaches x2.0", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.bricks = [
      { id: 1, x: 30, y: 40, width: 36, height: 10, alive: true },
      { id: 2, x: 70, y: 40, width: 36, height: 10, alive: true },
      { id: 3, x: 110, y: 40, width: 36, height: 10, alive: true },
      { id: 4, x: 150, y: 40, width: 36, height: 10, alive: true },
      { id: 5, x: 190, y: 40, width: 36, height: 10, alive: true },
      { id: 6, x: 190, y: 70, width: 36, height: 10, alive: true },
    ];
    state.items.falling = [];
    overrideSingleBall(state, {
      pos: { x: 48, y: 36 },
      vel: { x: 0, y: 160 },
      radius: 8,
      speed: config.initialBallSpeed,
    });

    for (let i = 0; i < 5; i += 1) {
      const ball = state.balls[0];
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

    expect(state.combo.multiplier).toBeGreaterThanOrEqual(2);
    expect(state.combo.rewardGranted).toBe(true);
    expect(state.items.falling.length).toBeGreaterThanOrEqual(1);
    const countAfterTrigger = state.items.falling.length;

    const ball = state.balls[0];
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

    expect(state.items.falling.length).toBe(countAfterTrigger);
  });

  test("destroying hazard brick clears slow stacks and starts temporary speed boost", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.items.active.slowBallStacks = 2;
    state.bricks = [
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
    expect(state.items.active.slowBallStacks).toBe(0);
    expect(state.hazard.speedBoostUntilSec).toBeGreaterThan(state.elapsedSec);
    expect(state.balls[0]?.speed).toBeGreaterThan(70);
  });

  test("stageclear then advanceStage preserves active effects and starts next stage", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.items.active.multiballStacks = 3;
    state.items.active.pierceStacks = 1;
    state.balls = [
      {
        pos: { x: 120, y: 68 },
        vel: { x: 0, y: 70 },
        radius: 8,
        speed: config.initialBallSpeed,
      },
      {
        pos: { x: 70, y: 110 },
        vel: { x: 20, y: -60 },
        radius: 8,
        speed: config.initialBallSpeed,
      },
      {
        pos: { x: 160, y: 120 },
        vel: { x: -25, y: -65 },
        radius: 8,
        speed: config.initialBallSpeed,
      },
      {
        pos: { x: 210, y: 130 },
        vel: { x: -15, y: -80 },
        radius: 8,
        speed: config.initialBallSpeed,
      },
    ];
    state.bricks = [{ id: 1, x: 100, y: 70, width: 40, height: 12, alive: true }];

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
    expect(advanceStage(state, config, random)).toBe(true);
    expect(state.scene).toBe("playing");
    expect(state.campaign.stageIndex).toBe(1);
    expect(state.items.active.multiballStacks).toBe(3);
    expect(state.items.active.pierceStacks).toBe(1);
    expect(state.balls).toHaveLength(4);
  });

  test("plays item pickup sounds by item type with a two-sound cap per frame", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.bricks = [];
    state.paddle = { ...state.paddle, x: 90, y: 120, width: 100, height: 20 };
    state.balls = [
      {
        pos: { x: 130, y: 90 },
        vel: { x: 0, y: -120 },
        radius: 6,
        speed: config.initialBallSpeed,
      },
    ];
    state.items.falling.push(
      {
        id: 1,
        type: "shield",
        pos: { x: 110, y: 125 },
        speed: 0,
        size: 16,
      },
      {
        id: 2,
        type: "pierce",
        pos: { x: 130, y: 125 },
        speed: 0,
        size: 16,
      },
      {
        id: 3,
        type: "bomb",
        pos: { x: 150, y: 125 },
        speed: 0,
        size: 16,
      },
    );
    const played: string[] = [];

    const outcome = stepPlayingPipeline(state, {
      config,
      random,
      sfx: sfxStub as never,
      tryShieldRescue: () => false,
      playPickupSfx: (itemType) => played.push(itemType),
      playComboFillSfx: () => {},
      playMagicCastSfx: () => {},
    });

    expect(outcome).toBe("continue");
    expect(played).toEqual(["shield", "pierce"]);
  });

  test("laser item auto-spawns projectiles and destroys bricks", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.items.active.laserStacks = 2;
    state.combat.laserCooldownSec = 0;
    const paddleCenterX = state.paddle.x + state.paddle.width / 2;
    state.bricks = [
      {
        id: 1,
        x: paddleCenterX - 14,
        y: state.paddle.y - 28,
        width: 28,
        height: 12,
        alive: true,
      },
    ];
    state.balls = [
      {
        pos: { x: 20, y: 120 },
        vel: { x: 10, y: -70 },
        radius: 6,
        speed: config.initialBallSpeed,
      },
    ];

    const first = stepPlayingPipeline(state, {
      config,
      random,
      sfx: sfxStub as never,
      tryShieldRescue: () => false,
      playPickupSfx: () => {},
      playComboFillSfx: () => {},
      playMagicCastSfx: () => {},
    });
    expect(first).toBe("continue");
    expect(state.combat.laserProjectiles.length).toBeGreaterThan(0);

    const second = stepPlayingPipeline(state, {
      config,
      random,
      sfx: sfxStub as never,
      tryShieldRescue: () => false,
      playPickupSfx: () => {},
      playComboFillSfx: () => {},
      playMagicCastSfx: () => {},
    });

    expect(second).toBe("stageclear");
    expect(state.bricks.every((brick) => !brick.alive)).toBe(true);
    expect(state.score).toBeGreaterThan(0);
  });

  test("shield burst pushes balls upward and damages nearby bottom bricks", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.combat.shieldBurstQueued = true;
    state.bricks = [
      { id: 1, x: 80, y: 126, width: 30, height: 10, alive: true, hp: 1 },
      { id: 2, x: 120, y: 122, width: 30, height: 10, alive: true, hp: 1 },
      { id: 3, x: 50, y: 20, width: 30, height: 10, alive: true, hp: 1 },
    ];
    state.balls = [
      {
        pos: { x: 20, y: 110 },
        vel: { x: 0, y: 110 },
        radius: 7,
        speed: config.initialBallSpeed,
      },
      {
        pos: { x: 35, y: 120 },
        vel: { x: 10, y: 140 },
        radius: 7,
        speed: config.initialBallSpeed,
      },
    ];

    const outcome = stepPlayingPipeline(state, {
      config,
      random,
      sfx: sfxStub as never,
      tryShieldRescue: () => false,
      playPickupSfx: () => {},
      playComboFillSfx: () => {},
      playMagicCastSfx: () => {},
    });

    expect(outcome).not.toBe("ballloss");
    expect(state.combat.shieldBurstQueued).toBe(false);
    expect(state.balls.every((ball) => ball.vel.y <= -260)).toBe(true);
    expect(state.bricks.filter((brick) => !brick.alive).length).toBeGreaterThanOrEqual(2);
  });

  test("risk mode raises brick score gain", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.options.riskMode = true;
    state.bricks = [{ id: 1, x: 100, y: 70, width: 40, height: 12, alive: true }];
    state.balls = [
      {
        pos: { x: 120, y: 68 },
        vel: { x: 0, y: 70 },
        radius: 8,
        speed: config.initialBallSpeed,
      },
    ];

    stepPlayingPipeline(state, {
      config,
      random,
      sfx: sfxStub as never,
      tryShieldRescue: () => false,
      playPickupSfx: () => {},
      playComboFillSfx: () => {},
      playMagicCastSfx: () => {},
    });

    expect(state.score).toBe(135);
  });

  test("generates one shop offer per stage", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.bricks = [];
    state.shop.lastOffer = null;
    state.balls = [
      {
        pos: { x: 120, y: 110 },
        vel: { x: 0, y: -120 },
        radius: 8,
        speed: config.initialBallSpeed,
      },
    ];

    stepPlayingPipeline(state, {
      config,
      random,
      sfx: sfxStub as never,
      tryShieldRescue: () => false,
      playPickupSfx: () => {},
      playComboFillSfx: () => {},
      playMagicCastSfx: () => {},
    });

    expect(state.shop.lastOffer).not.toBeNull();
    expect(state.shop.lastOffer).toHaveLength(2);
  });

  test("enemy collision defeats enemy and grants score", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.bricks = [];
    state.enemies = [{ id: 1, x: 120, y: 100, vx: 0, radius: 10, alive: true }];
    state.balls = [
      {
        pos: { x: 120, y: 100 },
        vel: { x: 0, y: 120 },
        radius: 8,
        speed: config.initialBallSpeed,
      },
    ];

    stepPlayingPipeline(state, {
      config,
      random,
      sfx: sfxStub as never,
      tryShieldRescue: () => false,
      playPickupSfx: () => {},
      playComboFillSfx: () => {},
      playMagicCastSfx: () => {},
    });

    expect(state.enemies).toHaveLength(0);
    expect(state.score).toBeGreaterThanOrEqual(150);
  });

  test("combo fill sfx fires once when crossing x2.5", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.combo.multiplier = 2.25;
    state.combo.streak = 6;
    state.combo.lastHitSec = 0;
    state.elapsedSec = 0.2;
    state.bricks = [{ id: 1, x: 30, y: 40, width: 36, height: 10, alive: true }];
    overrideSingleBall(state, {
      pos: { x: 48, y: 36 },
      vel: { x: 0, y: 160 },
      radius: 8,
      speed: config.initialBallSpeed,
    });

    let fillCount = 0;
    stepPlayingPipeline(state, {
      config,
      random,
      sfx: sfxStub as never,
      tryShieldRescue: () => false,
      playPickupSfx: () => {},
      playComboFillSfx: () => {
        fillCount += 1;
      },
      playMagicCastSfx: () => {},
    });

    expect(fillCount).toBe(1);
    expect(state.combo.fillTriggered).toBe(true);
  });

  test("magic cast destroys nearest brick and starts cooldown", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.magic.requestCast = true;
    state.bricks = [
      { id: 1, x: 20, y: 40, width: 30, height: 10, alive: true },
      { id: 2, x: 110, y: 80, width: 30, height: 10, alive: true },
    ];
    state.balls = [
      {
        pos: { x: 120, y: 120 },
        vel: { x: 0, y: -80 },
        radius: 8,
        speed: config.initialBallSpeed,
      },
    ];

    let played = 0;
    stepPlayingPipeline(state, {
      config,
      random,
      sfx: sfxStub as never,
      tryShieldRescue: () => false,
      playPickupSfx: () => {},
      playComboFillSfx: () => {},
      playMagicCastSfx: () => {
        played += 1;
      },
    });

    expect(state.bricks[1]?.alive).toBe(false);
    expect(state.magic.cooldownSec).toBeGreaterThan(9.5);
    expect(played).toBe(1);
  });
});
