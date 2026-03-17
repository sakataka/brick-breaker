import type {
  EnemyShotProfile,
  ScoreFocus,
  StageArchetype,
  StageBoardMechanic,
  StageBonusRule,
  StageDefinition,
  StageEventKey,
  StageHazardScript,
  StagePreviewTag,
  StageSpecialPlacement,
  StageTag,
  StageVisualProfileDefinition,
} from "../types";

export interface StageBlueprint {
  id: string;
  rows: readonly string[];
  tags?: StageTag[];
  events?: StageEventKey[];
  specials?: StageSpecialPlacement[];
  elite?: StageDefinition["elite"];
  missions?: StageDefinition["missions"];
  visualProfile?: StageVisualProfileDefinition;
  boardMechanics?: readonly StageBoardMechanic[];
  hazardScript?: StageHazardScript;
  encounterTimeline?: StageDefinition["encounterTimeline"];
  previewTags?: readonly StagePreviewTag[];
  scoreFocus?: ScoreFocus;
  bonusRules?: readonly StageBonusRule[];
  enemyShotProfile?: EnemyShotProfile;
  visualSetId?: string;
  encounter?: StageDefinition["encounter"];
}

export interface StageBlueprintCatalogEntry {
  encounterId: string;
  blueprintId: StageBlueprint["id"];
  chapter: 1 | 2 | 3 | 4;
  archetype: StageArchetype;
}

