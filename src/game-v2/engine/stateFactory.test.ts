import { describe, expect, test } from "vite-plus/test";
import { getPublicEncounterCatalog } from "../content";
import { DEFAULT_GAME_CONFIG } from "./config";
import { createCombatState, createEncounterState } from "./stateFactory";

describe("game-v2 state factory blueprints", () => {
  test("applies stage modifier and special brick rules from blueprints", () => {
    const stage6 = getPublicEncounterCatalog(1)[5];
    const stage7 = getPublicEncounterCatalog(1)[6];
    const stage10 = getPublicEncounterCatalog(1)[9];
    const stage11 = getPublicEncounterCatalog(1)[10];

    const encounter6 = createEncounterState(stage6);
    const combat6 = createCombatState(DEFAULT_GAME_CONFIG, stage6);
    const combat7 = createCombatState(DEFAULT_GAME_CONFIG, stage7);
    const combat10 = createCombatState(DEFAULT_GAME_CONFIG, stage10);
    const combat11 = createCombatState(DEFAULT_GAME_CONFIG, stage11);

    expect(encounter6.modifierKey).toBe("warp_zone");
    expect(combat6.bricks.filter((brick) => brick.kind === "gate")).toHaveLength(5);
    expect(combat7.bricks.filter((brick) => brick.kind === "turret")).toHaveLength(2);
    expect(combat10.bricks.filter((brick) => brick.kind === "steel")).toHaveLength(4);
    expect(combat10.bricks.every((brick) => brick.kind !== "steel" || brick.hp === 999)).toBe(true);
    expect(combat11.bricks.filter((brick) => brick.kind === "generator")).toHaveLength(1);
  });

  test("uses blueprint boss definitions for final and tier 2 boss encounters", () => {
    const finalBoss = getPublicEncounterCatalog(1)[11];
    const tier2Boss = getPublicEncounterCatalog(2)[3];

    const finalBossState = createEncounterState(finalBoss);
    const finalBossCombat = createCombatState(DEFAULT_GAME_CONFIG, finalBoss);
    const tier2BossState = createEncounterState(tier2Boss);
    const tier2BossCombat = createCombatState(DEFAULT_GAME_CONFIG, tier2Boss);

    expect(finalBossState.boss?.hp).toBe(10);
    expect(finalBossState.boss?.shotProfile).toBe("plasma_bolt");
    expect(finalBossCombat.bricks.filter((brick) => brick.kind === "boss")).toHaveLength(3);
    expect(tier2BossState.boss?.hp).toBe(16);
    expect(tier2BossState.boss?.shotProfile).toBe("void_core");
    expect(tier2BossCombat.bricks.filter((brick) => brick.kind === "boss")).toHaveLength(6);
  });
});
