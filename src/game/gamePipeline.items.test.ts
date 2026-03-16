import { describe, expect, test } from "vite-plus/test";

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
  state.combat.balls = [ball];
}

describe("gamePipeline items", () => {
  test("stageclear then advanceStage preserves active effects and starts next stage", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.combat.items.active.multiballStacks = 3;
    state.combat.items.active.pierceStacks = 1;
    state.combat.balls = [
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
    state.combat.bricks = [{ id: 1, x: 100, y: 70, width: 40, height: 12, alive: true }];

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
    expect(state.run.progress.encounterIndex).toBe(1);
    expect(state.combat.items.active.multiballStacks).toBe(3);
    expect(state.combat.items.active.pierceStacks).toBe(1);
    expect(state.combat.balls).toHaveLength(4);
  });

  test("plays item pickup sounds by item type with a two-sound cap per frame", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.combat.bricks = [];
    state.combat.paddle = { ...state.combat.paddle, x: 90, y: 120, width: 100, height: 20 };
    state.combat.balls = [
      {
        pos: { x: 130, y: 90 },
        vel: { x: 0, y: -120 },
        radius: 6,
        speed: config.initialBallSpeed,
      },
    ];
    state.combat.items.falling.push(
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
    state.combat.items.active.laserStacks = 2;
    state.combat.laserCooldownSec = 0;
    const paddleCenterX = state.combat.paddle.x + state.combat.paddle.width / 2;
    state.combat.bricks = [
      {
        id: 1,
        x: paddleCenterX - 14,
        y: state.combat.paddle.y - 28,
        width: 28,
        height: 12,
        alive: true,
      },
    ];
    state.combat.balls = [
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
    expect(state.combat.bricks.every((brick) => !brick.alive)).toBe(true);
    expect(state.run.score).toBeGreaterThan(0);
  });

  test("shield burst pushes balls upward and damages nearby bottom bricks", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.combat.shieldBurstQueued = true;
    state.combat.bricks = [
      { id: 1, x: 80, y: 126, width: 30, height: 10, alive: true, hp: 1 },
      { id: 2, x: 120, y: 122, width: 30, height: 10, alive: true, hp: 1 },
      { id: 3, x: 50, y: 20, width: 30, height: 10, alive: true, hp: 1 },
    ];
    state.combat.balls = [
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
    expect(state.combat.balls.every((ball) => ball.vel.y <= -260)).toBe(true);
    expect(state.combat.bricks.filter((brick) => !brick.alive).length).toBeGreaterThanOrEqual(2);
  });

  test("generates one shop offer per stage", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.combat.bricks = [];
    state.encounter.shop.lastOffer = null;
    state.combat.balls = [
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

    expect(state.encounter.shop.lastOffer).not.toBeNull();
    expect(state.encounter.shop.lastOffer).toHaveLength(2);
  });

  test("enemy collision defeats enemy and grants score", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.combat.bricks = [];
    state.combat.enemies = [{ id: 1, x: 120, y: 100, vx: 0, radius: 10, alive: true }];
    state.combat.balls = [
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

    expect(state.combat.enemies).toHaveLength(0);
    expect(state.run.score).toBeGreaterThanOrEqual(150);
  });

  test("combo fill sfx fires once when crossing x2.5", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.run.combo.multiplier = 2.25;
    state.run.combo.streak = 6;
    state.run.combo.lastHitSec = 0;
    state.run.elapsedSec = 0.2;
    state.combat.bricks = [{ id: 1, x: 30, y: 40, width: 36, height: 10, alive: true }];
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
    expect(state.run.combo.fillTriggered).toBe(true);
  });

  test("magic cast destroys nearest brick and starts cooldown", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.combat.magic.requestCast = true;
    state.combat.bricks = [
      { id: 1, x: 20, y: 40, width: 30, height: 10, alive: true },
      { id: 2, x: 110, y: 80, width: 30, height: 10, alive: true },
    ];
    state.combat.balls = [
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

    expect(state.combat.bricks[1]?.alive).toBe(false);
    expect(state.combat.magic.cooldownSec).toBeGreaterThan(9.5);
    expect(played).toBe(1);
  });
});
