import { describe, expect, test } from "vitest";
import { getPublicEncounterCatalog } from "../content";
import { DEFAULT_GAME_CONFIG } from "./config";
import { createCombatState, createEncounterState, createInitialGameState } from "./stateFactory";
import { tickGame } from "./tick";
import { advanceEncounter } from "./transitions";

describe("game-v2 boss cycle", () => {
  test("projects telegraph -> attack -> punish window for boss encounters", () => {
    const encounter = getPublicEncounterCatalog(1)[11];
    const state = createInitialGameState(DEFAULT_GAME_CONFIG, false, "playing");
    state.encounter = createEncounterState(encounter);
    state.combat = createCombatState(DEFAULT_GAME_CONFIG, encounter);

    tickGame(state, DEFAULT_GAME_CONFIG, 1);
    expect(state.encounter.boss?.intent).toBe("volley");
    expect(state.encounter.boss?.telegraphProgress).toBeGreaterThan(0);

    state.encounter.elapsedSec = 1.6;
    tickGame(state, DEFAULT_GAME_CONFIG, 0.1);
    expect(state.encounter.boss?.attackProgress).toBeGreaterThan(0);
    expect(state.combat.bossProjectiles.length).toBeGreaterThan(0);

    state.encounter.elapsedSec = 3.3;
    tickGame(state, DEFAULT_GAME_CONFIG, 0.1);
    expect(state.encounter.boss?.punishProgress).toBeGreaterThan(0);
  });
});

describe("game-v2 stage and combo timing", () => {
  test("does not clear a stage just because time has elapsed while objectives remain", () => {
    const state = createInitialGameState(DEFAULT_GAME_CONFIG, false, "playing");
    state.combat.balls = [];

    tickGame(state, DEFAULT_GAME_CONFIG, 11);

    expect(state.scene).toBe("playing");
    expect(state.run.elapsedSec).toBe(11);
    expect(state.encounter.elapsedSec).toBe(11);
  });

  test("clears the stage only after objective bricks are gone", () => {
    const state = createInitialGameState(DEFAULT_GAME_CONFIG, false, "playing");
    state.combat.balls = [];
    state.combat.bricks.forEach((brick) => {
      if (brick.kind !== "steel" && brick.kind !== "gate") {
        brick.alive = false;
      }
    });

    tickGame(state, DEFAULT_GAME_CONFIG, 0);

    expect(state.scene).toBe("stageclear");
  });

  test("resets encounter time when advancing while preserving run time", () => {
    const state = createInitialGameState(DEFAULT_GAME_CONFIG, false, "stageclear");
    state.run.elapsedSec = 12;
    state.encounter.elapsedSec = 8;

    expect(advanceEncounter(state, DEFAULT_GAME_CONFIG)).toBe(true);

    expect(state.run.elapsedSec).toBe(12);
    expect(state.encounter.elapsedSec).toBe(0);
  });

  test("keeps combo multiplier only inside the shipped combo window", () => {
    const state = createInitialGameState(DEFAULT_GAME_CONFIG, false, "playing");
    const brick = state.combat.bricks.find((candidate) => candidate.kind === "normal");
    expect(brick).toBeTruthy();
    if (!brick) {
      return;
    }
    const ball = state.combat.balls[0];
    ball.pos = { x: brick.x + brick.width / 2, y: brick.y + brick.height / 2 };
    ball.vel = { x: 0, y: 0 };

    tickGame(state, DEFAULT_GAME_CONFIG, 0);

    expect(state.run.comboMultiplier).toBe(1.25);
    expect(state.run.comboWindowRemainingSec).toBe(state.run.comboWindowSec);

    state.combat.balls = [];
    tickGame(state, DEFAULT_GAME_CONFIG, 1.7);
    expect(state.run.comboMultiplier).toBe(1.25);

    tickGame(state, DEFAULT_GAME_CONFIG, 0.2);
    expect(state.run.comboMultiplier).toBe(1);
    expect(state.run.comboWindowRemainingSec).toBe(0);
  });
});