const STAGE_BLUEPRINTS: readonly StageBlueprint[] = [
  {
    id: "campaign-1",
    rows: ["0011111100", "0011111100", "0001111000", "0000110000", "0000000000", "0000000000"],
  },
  {
    id: "campaign-2",
    rows: ["0011111100", "0010011000", "0011111100", "0001100000", "0001111000", "0000000000"],
  },
  {
    id: "campaign-3",
    rows: ["0111111110", "0001100000", "0011111000", "0001100000", "0011111000", "0000000000"],
  },
  {
    id: "campaign-4",
    rows: ["0111111110", "0100110010", "0111111110", "0001111000", "0000100000", "0000000000"],
    tags: ["steel", "gate", "midboss"],
    events: ["gate_cycle", "midboss_duel"],
    specials: [
      { row: 1, col: 3, kind: "steel" },
      { row: 1, col: 6, kind: "steel" },
      { row: 3, col: 3, kind: "gate" },
      { row: 3, col: 6, kind: "gate" },
      { row: 2, col: 4, kind: "steel" },
      { row: 2, col: 5, kind: "steel" },
    ],
    elite: [{ row: 3, col: 4, kind: "boss" }],
    missions: ["time_limit", "no_miss_stage"],
    encounter: { kind: "midboss", profile: "warden" },
  },
  {
    id: "campaign-5",
    rows: ["1111111111", "1011111101", "0110011000", "0111111110", "0011111100", "0000000000"],
    tags: ["steel", "gate"],
    events: ["gate_cycle"],
    specials: [
      { row: 1, col: 1, kind: "steel" },
      { row: 1, col: 8, kind: "steel" },
      { row: 2, col: 4, kind: "steel" },
      { row: 2, col: 5, kind: "steel" },
      { row: 4, col: 4, kind: "gate" },
    ],
    missions: ["time_limit", "no_shop"],
  },
  {
    id: "campaign-6",
    rows: ["1111111111", "1001111001", "1110011111", "0001111000", "0011111100", "0000000000"],
    tags: ["steel", "gate"],
    events: ["gate_cycle"],
    specials: [
      { row: 1, col: 4, kind: "steel" },
      { row: 1, col: 5, kind: "steel" },
      { row: 2, col: 3, kind: "steel" },
      { row: 2, col: 6, kind: "steel" },
      { row: 4, col: 3, kind: "gate" },
      { row: 4, col: 6, kind: "gate" },
    ],
    missions: ["time_limit", "combo_x2"],
  },
  {
    id: "campaign-7",
    rows: ["1111111111", "1011111101", "1110011111", "0011111000", "0001110000", "0000000000"],
    tags: ["generator", "turret"],
    events: ["generator_respawn", "turret_fire"],
    specials: [
      { row: 1, col: 2, kind: "generator" },
      { row: 1, col: 7, kind: "generator" },
      { row: 3, col: 4, kind: "turret" },
    ],
    missions: ["shutdown_generator", "no_shop"],
  },
  {
    id: "campaign-8",
    rows: ["1111111111", "1100000011", "1111111111", "0011111000", "0001100000", "0000000000"],
    tags: ["steel", "generator", "turret"],
    events: ["generator_respawn", "turret_fire"],
    specials: [
      { row: 1, col: 4, kind: "steel" },
      { row: 1, col: 5, kind: "steel" },
      { row: 2, col: 3, kind: "generator" },
      { row: 2, col: 6, kind: "generator" },
      { row: 4, col: 4, kind: "turret" },
    ],
    missions: ["shutdown_generator", "destroy_turret_first"],
  },
  {
    id: "campaign-9",
    rows: ["1111111111", "1110111111", "0111111110", "0011111100", "0010011000", "0001110000"],
    tags: ["generator", "enemy_pressure", "turret", "midboss"],
    events: ["generator_respawn", "enemy_pressure", "turret_fire", "midboss_duel"],
    specials: [
      { row: 0, col: 4, kind: "generator" },
      { row: 1, col: 2, kind: "generator" },
      { row: 5, col: 4, kind: "turret" },
    ],
    elite: [
      { row: 0, col: 7, kind: "durable" },
      { row: 1, col: 6, kind: "armored" },
      { row: 2, col: 4, kind: "regen" },
      { row: 3, col: 5, kind: "hazard" },
      { row: 4, col: 2, kind: "split" },
      { row: 5, col: 5, kind: "boss" },
    ],
    missions: ["destroy_turret_first", "combo_x2"],
    encounter: { kind: "midboss", profile: "artillery" },
  },
  {
    id: "campaign-10",
    rows: ["1110011111", "1110011111", "0011111100", "1110011111", "1110011111", "0001110000"],
    tags: ["steel", "enemy_pressure", "turret"],
    events: ["enemy_pressure", "turret_fire"],
    specials: [
      { row: 0, col: 2, kind: "steel" },
      { row: 0, col: 7, kind: "steel" },
      { row: 3, col: 2, kind: "steel" },
      { row: 3, col: 7, kind: "steel" },
      { row: 5, col: 4, kind: "turret" },
    ],
    elite: [
      { row: 1, col: 1, kind: "durable" },
      { row: 1, col: 8, kind: "armored" },
      { row: 2, col: 4, kind: "hazard" },
      { row: 4, col: 1, kind: "regen" },
      { row: 4, col: 8, kind: "summon" },
    ],
    missions: ["destroy_turret_first", "combo_x2"],
  },
  {
    id: "campaign-11",
    rows: ["1111111111", "1001111001", "1111111111", "0011111100", "1110011111", "0001110000"],
    tags: ["steel", "generator", "enemy_pressure", "turret"],
    events: ["generator_respawn", "enemy_pressure", "turret_fire"],
    specials: [
      { row: 1, col: 1, kind: "steel" },
      { row: 1, col: 8, kind: "steel" },
      { row: 2, col: 4, kind: "generator" },
      { row: 4, col: 4, kind: "steel" },
      { row: 5, col: 2, kind: "turret" },
      { row: 5, col: 7, kind: "turret" },
    ],
    elite: [
      { row: 0, col: 2, kind: "armored" },
      { row: 0, col: 7, kind: "durable" },
      { row: 2, col: 6, kind: "thorns" },
      { row: 3, col: 3, kind: "hazard" },
      { row: 4, col: 7, kind: "regen" },
    ],
    missions: ["shutdown_generator", "no_shop"],
  },
  {
    id: "campaign-12",
    rows: ["0000000000", "0010000100", "0000100000", "0000000000", "0000000000", "0000000000"],
    tags: ["steel", "boss"],
    events: ["boss_duel"],
    specials: [
      { row: 1, col: 2, kind: "steel" },
      { row: 1, col: 7, kind: "steel" },
      { row: 2, col: 1, kind: "steel" },
      { row: 2, col: 8, kind: "steel" },
      { row: 3, col: 2, kind: "steel" },
      { row: 3, col: 7, kind: "steel" },
    ],
    elite: [{ row: 2, col: 4, kind: "boss" }],
    missions: ["time_limit", "no_miss_stage"],
    encounter: { kind: "boss", profile: "final_core" },
  },
  {
    id: "tier2-1",
    rows: ["0111111110", "0100010010", "0111111110", "0010101000", "0001110000", "0000000000"],
    tags: ["steel", "gate", "midboss"],
    events: ["gate_cycle", "midboss_duel"],
    specials: [
      { row: 1, col: 2, kind: "steel" },
      { row: 1, col: 7, kind: "steel" },
      { row: 3, col: 3, kind: "gate" },
      { row: 3, col: 6, kind: "gate" },
    ],
    elite: [{ row: 4, col: 4, kind: "boss" }],
    missions: ["no_miss_stage", "combo_x2"],
    encounter: { kind: "midboss", profile: "warden" },
  },
  {
    id: "tier2-2",
    rows: ["1111111111", "1000000001", "1111011111", "0011111100", "0001100000", "0000000000"],
    tags: ["generator", "turret", "enemy_pressure"],
    events: ["generator_respawn", "turret_fire", "enemy_pressure"],
    specials: [
      { row: 1, col: 4, kind: "turret" },
      { row: 1, col: 5, kind: "turret" },
      { row: 2, col: 4, kind: "generator" },
    ],
    missions: ["shutdown_generator", "destroy_turret_first"],
  },
  {
    id: "tier2-3",
    rows: ["1110011111", "0011111100", "1110011111", "0011111100", "0001110000", "0000000000"],
    tags: ["steel", "turret", "midboss"],
    events: ["turret_fire", "midboss_duel"],
    specials: [
      { row: 0, col: 2, kind: "steel" },
      { row: 0, col: 7, kind: "steel" },
      { row: 3, col: 2, kind: "turret" },
      { row: 3, col: 7, kind: "turret" },
    ],
    elite: [{ row: 4, col: 4, kind: "boss" }],
    missions: ["destroy_turret_first", "combo_x2"],
    encounter: { kind: "midboss", profile: "artillery" },
  },
  {
    id: "tier2-4",
    rows: ["0000000000", "0010000100", "0000100000", "0010000100", "0000000000", "0000000000"],
    tags: ["steel", "boss", "turret"],
    events: ["boss_duel", "turret_fire"],
    specials: [
      { row: 1, col: 2, kind: "steel" },
      { row: 1, col: 7, kind: "steel" },
      { row: 3, col: 2, kind: "turret" },
      { row: 3, col: 7, kind: "turret" },
    ],
    elite: [{ row: 2, col: 4, kind: "boss" }],
    missions: ["time_limit", "combo_x2"],
    encounter: { kind: "tier2_boss", profile: "tier2_overlord" },
  },
] as const;

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

export function getStageBlueprint(blueprintId: string): StageBlueprint {
  const blueprint = STAGE_BLUEPRINTS.find((entry) => entry.id === blueprintId);
  if (!blueprint) {
    throw new Error(`Unknown stage blueprint: ${blueprintId}`);
  }
  return blueprint;
}
