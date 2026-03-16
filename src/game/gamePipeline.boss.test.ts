import { describe, expect, test } from "vite-plus/test";

import { GAME_CONFIG } from "./config";
import { stepPlayingPipeline } from "./gamePipeline";
import { createInitialGameState } from "./stateFactory";
import { setBossRuntime } from "./testHelpers/runtimeState";
import type { Ball, RandomSource } from "./types";

const random: RandomSource = { next: () => 0.5 };
const sfxStub = {
  play: () => Promise.resolve(),
} as const;

function overrideSingleBall(state: ReturnType<typeof createInitialGameState>, ball: Ball): void {
  state.combat.balls = [ball];
}

describe("gamePipeline boss", () => {
  test("boss enters phase 2 and can summon adds", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 180, fixedDeltaSec: 1 / 60 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.combat.bricks = [
      { id: 1, x: 90, y: 40, width: 80, height: 18, alive: true, kind: "boss", hp: 6, maxHp: 12 },
    ];
    overrideSingleBall(state, {
      pos: { x: 30, y: 150 },
      vel: { x: 0, y: -50 },
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
    expect(state.encounter.bossPhase).toBe(2);

    setBossRuntime(state, { phase: 2 });
    state.encounter.bossPhaseSummonCooldownSec = 0;
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
  });

  test("rail item lets one laser projectile hit multiple bricks", () => {
    const config = { ...GAME_CONFIG, width: 260, height: 220, fixedDeltaSec: 0.2 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.combat.bricks = [
      { id: 1, x: 120, y: 120, width: 20, height: 10, alive: true, hp: 1 },
      { id: 2, x: 120, y: 90, width: 20, height: 10, alive: true, hp: 1 },
      { id: 3, x: 120, y: 60, width: 20, height: 10, alive: true, hp: 1 },
    ];
    state.combat.items.active.railStacks = 2;
    state.combat.laserProjectiles = [{ id: 1, x: 130, y: 132, speed: 760 }];
    overrideSingleBall(state, {
      pos: { x: 30, y: 200 },
      vel: { x: 0, y: -30 },
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

    expect(state.combat.bricks.filter((brick) => !brick.alive).length).toBeGreaterThanOrEqual(2);
  });

  test("phase 3 boss produces telegraph state before arena attack", () => {
    const config = { ...GAME_CONFIG, width: 300, height: 220, fixedDeltaSec: 3.2 };
    const state = createInitialGameState(config, true, "playing");
    state.scene = "playing";
    state.combat.bricks = [
      { id: 1, x: 110, y: 32, width: 80, height: 18, alive: true, kind: "boss", hp: 5, maxHp: 18 },
    ];
    overrideSingleBall(state, {
      pos: { x: 150, y: 184 },
      vel: { x: 0, y: -40 },
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

    setBossRuntime(state, {
      phase: state.encounter.bossPhase,
      threatLevel: state.encounter.threatLevel,
    });
    expect(state.encounter.bossPhase).toBe(3);
    expect(state.encounter.runtime.telegraph).not.toBeNull();
    expect(state.encounter.threatLevel).toBe("critical");
    expect(state.encounter.runtime.lastTriggeredPhase).toBe(3);
  });
});
