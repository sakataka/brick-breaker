import { describe, expect, test } from "vite-plus/test";
import {
  ENCOUNTER_KINDS,
  ENCOUNTER_PROFILES,
  SCORE_FOCUSES,
  STAGE_PREVIEW_TAGS,
  THREAT_LEVELS,
} from "../types";
import { validateEncounterDefinitions } from "./encounters";
import { getRunDefinition, validateRunDefinition } from "./runDefinition";

describe("runDefinition", () => {
  test("campaign run definitions are internally consistent", () => {
    const tier1 = getRunDefinition(1);
    const tier2 = getRunDefinition(2);

    expect(validateEncounterDefinitions(tier1.encounters).issues).toEqual([]);
    expect(validateEncounterDefinitions(tier2.encounters).issues).toEqual([]);
    expect(validateRunDefinition(tier1).issues).toEqual([]);
    expect(validateRunDefinition(tier2).issues).toEqual([]);
  });

  test("tier 1 keeps the 12-encounter campaign and tier 2 keeps the final sequence", () => {
    expect(getRunDefinition(1).encounters).toHaveLength(12);
    expect(getRunDefinition(2).encounters.length).toBeGreaterThan(0);
    expect(getRunDefinition(1).acts).toHaveLength(3);
    expect(getRunDefinition(2).acts).toHaveLength(1);
  });

  test("encounter runtime literals stay inside the shared source-of-truth sets", () => {
    const scoreFocuses = new Set(SCORE_FOCUSES);
    const previewTags = new Set(STAGE_PREVIEW_TAGS);
    const encounterKinds = new Set(ENCOUNTER_KINDS);
    const encounterProfiles = new Set(ENCOUNTER_PROFILES);
    const threatLevels = new Set(THREAT_LEVELS);

    for (const threatTier of [1, 2] as const) {
      for (const encounter of getRunDefinition(threatTier).encounters) {
        expect(scoreFocuses.has(encounter.scoreObjective)).toBe(true);
        expect(encounterKinds.has(encounter.climax)).toBe(true);
        expect(encounterProfiles.has(encounter.encounterProfile)).toBe(true);
        expect(threatLevels.has(encounter.threatLevel)).toBe(true);
        for (const previewTag of encounter.previewTags) {
          expect(previewTags.has(previewTag)).toBe(true);
        }
      }
    }
  });
});
