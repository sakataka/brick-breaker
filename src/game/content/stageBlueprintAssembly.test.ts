import { describe, expect, test } from "vite-plus/test";
import { validateStageCatalog } from "../configSchema";
import { buildStageCatalog } from "./stageDefinitionCompiler";
import { getStageBlueprintCatalog } from "./stageBlueprintCatalog";
import { CAMPAIGN_CHAPTER_1_BLUEPRINTS } from "./blueprints/campaignChapter1";
import { CAMPAIGN_CHAPTER_2_BLUEPRINTS } from "./blueprints/campaignChapter2";
import { CAMPAIGN_CHAPTER_3_BLUEPRINTS } from "./blueprints/campaignChapter3";
import { CAMPAIGN_CHAPTER_4_BLUEPRINTS } from "./blueprints/campaignChapter4";
import { THREAT_TIER_2_BLUEPRINTS } from "./blueprints/threatTier2";
import {
  CAMPAIGN_STAGE_BLUEPRINT_CATALOG,
  THREAT_TIER_2_STAGE_BLUEPRINT_CATALOG,
  getStageBlueprint,
} from "./stageBlueprints";

describe("stage blueprint assembly", () => {
  test("keeps the expected blueprint counts per split file", () => {
    expect(CAMPAIGN_CHAPTER_1_BLUEPRINTS).toHaveLength(3);
    expect(CAMPAIGN_CHAPTER_2_BLUEPRINTS).toHaveLength(3);
    expect(CAMPAIGN_CHAPTER_3_BLUEPRINTS).toHaveLength(3);
    expect(CAMPAIGN_CHAPTER_4_BLUEPRINTS).toHaveLength(3);
    expect(THREAT_TIER_2_BLUEPRINTS).toHaveLength(4);
  });

  test("keeps unique blueprint ids and catalog resolution", () => {
    const ids = new Set<string>();
    for (const catalog of [
      CAMPAIGN_STAGE_BLUEPRINT_CATALOG,
      THREAT_TIER_2_STAGE_BLUEPRINT_CATALOG,
    ]) {
      for (const entry of catalog) {
        expect(ids.has(entry.blueprintId)).toBe(false);
        ids.add(entry.blueprintId);
        expect(getStageBlueprint(entry.blueprintId).id).toBe(entry.blueprintId);
      }
    }
  });

  test("preserves catalog counts and compiled stage validation", () => {
    expect(CAMPAIGN_STAGE_BLUEPRINT_CATALOG).toHaveLength(12);
    expect(THREAT_TIER_2_STAGE_BLUEPRINT_CATALOG).toHaveLength(4);
    expect(validateStageCatalog(buildStageCatalog(getStageBlueprintCatalog(1)))).toHaveLength(12);
    expect(validateStageCatalog(buildStageCatalog(getStageBlueprintCatalog(2)))).toHaveLength(4);
  });
});
