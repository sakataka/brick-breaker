import {
  CAMPAIGN_ENCOUNTERS,
  THREAT_TIER_2_ENCOUNTERS,
  type EncounterDefinition,
} from "./encounters";

export type ThreatTier = 1 | 2;

export interface RunDefinition {
  id: "campaign";
  threatTier: ThreatTier;
  title: string;
  acts: readonly {
    id: `act-${number}`;
    label: string;
    encounterIds: readonly string[];
  }[];
  encounters: readonly EncounterDefinition[];
  finalSequenceIds: readonly string[];
}

const RUN_DEFINITIONS: Record<ThreatTier, RunDefinition> = {
  1: {
    id: "campaign",
    threatTier: 1,
    title: "Campaign",
    acts: [
      {
        id: "act-1",
        label: "Learning",
        encounterIds: CAMPAIGN_ENCOUNTERS.slice(0, 4).map((entry) => entry.id),
      },
      {
        id: "act-2",
        label: "Priority",
        encounterIds: CAMPAIGN_ENCOUNTERS.slice(4, 8).map((entry) => entry.id),
      },
      {
        id: "act-3",
        label: "Pressure",
        encounterIds: CAMPAIGN_ENCOUNTERS.slice(8, 12).map((entry) => entry.id),
      },
    ],
    encounters: CAMPAIGN_ENCOUNTERS,
    finalSequenceIds: CAMPAIGN_ENCOUNTERS.slice(8, 12).map((entry) => entry.id),
  },
  2: {
    id: "campaign",
    threatTier: 2,
    title: "Threat Tier 2",
    acts: [
      {
        id: "act-4",
        label: "Final Sequence",
        encounterIds: THREAT_TIER_2_ENCOUNTERS.map((entry) => entry.id),
      },
    ],
    encounters: THREAT_TIER_2_ENCOUNTERS,
    finalSequenceIds: THREAT_TIER_2_ENCOUNTERS.map((entry) => entry.id),
  },
};

export function getRunDefinition(threatTier: ThreatTier): RunDefinition {
  return RUN_DEFINITIONS[threatTier];
}

export function getEncounterDefinition(
  threatTier: ThreatTier,
  encounterIndex: number,
): EncounterDefinition {
  const run = getRunDefinition(threatTier);
  const safeIndex = Math.max(0, Math.min(run.encounters.length - 1, encounterIndex));
  return run.encounters[safeIndex];
}

export function validateRunDefinition(run: RunDefinition): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const encounterIds = new Set(run.encounters.map((entry) => entry.id));
  for (const act of run.acts) {
    for (const encounterId of act.encounterIds) {
      if (!encounterIds.has(encounterId)) {
        issues.push(`unknown encounter in ${act.id}: ${encounterId}`);
      }
    }
  }
  for (const encounterId of run.finalSequenceIds) {
    if (!encounterIds.has(encounterId)) {
      issues.push(`unknown final sequence encounter: ${encounterId}`);
    }
  }
  return {
    valid: issues.length === 0,
    issues,
  };
}
