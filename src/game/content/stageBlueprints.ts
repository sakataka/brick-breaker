import {
  CAMPAIGN_STAGE_BLUEPRINT_CATALOG,
  THREAT_TIER_2_STAGE_BLUEPRINT_CATALOG,
} from "./blueprints/catalogs";
import { CAMPAIGN_CHAPTER_1_BLUEPRINTS } from "./blueprints/campaignChapter1";
import { CAMPAIGN_CHAPTER_2_BLUEPRINTS } from "./blueprints/campaignChapter2";
import { CAMPAIGN_CHAPTER_3_BLUEPRINTS } from "./blueprints/campaignChapter3";
import { CAMPAIGN_CHAPTER_4_BLUEPRINTS } from "./blueprints/campaignChapter4";
import { THREAT_TIER_2_BLUEPRINTS } from "./blueprints/threatTier2";
import type { StageBlueprint } from "./blueprints/types";

export type { StageBlueprint, StageBlueprintCatalogEntry } from "./blueprints/types";

const STAGE_BLUEPRINTS: readonly StageBlueprint[] = [
  ...CAMPAIGN_CHAPTER_1_BLUEPRINTS,
  ...CAMPAIGN_CHAPTER_2_BLUEPRINTS,
  ...CAMPAIGN_CHAPTER_3_BLUEPRINTS,
  ...CAMPAIGN_CHAPTER_4_BLUEPRINTS,
  ...THREAT_TIER_2_BLUEPRINTS,
];

export { CAMPAIGN_STAGE_BLUEPRINT_CATALOG, THREAT_TIER_2_STAGE_BLUEPRINT_CATALOG };

export function getStageBlueprint(blueprintId: string): StageBlueprint {
  const blueprint = STAGE_BLUEPRINTS.find((entry) => entry.id === blueprintId);
  if (!blueprint) {
    throw new Error(`Unknown stage blueprint: ${blueprintId}`);
  }
  return blueprint;
}
