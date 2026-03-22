import type { StageBlueprintCatalogEntry } from "./types";

export const CAMPAIGN_STAGE_BLUEPRINT_CATALOG: readonly StageBlueprintCatalogEntry[] = [
  { encounterId: "campaign-1", blueprintId: "campaign-1", chapter: 1, archetype: "wide_open" },
  { encounterId: "campaign-2", blueprintId: "campaign-2", chapter: 1, archetype: "corridor" },
  { encounterId: "campaign-3", blueprintId: "campaign-3", chapter: 1, archetype: "corridor" },
  { encounterId: "campaign-4", blueprintId: "campaign-4", chapter: 2, archetype: "chokepoint" },
  { encounterId: "campaign-5", blueprintId: "campaign-5", chapter: 2, archetype: "chokepoint" },
  { encounterId: "campaign-6", blueprintId: "campaign-6", chapter: 2, archetype: "split_lane" },
  { encounterId: "campaign-7", blueprintId: "campaign-7", chapter: 3, archetype: "control" },
  { encounterId: "campaign-8", blueprintId: "campaign-8", chapter: 3, archetype: "control" },
  { encounterId: "campaign-9", blueprintId: "campaign-9", chapter: 3, archetype: "control" },
  { encounterId: "campaign-10", blueprintId: "campaign-10", chapter: 4, archetype: "split_lane" },
  { encounterId: "campaign-11", blueprintId: "campaign-11", chapter: 4, archetype: "split_lane" },
  { encounterId: "campaign-12", blueprintId: "campaign-12", chapter: 4, archetype: "boss_arena" },
] as const;

export const THREAT_TIER_2_STAGE_BLUEPRINT_CATALOG: readonly StageBlueprintCatalogEntry[] = [
  { encounterId: "threat-tier-2-1", blueprintId: "tier2-1", chapter: 4, archetype: "tier2_arena" },
  { encounterId: "threat-tier-2-2", blueprintId: "tier2-2", chapter: 4, archetype: "control" },
  { encounterId: "threat-tier-2-3", blueprintId: "tier2-3", chapter: 4, archetype: "split_lane" },
  {
    encounterId: "threat-tier-2-4",
    blueprintId: "tier2-4",
    chapter: 4,
    archetype: "tier2_arena",
  },
] as const;
