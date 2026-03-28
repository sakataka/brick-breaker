import type {
  PublicThreatTier,
  ScoreFocus,
  StagePreviewTag,
  ThemeBandId,
  ThreatLevel,
} from "../public/types";

export interface PublicEncounterDefinition {
  id: string;
  stageNumber: number;
  label: string;
  act: 1 | 2 | 3 | 4;
  threatTier: PublicThreatTier;
  scoreFocus: ScoreFocus;
  previewTags: readonly StagePreviewTag[];
  threatLevel: ThreatLevel;
  visualTheme: ThemeBandId;
  climax: "none" | "midboss" | "boss" | "tier2_boss";
  objective: "stop-first-threat" | "route-control" | "break-window" | "score-window";
}

const PUBLIC_ENCOUNTERS: Record<PublicThreatTier, readonly PublicEncounterDefinition[]> = {
  1: [
    {
      id: "encounter-01",
      stageNumber: 1,
      label: "Encounter 1",
      act: 1,
      threatTier: 1,
      scoreFocus: "survival_chain",
      previewTags: ["survival_check", "relay_chain"],
      threatLevel: "low",
      visualTheme: "chapter1",
      climax: "none",
      objective: "score-window",
    },
    {
      id: "encounter-02",
      stageNumber: 2,
      label: "Encounter 2",
      act: 1,
      threatTier: 1,
      scoreFocus: "reactor_chain",
      previewTags: ["reactor_chain", "shielded_grid"],
      threatLevel: "medium",
      visualTheme: "chapter1",
      climax: "none",
      objective: "route-control",
    },
    {
      id: "encounter-03",
      stageNumber: 3,
      label: "Encounter 3",
      act: 1,
      threatTier: 1,
      scoreFocus: "turret_cancel",
      previewTags: ["turret_lane", "survival_check"],
      threatLevel: "medium",
      visualTheme: "chapter1",
      climax: "none",
      objective: "stop-first-threat",
    },
    {
      id: "encounter-04",
      stageNumber: 4,
      label: "Encounter 4",
      act: 1,
      threatTier: 1,
      scoreFocus: "boss_break",
      previewTags: ["boss_break", "sweep_alert"],
      threatLevel: "high",
      visualTheme: "midboss",
      climax: "midboss",
      objective: "break-window",
    },
    {
      id: "encounter-05",
      stageNumber: 5,
      label: "Encounter 5",
      act: 2,
      threatTier: 1,
      scoreFocus: "survival_chain",
      previewTags: ["gate_pressure", "survival_check"],
      threatLevel: "medium",
      visualTheme: "chapter2",
      climax: "none",
      objective: "score-window",
    },
    {
      id: "encounter-06",
      stageNumber: 6,
      label: "Encounter 6",
      act: 2,
      threatTier: 1,
      scoreFocus: "reactor_chain",
      previewTags: ["reactor_chain", "hazard_flux"],
      threatLevel: "medium",
      visualTheme: "chapter2",
      climax: "none",
      objective: "route-control",
    },
    {
      id: "encounter-07",
      stageNumber: 7,
      label: "Encounter 7",
      act: 2,
      threatTier: 1,
      scoreFocus: "turret_cancel",
      previewTags: ["turret_lane", "gate_pressure"],
      threatLevel: "high",
      visualTheme: "chapter2",
      climax: "none",
      objective: "stop-first-threat",
    },
    {
      id: "encounter-08",
      stageNumber: 8,
      label: "Encounter 8",
      act: 2,
      threatTier: 1,
      scoreFocus: "boss_break",
      previewTags: ["boss_break", "sweep_alert"],
      threatLevel: "high",
      visualTheme: "midboss",
      climax: "midboss",
      objective: "break-window",
    },
    {
      id: "encounter-09",
      stageNumber: 9,
      label: "Encounter 9",
      act: 3,
      threatTier: 1,
      scoreFocus: "survival_chain",
      previewTags: ["hazard_flux", "survival_check"],
      threatLevel: "high",
      visualTheme: "chapter3",
      climax: "none",
      objective: "score-window",
    },
    {
      id: "encounter-10",
      stageNumber: 10,
      label: "Encounter 10",
      act: 3,
      threatTier: 1,
      scoreFocus: "reactor_chain",
      previewTags: ["reactor_chain", "fortress_core"],
      threatLevel: "high",
      visualTheme: "chapter3",
      climax: "none",
      objective: "route-control",
    },
    {
      id: "encounter-11",
      stageNumber: 11,
      label: "Encounter 11",
      act: 3,
      threatTier: 1,
      scoreFocus: "turret_cancel",
      previewTags: ["turret_lane", "fortress_core"],
      threatLevel: "high",
      visualTheme: "chapter3",
      climax: "none",
      objective: "stop-first-threat",
    },
    {
      id: "encounter-12",
      stageNumber: 12,
      label: "Encounter 12",
      act: 3,
      threatTier: 1,
      scoreFocus: "boss_break",
      previewTags: ["boss_break", "fortress_core", "sweep_alert"],
      threatLevel: "critical",
      visualTheme: "finalboss",
      climax: "boss",
      objective: "break-window",
    },
  ],
  2: [
    {
      id: "tier2-01",
      stageNumber: 1,
      label: "Threat Tier 2 - 1",
      act: 4,
      threatTier: 2,
      scoreFocus: "survival_chain",
      previewTags: ["hazard_flux", "turret_lane"],
      threatLevel: "critical",
      visualTheme: "tier2",
      climax: "none",
      objective: "score-window",
    },
    {
      id: "tier2-02",
      stageNumber: 2,
      label: "Threat Tier 2 - 2",
      act: 4,
      threatTier: 2,
      scoreFocus: "reactor_chain",
      previewTags: ["reactor_chain", "fortress_core"],
      threatLevel: "critical",
      visualTheme: "tier2",
      climax: "none",
      objective: "route-control",
    },
    {
      id: "tier2-03",
      stageNumber: 3,
      label: "Threat Tier 2 - 3",
      act: 4,
      threatTier: 2,
      scoreFocus: "turret_cancel",
      previewTags: ["turret_lane", "sweep_alert"],
      threatLevel: "critical",
      visualTheme: "tier2",
      climax: "none",
      objective: "stop-first-threat",
    },
    {
      id: "tier2-04",
      stageNumber: 4,
      label: "Threat Tier 2 - 4",
      act: 4,
      threatTier: 2,
      scoreFocus: "boss_break",
      previewTags: ["boss_break", "fortress_core", "sweep_alert"],
      threatLevel: "critical",
      visualTheme: "tier2",
      climax: "tier2_boss",
      objective: "break-window",
    },
  ],
};

export function getPublicEncounterCatalog(
  threatTier: PublicThreatTier,
): readonly PublicEncounterDefinition[] {
  return PUBLIC_ENCOUNTERS[threatTier];
}

export function validatePublicEncounterCatalog(
  encounters: readonly PublicEncounterDefinition[],
): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();

  encounters.forEach((encounter, index) => {
    if (ids.has(encounter.id)) {
      issues.push(`duplicate encounter id: ${encounter.id}`);
    }
    ids.add(encounter.id);
    if (encounter.stageNumber !== index + 1) {
      issues.push(`stage number mismatch: ${encounter.id}`);
    }
    if (encounter.previewTags.length === 0) {
      issues.push(`missing preview tags: ${encounter.id}`);
    }
  });

  return issues;
}
