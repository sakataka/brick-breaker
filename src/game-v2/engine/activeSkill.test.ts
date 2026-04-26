import { describe, expect, test } from "vitest";
import { castActiveSkill } from "./activeSkill";
import { DEFAULT_GAME_CONFIG } from "./config";
import { createInitialGameState } from "./stateFactory";
import { tickGame } from "./tick";

describe("game-v2 active skill", () => {
  test("casts once, starts cooldown, and refuses recast until cooldown ends", () => {
    const state = createInitialGameState(DEFAULT_GAME_CONFIG, false, "playing");
    const startingScore = state.run.score;

    expect(castActiveSkill(state)).toBe(true);
    expect(state.run.score).toBe(startingScore + 250);
    expect(state.combat.activeSkill.remainingCooldownSec).toBe(6);

    expect(castActiveSkill(state)).toBe(false);
    expect(state.run.score).toBe(startingScore + 250);

    tickGame(state, DEFAULT_GAME_CONFIG, 6);
    expect(state.combat.activeSkill.remainingCooldownSec).toBe(0);
    expect(castActiveSkill(state)).toBe(true);
  });

  test("does not destroy steel or gate bricks", () => {
    const state = createInitialGameState(DEFAULT_GAME_CONFIG, false, "playing");
    state.combat.bricks = [
      {
        id: 1,
        x: 0,
        y: 0,
        width: 10,
        height: 10,
        alive: true,
        kind: "steel",
        hp: 999,
      },
      {
        id: 2,
        x: 20,
        y: 0,
        width: 10,
        height: 10,
        alive: true,
        kind: "gate",
        hp: 1,
      },
    ];

    expect(castActiveSkill(state)).toBe(false);
    expect(state.combat.bricks.every((brick) => brick.alive)).toBe(true);
    expect(state.combat.activeSkill.remainingCooldownSec).toBe(0);
  });
});
