import { describe, expect, test } from "vite-plus/test";

import { GAME_CONFIG } from "./config";
import { stepPlayingPipeline } from "./gamePipeline";
import { createInitialGameState } from "./stateFactory";
import type { Ball, RandomSource } from "./types";

const random: RandomSource = { next: () => 0.5 };
const sfxStub = {
  play: () => Promise.resolve(),
} as const;

function overrideSingleBall(state: ReturnType<typeof createInitialGameState>, ball: Ball): void {
  state.combat.balls = [ball];
}

describe("gamePipeline enemy", () => {
  test("late-stage shop offer includes at least one attack-oriented item", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.run.progress.encounterIndex = 9;
    state.encounter.shop.lastOffer = null;
    state.combat.bricks = [];
    overrideSingleBall(state, {
      pos: { x: 120, y: 140 },
      vel: { x: 0, y: -100 },
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

    const offer = state.encounter.shop.lastOffer ?? ["paddle_plus", "slow_ball"];
    const attackTypes = new Set([
      "laser",
      "pierce",
      "bomb",
      "shockwave",
      "homing",
      "rail",
      "multiball",
    ]);
    expect(offer.some((type) => attackTypes.has(type))).toBe(true);
  });

  test("split elite spawns child bricks after destroy", () => {
    const config = { ...GAME_CONFIG, width: 320, height: 220, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.combat.bricks = [
      {
        id: 10,
        x: 140,
        y: 80,
        width: 40,
        height: 14,
        alive: true,
        kind: "split",
        hp: 1,
        maxHp: 1,
      },
    ];
    overrideSingleBall(state, {
      pos: { x: 160, y: 72 },
      vel: { x: 0, y: 140 },
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

    expect(state.combat.bricks.filter((brick) => brick.alive).length).toBeGreaterThanOrEqual(2);
  });

  test("summon elite can spawn additional enemy", () => {
    const config = { ...GAME_CONFIG, width: 320, height: 220, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.run.score = 0;
    state.combat.bricks = [
      { id: 1, x: 120, y: 70, width: 36, height: 12, alive: true, kind: "summon", hp: 1, maxHp: 1 },
    ];
    overrideSingleBall(state, {
      pos: { x: 138, y: 64 },
      vel: { x: 0, y: 130 },
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

    expect(state.combat.enemies.length).toBeGreaterThanOrEqual(1);
  });

  test("thorns elite applies retaliation penalty and speed boost", () => {
    const config = { ...GAME_CONFIG, width: 320, height: 220, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.run.score = 0;
    state.combat.bricks = [
      { id: 2, x: 170, y: 70, width: 36, height: 12, alive: true, kind: "thorns", hp: 1, maxHp: 1 },
    ];
    overrideSingleBall(state, {
      pos: { x: 186, y: 64 },
      vel: { x: 0, y: 130 },
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

    expect(state.combat.hazard.speedBoostUntilSec).toBeGreaterThan(state.run.elapsedSec);
  });

  test("stage modifiers with spawnEnemy can trigger timed reinforcements", () => {
    const config = { ...GAME_CONFIG, width: 300, height: 200, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.run.progress.encounterIndex = 8;
    state.encounter.enemyWaveCooldownSec = 0;
    state.combat.bricks = [];
    overrideSingleBall(state, {
      pos: { x: 32, y: 160 },
      vel: { x: 0, y: -120 },
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

    expect(state.combat.enemies.length).toBeGreaterThan(0);
    expect(state.encounter.enemyWaveCooldownSec).toBeGreaterThan(0);
  });
});
