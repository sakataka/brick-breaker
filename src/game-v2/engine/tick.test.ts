import { describe, expect, test } from "vite-plus/test";
import { getPublicEncounterCatalog } from "../content";
import { DEFAULT_GAME_CONFIG } from "./config";
import { createCombatState, createEncounterState, createInitialGameState } from "./stateFactory";
import { tickGame } from "./tick";

describe("game-v2 boss cycle", () => {
  test("projects telegraph -> attack -> punish window for boss encounters", () => {
    const encounter = getPublicEncounterCatalog(1)[11];
    const state = createInitialGameState(DEFAULT_GAME_CONFIG, false, "playing");
    state.encounter = createEncounterState(encounter);
    state.combat = createCombatState(DEFAULT_GAME_CONFIG, encounter);

    tickGame(state, DEFAULT_GAME_CONFIG, 1);
    expect(state.encounter.boss?.intent).toBe("volley");
    expect(state.encounter.boss?.telegraphProgress).toBeGreaterThan(0);

    state.run.elapsedSec = 1.6;
    tickGame(state, DEFAULT_GAME_CONFIG, 0.1);
    expect(state.encounter.boss?.attackProgress).toBeGreaterThan(0);
    expect(state.combat.bossProjectiles.length).toBeGreaterThan(0);

    state.run.elapsedSec = 3.3;
    tickGame(state, DEFAULT_GAME_CONFIG, 0.1);
    expect(state.encounter.boss?.punishProgress).toBeGreaterThan(0);
  });
});
