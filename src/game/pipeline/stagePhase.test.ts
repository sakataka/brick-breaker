import { describe, expect, test } from "bun:test";
import { GAME_CONFIG } from "../config";
import { createInitialGameState } from "../stateFactory";
import { updateStageControlBricks } from "./stagePhase";

describe("stagePhase", () => {
  test("generator respawns one nearby normal brick after cooldown", () => {
    const state = createInitialGameState(GAME_CONFIG, true, "playing");
    state.bricks = [
      {
        id: 1,
        x: 120,
        y: 70,
        width: 36,
        height: 12,
        alive: true,
        kind: "generator",
        hp: 2,
        maxHp: 2,
        row: 1,
        col: 1,
        cooldownSec: 0,
      },
      {
        id: 2,
        x: 164,
        y: 70,
        width: 36,
        height: 12,
        alive: false,
        kind: "normal",
        hp: 0,
        maxHp: 1,
        row: 1,
        col: 2,
      },
    ];

    updateStageControlBricks(state, { generatorActive: true, gateActive: false, turretActive: false }, 0.2);

    expect(state.bricks[1]?.alive).toBe(true);
    expect(state.vfx.floatingTexts.some((text) => text.key === "generator")).toBe(true);
  });
});
