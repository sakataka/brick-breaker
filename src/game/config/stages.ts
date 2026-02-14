import { validateStageCatalog } from "../configSchema";
import type { StageDefinition, StageRoute } from "../types";
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
  label?: string;
  maxSpeedScale?: number;
  warpZones?: WarpZone[];
  spawnEnemy?: boolean;
  fluxField?: boolean;
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

const STAGE_ROW_DEFINITIONS: readonly (readonly string[])[] = [
  ["0011111100", "0011111100", "0001111000", "0000110000", "0000000000", "0000000000"],
  ["0111111110", "0011111100", "0010110100", "0001111000", "0000100000", "0000000000"],
  ["0111111110", "0110110110", "0011111100", "0010011000", "0001111000", "0000000000"],
  ["0111111110", "0101111010", "0110110110", "0011111100", "0001111000", "0000100000"],
  ["1111111111", "1011111101", "0111111110", "0011111100", "0010110100", "0001111000"],
  ["1111111111", "1101111011", "0111111110", "0110110110", "0011111100", "0010011000"],
  ["1111111111", "1011111101", "1110110111", "0111111110", "0101111010", "0011111100"],
  ["1111111111", "1110110111", "1101111011", "0111111110", "0110110110", "0011111100"],
  ["1111111111", "1111111111", "1011111101", "1110110111", "0111111110", "0101111010"],
  ["1111111111", "1111111111", "1101111011", "1110110111", "0111111110", "0110110110"],
  ["1111111111", "1111111111", "1111111111", "1011111101", "1110110111", "0111111110"],
  ["0000000000", "0000000000", "0000100000", "0000000000", "0000000000", "0000000000"],
];

const ELITE_STAGE_MAP: Partial<Record<number, NonNullable<StageDefinition["elite"]>>> = {
  9: [
    { row: 0, col: 4, kind: "durable" },
    { row: 1, col: 5, kind: "durable" },
    { row: 2, col: 2, kind: "armored" },
    { row: 3, col: 4, kind: "regen" },
    { row: 4, col: 3, kind: "hazard" },
  ],
  10: [
    { row: 0, col: 3, kind: "durable" },
    { row: 1, col: 6, kind: "armored" },
    { row: 2, col: 4, kind: "durable" },
    { row: 4, col: 4, kind: "regen" },
    { row: 3, col: 4, kind: "hazard" },
  ],
  11: [
    { row: 0, col: 2, kind: "armored" },
    { row: 1, col: 7, kind: "durable" },
    { row: 3, col: 5, kind: "armored" },
    { row: 4, col: 4, kind: "regen" },
    { row: 2, col: 4, kind: "hazard" },
  ],
  12: [{ row: 2, col: 4, kind: "boss" }],
};

function parseStageLayout(rows: readonly string[]): number[][] {
  return rows.map((row) =>
    row.split("").map((cell) => {
      if (cell === "1") {
        return 1;
      }
      return 0;
    }),
  );
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

export const STAGE_CATALOG: StageDefinition[] = STAGE_ROW_DEFINITIONS.map((rows, index, all) => ({
  id: index + 1,
  speedScale: Number(computeStageSpeedScale(index, all.length).toFixed(3)),
  layout: parseStageLayout(rows),
  elite: ELITE_STAGE_MAP[index + 1],
}));

const routeBCache = new Map<number, StageDefinition>();

const STAGE_MODIFIERS: Partial<Record<number, StageModifier>> = {
  6: {
    label: "ワープゾーン",
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
    label: "高速球",
    maxSpeedScale: 1.12,
  },
  9: {
    label: "浮遊敵+フラックス",
    spawnEnemy: true,
    fluxField: true,
  },
  10: {
    label: "フラックス",
    fluxField: true,
  },
  11: {
    label: "フラックス",
    fluxField: true,
  },
};

const STAGE_STORY: Partial<Record<number, string>> = {
  4: "第4ステージ: 深層ゲートに到達。ここから先は分岐ルートで攻略が変化します。",
  8: "第8ステージ: 重力レンズ地帯に突入。球速と軌道が大きく変わる危険域です。",
  12: "最終ステージ: コア・ガーディアン起動。すべての強化を使って突破してください。",
};

export function getStageByIndex(stageIndex: number): StageDefinition {
  const safeIndex = Math.max(0, Math.min(STAGE_CATALOG.length - 1, stageIndex));
  return STAGE_CATALOG[safeIndex];
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

export function getStageStory(stageNumber: number): string | null {
  return STAGE_STORY[stageNumber] ?? null;
}

export function getStageTimeTargetSec(stageIndex: number): number {
  return RATING_CONFIG.baseTargetSec + stageIndex * RATING_CONFIG.targetSecPerStage;
}

function createMirroredStage(stage: StageDefinition): StageDefinition {
  const maxCol = BRICK_LAYOUT.cols - 1;
  const mirroredLayout = stage.layout.map((row) => [...row].reverse());
  const mirroredElite = stage.elite?.map((entry) => ({
    row: entry.row,
    col: maxCol - entry.col,
    kind: entry.kind,
  }));
  return {
    id: stage.id,
    speedScale: stage.speedScale,
    layout: mirroredLayout,
    elite: mirroredElite,
  };
}

validateStageCatalog(STAGE_CATALOG);
