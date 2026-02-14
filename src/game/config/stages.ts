import { validateStageCatalog } from "../configSchema";
import type { StageDefinition } from "../types";
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
  ["1111111111", "1111111111", "1111111111", "1110110111", "1111111111", "0111111110"],
];

const ELITE_STAGE_MAP: Partial<Record<number, NonNullable<StageDefinition["elite"]>>> = {
  9: [
    { row: 0, col: 4, kind: "durable" },
    { row: 1, col: 5, kind: "durable" },
    { row: 2, col: 2, kind: "armored" },
  ],
  10: [
    { row: 0, col: 3, kind: "durable" },
    { row: 1, col: 6, kind: "armored" },
    { row: 2, col: 4, kind: "durable" },
  ],
  11: [
    { row: 0, col: 2, kind: "armored" },
    { row: 1, col: 7, kind: "durable" },
    { row: 3, col: 5, kind: "armored" },
  ],
  12: [
    { row: 0, col: 4, kind: "armored" },
    { row: 1, col: 1, kind: "durable" },
    { row: 2, col: 8, kind: "durable" },
    { row: 4, col: 4, kind: "armored" },
  ],
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

export function getStageByIndex(stageIndex: number): StageDefinition {
  const safeIndex = Math.max(0, Math.min(STAGE_CATALOG.length - 1, stageIndex));
  return STAGE_CATALOG[safeIndex];
}

export function getStageTimeTargetSec(stageIndex: number): number {
  return RATING_CONFIG.baseTargetSec + stageIndex * RATING_CONFIG.targetSecPerStage;
}

validateStageCatalog(STAGE_CATALOG);
