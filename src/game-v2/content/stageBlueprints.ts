import type {
  BrickKind,
  EnemyShotProfile,
  MusicCue,
  PublicThreatTier,
  StageModifierKey,
} from "../public/types";
import { getPublicEncounterCatalog } from "./encounters";

export interface StageModifierDefinition {
  key?: StageModifierKey;
  warpZones?: readonly StageWarpZoneDefinition[];
}

export interface StageWarpZoneDefinition {
  inXMin: number;
  inXMax: number;
  inYMin: number;
  inYMax: number;
  outX: number;
  outY: number;
}

export type SpecialBrickColumnRule =
  | "first"
  | "center"
  | "inner-boss-core"
  | "inner-pair"
  | "every-third";

export interface SpecialBrickRule {
  kind: BrickKind;
  rows?: readonly number[];
  columns: SpecialBrickColumnRule;
  hp?: number;
  maxHp?: number;
}

export interface BossBlueprint {
  hp: number;
  maxHp: number;
  shotProfile: EnemyShotProfile;
}

export interface StageBlueprint {
  threatTier: PublicThreatTier;
  stageNumber: number;
  layout: {
    rows: number;
    cols: number;
    marginX: number;
    topY: number;
    gap: number;
    brickHeight: number;
  };
  modifier: StageModifierDefinition;
  specialBricks: readonly SpecialBrickRule[];
  musicCue: MusicCue;
  boss?: BossBlueprint;
}

const DEFAULT_LAYOUT = {
  rows: 5,
  cols: 10,
  marginX: 88,
  topY: 92,
  gap: 8,
  brickHeight: 28,
} as const;

const BOSS_LAYOUT = {
  ...DEFAULT_LAYOUT,
  rows: 3,
  cols: 7,
} as const;

const WARP_ZONE_MODIFIER: StageModifierDefinition = {
  key: "warp_zone",
  warpZones: [
    {
      inXMin: 100,
      inXMax: 170,
      inYMin: 130,
      inYMax: 260,
      outX: 790,
      outY: 160,
    },
    {
      inXMin: 760,
      inXMax: 840,
      inYMin: 130,
      inYMax: 260,
      outX: 160,
      outY: 160,
    },
  ],
};

const EMPTY_MODIFIER: StageModifierDefinition = {};

const BOSS_BRICK_RULE: SpecialBrickRule = {
  kind: "boss",
  rows: [0],
  columns: "inner-boss-core",
  hp: 10,
  maxHp: 10,
};

const TIER2_BOSS_BRICK_RULE: SpecialBrickRule = {
  kind: "boss",
  rows: [0, 1],
  columns: "inner-boss-core",
  hp: 10,
  maxHp: 10,
};

function defineStage(
  threatTier: PublicThreatTier,
  stageNumber: number,
  partial: Partial<Omit<StageBlueprint, "threatTier" | "stageNumber">> = {},
): StageBlueprint {
  return {
    threatTier,
    stageNumber,
    layout: partial.layout ?? DEFAULT_LAYOUT,
    modifier: partial.modifier ?? EMPTY_MODIFIER,
    specialBricks: partial.specialBricks ?? [],
    musicCue: partial.musicCue ?? { id: "chapter1", variant: 1 },
    boss: partial.boss,
  };
}

const TIER1_STAGE_BLUEPRINTS: readonly StageBlueprint[] = [
  defineStage(1, 1, { musicCue: { id: "chapter1", variant: 1 } }),
  defineStage(1, 2, { musicCue: { id: "chapter1", variant: 2 } }),
  defineStage(1, 3, { musicCue: { id: "chapter1", variant: 3 } }),
  defineStage(1, 4, {
    musicCue: { id: "midboss", variant: 1 },
    boss: { hp: 10, maxHp: 10, shotProfile: "plasma_bolt" },
  }),
  defineStage(1, 5, { musicCue: { id: "chapter2", variant: 1 } }),
  defineStage(1, 6, {
    modifier: WARP_ZONE_MODIFIER,
    specialBricks: [{ kind: "gate", columns: "first" }],
    musicCue: { id: "chapter2", variant: 2 },
  }),
  defineStage(1, 7, {
    specialBricks: [{ kind: "turret", rows: [1], columns: "inner-pair" }],
    musicCue: { id: "chapter2", variant: 3 },
  }),
  defineStage(1, 8, {
    modifier: { key: "speed_ball" },
    musicCue: { id: "midboss", variant: 2 },
    boss: { hp: 10, maxHp: 10, shotProfile: "plasma_bolt" },
  }),
  defineStage(1, 9, {
    modifier: { key: "enemy_flux" },
    musicCue: { id: "chapter3", variant: 1 },
  }),
  defineStage(1, 10, {
    modifier: { key: "enemy_flux" },
    specialBricks: [{ kind: "steel", rows: [0], columns: "every-third", hp: 999, maxHp: 999 }],
    musicCue: { id: "chapter3", variant: 2 },
  }),
  defineStage(1, 11, {
    modifier: { key: "flux" },
    specialBricks: [{ kind: "generator", rows: [2], columns: "center" }],
    musicCue: { id: "chapter3", variant: 3 },
  }),
  defineStage(1, 12, {
    layout: BOSS_LAYOUT,
    specialBricks: [BOSS_BRICK_RULE],
    musicCue: { id: "finalboss", variant: 1 },
    boss: { hp: 10, maxHp: 10, shotProfile: "plasma_bolt" },
  }),
] as const;

