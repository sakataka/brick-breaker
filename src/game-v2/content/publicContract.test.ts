import { describe, expect, test } from "vite-plus/test";
import {
  getPublicEncounterCatalog,
  getPublicRunDefinition,
  getPublicThemeDefinition,
  listPublicModules,
  PUBLIC_MODULE_CATALOG,
  PUBLIC_RUN_DEFINITIONS,
  PUBLIC_THEME_DEFINITIONS,
  validatePublicEncounterCatalog,
  validatePublicRunDefinition,
  validateStageBlueprints,
} from "./index";

describe("game-v2 public content contract", () => {
  test("keeps the shipped tier 1 campaign at 12 encounters with sequential numbering", () => {
    const run = getPublicRunDefinition(1);

    expect(PUBLIC_RUN_DEFINITIONS).toHaveLength(2);
    expect(run.id).toBe("campaign");
    expect(run.encounterCount).toBe(12);
    expect(run.shop).toEqual({
      offersPerEncounter: 1,
      optionsPerOffer: 2,
    });
    expect(run.encounters.map((encounter) => encounter.stageNumber)).toEqual(
      Array.from({ length: 12 }, (_, index) => index + 1),
    );
    expect(validatePublicRunDefinition(run)).toEqual([]);
  });

  test("keeps preview and encounter metadata populated for both threat tiers", () => {
    for (const threatTier of [1, 2] as const) {
      const encounters = getPublicEncounterCatalog(threatTier);
      expect(encounters.length).toBeGreaterThan(0);
      expect(validatePublicEncounterCatalog(encounters)).toEqual([]);
      encounters.forEach((encounter) => {
        expect(encounter.previewTags.length).toBeGreaterThan(0);
        expect(encounter.scoreFocus).toBeTruthy();
      });
    }
  });

  test("exposes shipped module and theme catalogs as public contract inputs", () => {
    expect(PUBLIC_MODULE_CATALOG.core.length).toBeGreaterThan(0);
    expect(listPublicModules().length).toBeGreaterThan(0);
    expect(PUBLIC_THEME_DEFINITIONS.map((theme) => theme.id)).toEqual([
      "chapter1",
      "chapter2",
      "chapter3",
      "midboss",
      "finalboss",
      "tier2",
    ]);
    expect(getPublicThemeDefinition("tier2").label).toBe("Threat Tier 2");
  });

  test("keeps stage blueprints aligned with shipped encounters", () => {
    expect(validateStageBlueprints()).toEqual([]);
  });
});
