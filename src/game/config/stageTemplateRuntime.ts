import { validateStageCatalog } from "../configSchema";
import { buildStageCatalog } from "../content/stageDefinitionCompiler";
import {
  CAMPAIGN_STAGE_BLUEPRINT_CATALOG,
  THREAT_TIER_2_STAGE_BLUEPRINT_CATALOG,
} from "../content/stageBlueprints";
import type { StageDefinition } from "../types";

export * from "./stageProgressionConfig";

export interface BrickLayout {
  cols: number;
  rows: number;
  marginX: number;
  marginY: number;
  gapX: number;
  gapY: number;
  boardWidth: number;
  brickHeight: number;
}

export const BRICK_LAYOUT: BrickLayout = {
  cols: 10,
  rows: 6,
  marginX: 50,
  marginY: 80,
  gapX: 8,
  gapY: 10,
  boardWidth: 840,
  brickHeight: 24,
};

export const STAGE_CATALOG: StageDefinition[] = validateStageCatalog(
  buildStageCatalog(CAMPAIGN_STAGE_BLUEPRINT_CATALOG),
);
validateStageCatalog(buildStageCatalog(THREAT_TIER_2_STAGE_BLUEPRINT_CATALOG));

export function getStageByIndex(stageIndex: number): StageDefinition {
  const safeIndex = Math.max(0, Math.min(STAGE_CATALOG.length - 1, stageIndex));
  return STAGE_CATALOG[safeIndex];
}
