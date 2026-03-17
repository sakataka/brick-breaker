import {
  CAMPAIGN_STAGE_BLUEPRINT_CATALOG,
  getStageBlueprint,
  THREAT_TIER_2_STAGE_BLUEPRINT_CATALOG,
  type StageBlueprint,
  type StageBlueprintCatalogEntry,
} from "./stageBlueprints";
import type { ThreatTier } from "./runDefinition";

export { type StageBlueprintCatalogEntry };

export function getStageBlueprintCatalog(
  threatTier: ThreatTier,
): readonly StageBlueprintCatalogEntry[] {
  return threatTier === 2
    ? THREAT_TIER_2_STAGE_BLUEPRINT_CATALOG
    : CAMPAIGN_STAGE_BLUEPRINT_CATALOG;
}

export function getStageBlueprintForEncounter(encounterId: string): StageBlueprint {
  const entry = [
    ...CAMPAIGN_STAGE_BLUEPRINT_CATALOG,
    ...THREAT_TIER_2_STAGE_BLUEPRINT_CATALOG,
  ].find((item) => item.encounterId === encounterId);
  if (!entry) {
    throw new Error(`Unknown stage blueprint catalog entry: ${encounterId}`);
  }
  return getStageBlueprint(entry.blueprintId);
}

export function validateStageBlueprintCatalog(catalog: readonly StageBlueprintCatalogEntry[]): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const seenEncounterIds = new Set<string>();
  for (const entry of catalog) {
    if (seenEncounterIds.has(entry.encounterId)) {
      issues.push(`duplicate blueprint catalog encounter: ${entry.encounterId}`);
    }
    seenEncounterIds.add(entry.encounterId);
    try {
      getStageBlueprint(entry.blueprintId);
    } catch {
      issues.push(`unknown blueprint id: ${entry.blueprintId}`);
    }
  }
  return {
    valid: issues.length === 0,
    issues,
  };
}
