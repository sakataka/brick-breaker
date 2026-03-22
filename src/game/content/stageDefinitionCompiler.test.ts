import { describe, expect, test } from "vite-plus/test";
import { buildStageCatalog, buildStageDefinitionFromCatalogEntry } from "./stageDefinitionCompiler";
import { getStageBlueprintCatalog } from "./stageBlueprintCatalog";

describe("stageDefinitionCompiler", () => {
  test("builds campaign stages from blueprint catalog entries", () => {
    const catalog = getStageBlueprintCatalog(1);
    const stage = buildStageDefinitionFromCatalogEntry(catalog[8], 8, catalog);

    expect(stage.id).toBe(9);
    expect(stage.chapter).toBe(3);
    expect(stage.layout).toHaveLength(6);
    expect(stage.scoreFocus).toBe("boss_break");
    expect(stage.hazardScript).toEqual({ id: "boss_arena", intensity: "high" });
    expect(stage.visualSetId).toBe("sfc-arcade-artillery");
  });

  test("builds the full threat-tier catalog with stable numbering and speed scaling", () => {
    const catalog = buildStageCatalog(getStageBlueprintCatalog(2));

    expect(catalog).toHaveLength(4);
    expect(catalog[0]?.id).toBe(1);
    expect(catalog[3]?.id).toBe(4);
    expect(catalog[0]?.speedScale).toBe(1);
    expect(catalog[3]?.speedScale).toBe(1.18);
  });
});
