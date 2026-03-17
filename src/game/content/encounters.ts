import { buildStageDefinitionFromCatalogEntry } from "../config/stageTemplateRuntime";
import { getStageBlueprintCatalog } from "./stageBlueprintCatalog";
import type {
  EncounterProfile,
  ScoreFocus,
  StageDefinition,
  StagePreviewTag,
  ThreatLevel,
} from "../types";

export type EncounterAct = 1 | 2 | 3 | 4;
export type EncounterObjective =
  | "stop-first-threat"
  | "route-control"
  | "break-window"
  | "score-window";

export interface EncounterDefinition {
  id: string;
  act: EncounterAct;
  stageNumber: number;
  stageIndex: number;
  label: string;
  stage: StageDefinition;
  mechanicSet: readonly string[];
  scoreObjective: ScoreFocus;
  previewTags: readonly StagePreviewTag[];
  climax: "none" | "midboss" | "boss" | "tier2_boss";
  rewardChoice: "module_pair";
  visualTheme: string;
  threatLevel: ThreatLevel;
  encounterProfile: EncounterProfile;
  objective: EncounterObjective;
}

function inferObjective(stage: StageDefinition): EncounterObjective {
  switch (stage.scoreFocus) {
    case "reactor_chain":
      return "route-control";
    case "turret_cancel":
      return "stop-first-threat";
    case "boss_break":
      return "break-window";
    default:
      return "score-window";
  }
}

function inferThreat(stage: StageDefinition): ThreatLevel {
  if (stage.hazardScript?.intensity) {
    return stage.hazardScript.intensity;
  }
  return stage.visualProfile?.cameraIntensity === "assault" ? "high" : "medium";
}

function buildCampaignEncounters(): EncounterDefinition[] {
  const catalog = getStageBlueprintCatalog(1);
  return catalog.map((entry, index, allEntries) => {
    const stage = buildStageDefinitionFromCatalogEntry(entry, index, allEntries);
    return {
      id: entry.encounterId,
      act: (Math.floor(index / 4) + 1) as EncounterAct,
      stageNumber: index + 1,
      stageIndex: index,
      label: `Encounter ${index + 1}`,
      stage,
      mechanicSet: (stage.boardMechanics ?? []).map((mechanic) => mechanic.role),
      scoreObjective: stage.scoreFocus ?? "survival_chain",
      previewTags: stage.previewTags ?? [],
      climax: stage.encounter?.kind ?? "none",
      rewardChoice: "module_pair",
      visualTheme: stage.visualSetId ?? `chapter-${stage.chapter ?? 1}`,
      threatLevel: inferThreat(stage),
      encounterProfile: stage.encounter?.profile ?? "none",
      objective: inferObjective(stage),
    };
  });
}

function buildThreatTier2Encounters(): EncounterDefinition[] {
  const catalog = getStageBlueprintCatalog(2);
  return catalog.map((entry, index, allEntries) => {
    const stage = buildStageDefinitionFromCatalogEntry(entry, index, allEntries);
    return {
      id: entry.encounterId,
      act: 4,
      stageNumber: index + 1,
      stageIndex: index,
      label: `Threat Tier 2 - ${index + 1}`,
      stage,
      mechanicSet: (stage.boardMechanics ?? []).map((mechanic) => mechanic.role),
      scoreObjective: stage.scoreFocus ?? "boss_break",
      previewTags: stage.previewTags ?? [],
      climax: stage.encounter?.kind ?? "tier2_boss",
      rewardChoice: "module_pair",
      visualTheme: stage.visualSetId ?? "threat-tier-2",
      threatLevel: "critical",
      encounterProfile: stage.encounter?.profile ?? "tier2_overlord",
      objective: inferObjective(stage),
    };
  });
}

export const CAMPAIGN_ENCOUNTERS = buildCampaignEncounters();
export const THREAT_TIER_2_ENCOUNTERS = buildThreatTier2Encounters();

export function validateEncounterDefinitions(encounters: readonly EncounterDefinition[]): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const encounter of encounters) {
    if (ids.has(encounter.id)) {
      issues.push(`duplicate encounter id: ${encounter.id}`);
    }
    ids.add(encounter.id);
    if (!encounter.stage.layout.length) {
      issues.push(`empty stage layout: ${encounter.id}`);
    }
    if (encounter.previewTags.length === 0) {
      issues.push(`missing preview tags: ${encounter.id}`);
    }
  }
  return {
    valid: issues.length === 0,
    issues,
  };
}
