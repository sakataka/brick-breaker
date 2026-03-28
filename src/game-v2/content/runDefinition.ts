import { getPublicEncounterCatalog, type PublicEncounterDefinition } from "./encounters";
import type { PublicThreatTier } from "../public/types";

export interface PublicRunAct {
  id: `act-${number}`;
  label: string;
  encounterIds: readonly string[];
}

export interface PublicShopContract {
  offersPerEncounter: 1;
  optionsPerOffer: 2;
}

export interface PublicRunDefinition {
  id: "campaign";
  threatTier: PublicThreatTier;
  title: string;
  encounterCount: number;
  acts: readonly PublicRunAct[];
  encounters: readonly PublicEncounterDefinition[];
  finalSequenceIds: readonly string[];
  shop: PublicShopContract;
  unlocksNextTierOnClear: boolean;
}

const SHOP_CONTRACT: PublicShopContract = {
  offersPerEncounter: 1,
  optionsPerOffer: 2,
};

const RUN_TITLES: Record<PublicThreatTier, string> = {
  1: "Campaign",
  2: "Threat Tier 2",
};

const RUN_ACTS: Record<PublicThreatTier, readonly PublicRunAct[]> = {
  1: [
    {
      id: "act-1",
      label: "Learning",
      encounterIds: ["encounter-01", "encounter-02", "encounter-03", "encounter-04"],
    },
    {
      id: "act-2",
      label: "Priority",
      encounterIds: ["encounter-05", "encounter-06", "encounter-07", "encounter-08"],
    },
    {
      id: "act-3",
      label: "Pressure",
      encounterIds: ["encounter-09", "encounter-10", "encounter-11", "encounter-12"],
    },
  ],
  2: [
    {
      id: "act-4",
      label: "Final Sequence",
      encounterIds: ["tier2-01", "tier2-02", "tier2-03", "tier2-04"],
    },
  ],
};

export function getPublicRunDefinition(threatTier: PublicThreatTier): PublicRunDefinition {
  const encounters = getPublicEncounterCatalog(threatTier);
  const acts = RUN_ACTS[threatTier];

  return {
    id: "campaign",
    threatTier,
    title: RUN_TITLES[threatTier],
    encounterCount: encounters.length,
    acts,
    encounters,
    finalSequenceIds: [...acts[acts.length - 1].encounterIds],
    shop: SHOP_CONTRACT,
    unlocksNextTierOnClear: threatTier === 1,
  };
}

export const PUBLIC_RUN_DEFINITIONS = [
  getPublicRunDefinition(1),
  getPublicRunDefinition(2),
] as const;

export function validatePublicRunDefinition(run: PublicRunDefinition): string[] {
  const issues: string[] = [];
  const encounterIds = new Set(run.encounters.map((encounter) => encounter.id));

  run.acts.forEach((act) => {
    act.encounterIds.forEach((encounterId) => {
      if (!encounterIds.has(encounterId)) {
        issues.push(`unknown encounter in ${act.id}: ${encounterId}`);
      }
    });
  });

  run.finalSequenceIds.forEach((encounterId) => {
    if (!encounterIds.has(encounterId)) {
      issues.push(`unknown final sequence encounter: ${encounterId}`);
    }
  });

  if (run.shop.offersPerEncounter !== 1 || run.shop.optionsPerOffer !== 2) {
    issues.push(`invalid shop contract: ${run.id}/tier-${run.threatTier}`);
  }

  return issues;
}
