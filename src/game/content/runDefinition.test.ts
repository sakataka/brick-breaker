import { describe, expect, test } from "vite-plus/test";
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
});
