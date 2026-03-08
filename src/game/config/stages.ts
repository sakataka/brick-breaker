import { validateStageCatalog } from "../configSchema";
import type {
  StageArchetype,
  StageDefinition,
  StageEventKey,
  StageRoute,
  StageSpecialPlacement,
  StageTag,
} from "../types";
import { RATING_CONFIG } from "./gameplay";

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

export interface WarpZone {
  inXMin: number;
  inXMax: number;
  inYMin: number;
  inYMax: number;
  outX: number;
  outY: number;
}

export interface StageModifier {
  key?: StageModifierKey;
  maxSpeedScale?: number;
  warpZones?: WarpZone[];
  spawnEnemy?: boolean;
  fluxField?: boolean;
}

export type StageModifierKey = "warp_zone" | "speed_ball" | "enemy_flux" | "flux";

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

interface StageBlueprint {
  rows: readonly string[];
  course?: StageDefinition["course"];
  chapter: 1 | 2 | 3 | 4;
  archetype: StageArchetype;
  tags?: StageTag[];
  events?: StageEventKey[];
  specials?: StageSpecialPlacement[];
  elite?: StageDefinition["elite"];
  missions?: StageDefinition["missions"];
  encounter?: StageDefinition["encounter"];
}

const STAGE_BLUEPRINTS: readonly StageBlueprint[] = [
  {
    rows: ["0011111100", "0011111100", "0001111000", "0000110000", "0000000000", "0000000000"],
    chapter: 1,
    archetype: "wide_open",
  },
  {
    rows: ["0011111100", "0010011000", "0011111100", "0001100000", "0001111000", "0000000000"],
    chapter: 1,
    archetype: "corridor",
  },
  {
    rows: ["0111111110", "0001100000", "0011111000", "0001100000", "0011111000", "0000000000"],
    chapter: 1,
    archetype: "corridor",
  },
  {
    rows: ["0111111110", "0100110010", "0111111110", "0001111000", "0000100000", "0000000000"],
    chapter: 2,
    archetype: "chokepoint",
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
    rows: ["1111111111", "1011111101", "0110011000", "0111111110", "0011111100", "0000000000"],
    chapter: 2,
    archetype: "chokepoint",
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
    rows: ["1111111111", "1001111001", "1110011111", "0001111000", "0011111100", "0000000000"],
    chapter: 2,
    archetype: "split_lane",
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
    rows: ["1111111111", "1011111101", "1110011111", "0011111000", "0001110000", "0000000000"],
    chapter: 3,
    archetype: "control",
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
    rows: ["1111111111", "1100000011", "1111111111", "0011111000", "0001100000", "0000000000"],
    chapter: 3,
    archetype: "control",
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
    rows: ["1111111111", "1110111111", "0111111110", "0011111100", "0010011000", "0001110000"],
    chapter: 3,
    archetype: "control",
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
    rows: ["1110011111", "1110011111", "0011111100", "1110011111", "1110011111", "0001110000"],
    chapter: 4,
    archetype: "split_lane",
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
    rows: ["1111111111", "1001111001", "1111111111", "0011111100", "1110011111", "0001110000"],
    chapter: 4,
    archetype: "split_lane",
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
    rows: ["0000000000", "0010000100", "0000100000", "0000000000", "0000000000", "0000000000"],
    chapter: 4,
    archetype: "boss_arena",
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
] as const;

const EX_STAGE_BLUEPRINTS: readonly StageBlueprint[] = [
  {
    rows: ["0111111110", "0100010010", "0111111110", "0010101000", "0001110000", "0000000000"],
    course: "ex",
    chapter: 4,
    archetype: "ex_arena",
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
    rows: ["1111111111", "1000000001", "1111011111", "0011111100", "0001100000", "0000000000"],
    course: "ex",
    chapter: 4,
    archetype: "control",
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
    rows: ["1110011111", "0011111100", "1110011111", "0011111100", "0001110000", "0000000000"],
    course: "ex",
    chapter: 4,
    archetype: "split_lane",
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
    rows: ["0000000000", "0010000100", "0000100000", "0010000100", "0000000000", "0000000000"],
    course: "ex",
    chapter: 4,
    archetype: "ex_arena",
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
    encounter: { kind: "ex_boss", profile: "ex_overlord" },
  },
] as const;

function parseStageLayout(rows: readonly string[]): number[][] {
  return rows.map((row) => row.split("").map((cell) => (cell === "1" ? 1 : 0)));
}

function computeStageSpeedScale(index: number, total: number): number {
  if (total <= 1) {
    return 1;
  }
  const min = 1;
  const max = 1.18;
  const ratio = index / (total - 1);
  return min + (max - min) * ratio;
}

function buildCatalog(blueprints: readonly StageBlueprint[]): StageDefinition[] {
  return blueprints.map((blueprint, index, all) => ({
    id: index + 1,
    speedScale: Number(computeStageSpeedScale(index, all.length).toFixed(3)),
    layout: parseStageLayout(blueprint.rows),
    course: blueprint.course ?? "normal",
    chapter: blueprint.chapter,
    archetype: blueprint.archetype,
    tags: blueprint.tags,
    events: blueprint.events,
    specials: blueprint.specials,
    elite: blueprint.elite,
    missions: blueprint.missions ?? inferStageMissions(index + 1, blueprint),
    encounter: blueprint.encounter,
  }));
}

export const STAGE_CATALOG: StageDefinition[] = buildCatalog(STAGE_BLUEPRINTS);
export const EX_STAGE_CATALOG: StageDefinition[] = buildCatalog(EX_STAGE_BLUEPRINTS);

const routeBCache = new Map<number, StageDefinition>();

const STAGE_MODIFIERS: Partial<Record<number, StageModifier>> = {
  6: {
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
  },
  8: {
    key: "speed_ball",
    maxSpeedScale: 1.12,
  },
  9: {
    key: "enemy_flux",
    spawnEnemy: true,
    fluxField: true,
  },
  10: {
    key: "enemy_flux",
    spawnEnemy: true,
    fluxField: true,
  },
  11: {
    key: "flux",
    fluxField: true,
  },
};

export function getStageByIndex(stageIndex: number): StageDefinition {
  const safeIndex = Math.max(0, Math.min(STAGE_CATALOG.length - 1, stageIndex));
  return STAGE_CATALOG[safeIndex];
}

export function getExStageByIndex(stageIndex: number): StageDefinition {
  const safeIndex = Math.max(0, Math.min(EX_STAGE_CATALOG.length - 1, stageIndex));
  return EX_STAGE_CATALOG[safeIndex];
}

export function getStageForCampaign(stageIndex: number, route: StageRoute | null): StageDefinition {
  const base = getStageByIndex(stageIndex);
  if (route !== "B") {
    return base;
  }
  if (stageIndex < 4 || stageIndex > 7) {
    return base;
  }
  const cached = routeBCache.get(base.id);
  if (cached) {
    return cached;
  }
  const mirrored = createMirroredStage(base);
  routeBCache.set(base.id, mirrored);
  return mirrored;
}

export function getStageModifier(stageNumber: number): StageModifier | undefined {
  return STAGE_MODIFIERS[stageNumber];
}

export function getStageStory(stageNumber: number): number | null {
  if (stageNumber === 4 || stageNumber === 8 || stageNumber === 12) {
    return stageNumber;
  }
  return null;
}

export function getStageTimeTargetSec(stageIndex: number): number {
  return RATING_CONFIG.baseTargetSec + stageIndex * RATING_CONFIG.targetSecPerStage;
}

function createMirroredStage(stage: StageDefinition): StageDefinition {
  const maxCol = BRICK_LAYOUT.cols - 1;
  return {
    ...stage,
    layout: stage.layout.map((row) => [...row].reverse()),
    specials: stage.specials?.map((entry) => ({
      row: entry.row,
      col: maxCol - entry.col,
      kind: entry.kind,
    })),
    elite: stage.elite?.map((entry) => ({
      row: entry.row,
      col: maxCol - entry.col,
      kind: entry.kind,
    })),
  };
}

function inferStageMissions(stageNumber: number, blueprint: StageBlueprint): StageDefinition["missions"] {
  if (blueprint.tags?.includes("generator")) {
    return ["shutdown_generator", "no_shop"];
  }
  if (blueprint.tags?.includes("turret")) {
    return ["destroy_turret_first", "combo_x2"];
  }
  if (blueprint.encounter) {
    return ["time_limit", "combo_x2"];
  }
  return stageNumber >= 9 ? ["time_limit", "combo_x2"] : ["time_limit", "no_shop"];
}

validateStageCatalog(STAGE_CATALOG);
validateStageCatalog(EX_STAGE_CATALOG);