const TIER2_STAGE_BLUEPRINTS: readonly StageBlueprint[] = [
  defineStage(2, 1, { musicCue: { id: "tier2", variant: 1 } }),
  defineStage(2, 2, { musicCue: { id: "tier2", variant: 2 } }),
  defineStage(2, 3, { musicCue: { id: "tier2", variant: 3 } }),
  defineStage(2, 4, {
    layout: BOSS_LAYOUT,
    specialBricks: [TIER2_BOSS_BRICK_RULE],
    musicCue: { id: "tier2", variant: 4 },
    boss: { hp: 16, maxHp: 16, shotProfile: "void_core" },
  }),
] as const;

export const PUBLIC_STAGE_BLUEPRINTS: Record<PublicThreatTier, readonly StageBlueprint[]> = {
  1: TIER1_STAGE_BLUEPRINTS,
  2: TIER2_STAGE_BLUEPRINTS,
};

export function getStageBlueprint(
  threatTier: PublicThreatTier,
  stageNumber: number,
): StageBlueprint {
  const blueprints = PUBLIC_STAGE_BLUEPRINTS[threatTier];
  return blueprints.find((blueprint) => blueprint.stageNumber === stageNumber) ?? blueprints[0];
}

export function getStageModifierDefinition(
  threatTier: PublicThreatTier,
  stageNumber: number,
): StageModifierDefinition {
  return getStageBlueprint(threatTier, stageNumber).modifier;
}

export function getStageMusicCue(threatTier: PublicThreatTier, stageNumber: number): MusicCue {
  return getStageBlueprint(threatTier, stageNumber).musicCue;
}

export function validateStageBlueprints(): string[] {
  const issues: string[] = [];

  for (const threatTier of [1, 2] as const) {
    const seen = new Set<number>();
    const encounterCount = getPublicEncounterCatalog(threatTier).length;
    if (PUBLIC_STAGE_BLUEPRINTS[threatTier].length !== encounterCount) {
      issues.push(`stage blueprint count mismatch: tier-${threatTier}`);
    }
    PUBLIC_STAGE_BLUEPRINTS[threatTier].forEach((blueprint, index) => {
      if (seen.has(blueprint.stageNumber)) {
        issues.push(`duplicate stage blueprint: tier-${threatTier}/${blueprint.stageNumber}`);
      }
      seen.add(blueprint.stageNumber);
      if (blueprint.stageNumber !== index + 1) {
        issues.push(`stage blueprint number mismatch: tier-${threatTier}/${blueprint.stageNumber}`);
      }
      if (blueprint.layout.rows <= 0 || blueprint.layout.cols <= 0) {
        issues.push(`invalid stage layout: tier-${threatTier}/${blueprint.stageNumber}`);
      }
      if (blueprint.musicCue.variant < 1) {
        issues.push(`invalid music cue variant: tier-${threatTier}/${blueprint.stageNumber}`);
      }
    });
  }

  return issues;
}

export function matchesSpecialBrickRule(
  rule: SpecialBrickRule,
  row: number,
  col: number,
  cols: number,
): boolean {
  if (rule.rows && !rule.rows.includes(row)) {
    return false;
  }

  switch (rule.columns) {
    case "first":
      return col === 0;
    case "center":
      return col === Math.floor(cols / 2);
    case "inner-boss-core":
      return col >= 2 && col <= 4;
    case "inner-pair":
      return col === 1 || col === cols - 2;
    case "every-third":
      return col % 3 === 0;
  }
}
