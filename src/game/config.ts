import { validateItemConfig, validateStageCatalog } from "./configSchema";
import type { Difficulty, GameConfig, ItemType, StageDefinition } from "./types";

export interface BrickTheme {
  palette: readonly string[];
}

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

export interface GameplayBalance {
  paddleWidth: number;
  paddleHeight: number;
  paddleBottomOffset: number;
  ballRadius: number;
  serveYOffset: number;
  serveSpreadRatio: number;
  brickHitSpeedGain: number;
  paddleMaxBounceAngle: number;
  scorePerBrick: number;
  clearBonusPerLife: number;
}

interface DifficultyPreset {
  config: Pick<
    GameConfig,
    | "initialLives"
    | "initialBallSpeed"
    | "maxBallSpeed"
    | "assistDurationSec"
    | "assistPaddleScale"
    | "assistMaxSpeedScale"
  >;
  balance: Pick<
    GameplayBalance,
    "paddleWidth" | "serveSpreadRatio" | "brickHitSpeedGain" | "paddleMaxBounceAngle"
  >;
}

export interface ItemRule {
  type: ItemType;
  weight: number;
  label: string;
}

export interface DropConfig {
  chance: number;
  maxFalling: number;
  fallSpeed: number;
}

export interface ItemBalance {
  paddlePlusScalePerStack: number;
  slowBallMaxSpeedScalePerStack: number;
  slowBallMinScale: number;
  slowBallInstantSpeedScale: number;
  multiballMaxBalls: number;
  pierceDepthPerStack: number;
}

export interface ComboConfig {
  windowSec: number;
  step: number;
  baseMultiplier: number;
  maxMultiplier: number;
}

export interface RatingConfig {
  star3Min: number;
  star2Min: number;
  timeScoreMax: number;
  hitScoreMax: number;
  lifeScoreMax: number;
  hitPenalty: number;
  lifeScorePerLife: number;
  baseTargetSec: number;
  targetSecPerStage: number;
}

export type ThemeBandId = "early" | "mid" | "late";

export interface ThemeBandDefinition {
  id: ThemeBandId;
  startStage: number;
  endStage: number;
  backdropStart: string;
  backdropEnd: string;
  backdropStroke: string;
  progressBar: string;
  hudAccent: string;
  brickPalette: BrickTheme["palette"];
}

const BASE_CONFIG: Omit<
  GameConfig,
  | "difficulty"
  | "initialLives"
  | "initialBallSpeed"
  | "maxBallSpeed"
  | "assistDurationSec"
  | "assistPaddleScale"
  | "assistMaxSpeedScale"
> = {
  width: 960,
  height: 540,
  fixedDeltaSec: 1 / 120,
};

const BASE_BALANCE: Omit<
  GameplayBalance,
  "paddleWidth" | "serveSpreadRatio" | "brickHitSpeedGain" | "paddleMaxBounceAngle"
> = {
  paddleHeight: 16,
  paddleBottomOffset: 44,
  ballRadius: 8,
  serveYOffset: 18,
  scorePerBrick: 100,
  clearBonusPerLife: 500,
};

export const DIFFICULTY_PRESETS: Record<Difficulty, DifficultyPreset> = {
  casual: {
    config: {
      initialLives: 4,
      initialBallSpeed: 260,
      maxBallSpeed: 520,
      assistDurationSec: 6,
      assistPaddleScale: 1.15,
      assistMaxSpeedScale: 0.88,
    },
    balance: {
      paddleWidth: 148,
      serveSpreadRatio: 0.32,
      brickHitSpeedGain: 1.2,
      paddleMaxBounceAngle: (Math.PI * 50) / 180,
    },
  },
  standard: {
    config: {
      initialLives: 3,
      initialBallSpeed: 300,
      maxBallSpeed: 600,
      assistDurationSec: 3.5,
      assistPaddleScale: 1.08,
      assistMaxSpeedScale: 0.94,
    },
    balance: {
      paddleWidth: 132,
      serveSpreadRatio: 0.4,
      brickHitSpeedGain: 1.8,
      paddleMaxBounceAngle: Math.PI / 3,
    },
  },
  hard: {
    config: {
      initialLives: 2,
      initialBallSpeed: 340,
      maxBallSpeed: 680,
      assistDurationSec: 2.2,
      assistPaddleScale: 1.04,
      assistMaxSpeedScale: 0.97,
    },
    balance: {
      paddleWidth: 118,
      serveSpreadRatio: 0.5,
      brickHitSpeedGain: 2.5,
      paddleMaxBounceAngle: (Math.PI * 65) / 180,
    },
  },
} as const;

export const DEFAULT_DIFFICULTY: Difficulty = "casual";
const activePreset = DIFFICULTY_PRESETS[DEFAULT_DIFFICULTY];

export const GAME_CONFIG: GameConfig = {
  ...BASE_CONFIG,
  difficulty: DEFAULT_DIFFICULTY,
  ...activePreset.config,
};

export const BRICK_PALETTE: BrickTheme["palette"] = [
  "rgba(255, 122, 122, 0.45)",
  "rgba(255, 196, 118, 0.45)",
  "rgba(122, 232, 176, 0.45)",
  "rgba(125, 165, 255, 0.45)",
  "rgba(182, 125, 255, 0.45)",
  "rgba(255, 144, 210, 0.45)",
] as const;

const MID_BRICK_PALETTE: BrickTheme["palette"] = [
  "rgba(255, 149, 98, 0.48)",
  "rgba(255, 223, 124, 0.46)",
  "rgba(122, 238, 210, 0.45)",
  "rgba(104, 193, 255, 0.46)",
  "rgba(189, 144, 255, 0.47)",
  "rgba(255, 164, 230, 0.45)",
] as const;

const LATE_BRICK_PALETTE: BrickTheme["palette"] = [
  "rgba(255, 118, 138, 0.52)",
  "rgba(255, 186, 112, 0.52)",
  "rgba(153, 255, 206, 0.5)",
  "rgba(122, 168, 255, 0.5)",
  "rgba(212, 135, 255, 0.52)",
  "rgba(255, 112, 190, 0.5)",
] as const;

export const GAME_BALANCE: GameplayBalance = {
  ...BASE_BALANCE,
  ...activePreset.balance,
} as const;

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

export const COMBO_CONFIG: ComboConfig = {
  windowSec: 1.8,
  step: 0.25,
  baseMultiplier: 1,
  maxMultiplier: 3,
};

export const RATING_CONFIG: RatingConfig = {
  star3Min: 80,
  star2Min: 55,
  timeScoreMax: 45,
  hitScoreMax: 30,
  lifeScoreMax: 25,
  hitPenalty: 9,
  lifeScorePerLife: 8,
  baseTargetSec: 92,
  targetSecPerStage: 4,
};

export const THEME_BANDS: ThemeBandDefinition[] = [
  {
    id: "early",
    startStage: 1,
    endStage: 4,
    backdropStart: "rgba(255, 255, 255, 0.25)",
    backdropEnd: "rgba(255, 255, 255, 0.04)",
    backdropStroke: "rgba(255, 255, 255, 0.2)",
    progressBar: "rgba(41, 211, 255, 0.9)",
    hudAccent: "#29d3ff",
    brickPalette: BRICK_PALETTE,
  },
  {
    id: "mid",
    startStage: 5,
    endStage: 8,
    backdropStart: "rgba(255, 210, 168, 0.24)",
    backdropEnd: "rgba(255, 192, 112, 0.06)",
    backdropStroke: "rgba(255, 220, 160, 0.34)",
    progressBar: "rgba(255, 169, 84, 0.9)",
    hudAccent: "#ffad61",
    brickPalette: MID_BRICK_PALETTE,
  },
  {
    id: "late",
    startStage: 9,
    endStage: 12,
    backdropStart: "rgba(255, 122, 168, 0.22)",
    backdropEnd: "rgba(126, 86, 232, 0.08)",
    backdropStroke: "rgba(255, 162, 224, 0.36)",
    progressBar: "rgba(255, 106, 174, 0.92)",
    hudAccent: "#ff7fb8",
    brickPalette: LATE_BRICK_PALETTE,
  },
] as const;

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

export const ITEM_CONFIG: Record<ItemType, ItemRule> = {
  paddle_plus: {
    type: "paddle_plus",
    weight: 1 / 6,
    label: "PADDLE+",
  },
  slow_ball: {
    type: "slow_ball",
    weight: 1 / 6,
    label: "SLOW",
  },
  shield: {
    type: "shield",
    weight: 1 / 6,
    label: "SHIELD",
  },
  multiball: {
    type: "multiball",
    weight: 1 / 6,
    label: "MULTI",
  },
  pierce: {
    type: "pierce",
    weight: 1 / 6,
    label: "PIERCE",
  },
  bomb: {
    type: "bomb",
    weight: 1 / 6,
    label: "BOMB",
  },
};

export const ITEM_BALANCE: ItemBalance = {
  paddlePlusScalePerStack: 0.18,
  slowBallMaxSpeedScalePerStack: 0.82,
  slowBallMinScale: 0.35,
  slowBallInstantSpeedScale: 0.9,
  multiballMaxBalls: 4,
  pierceDepthPerStack: 4,
};

export const DROP_CONFIG: DropConfig = {
  chance: 0.18,
  maxFalling: 3,
  fallSpeed: 160,
};

export function getBrickPaletteColor(row: number, palette: BrickTheme["palette"] = BRICK_PALETTE): string {
  return palette[row % palette.length];
}

export function getThemeBandByStage(stageNumber: number): ThemeBandDefinition {
  const normalized = Math.max(1, Math.min(STAGE_CATALOG.length, stageNumber));
  const found = THEME_BANDS.find((band) => normalized >= band.startStage && normalized <= band.endStage);
  return found ?? THEME_BANDS[0];
}

export function getThemeBandByStageIndex(stageIndex: number): ThemeBandDefinition {
  return getThemeBandByStage(stageIndex + 1);
}

export function getBrickPaletteForStage(stageIndex: number): BrickTheme["palette"] {
  return getThemeBandByStageIndex(stageIndex).brickPalette;
}

export function getStageTimeTargetSec(stageIndex: number): number {
  return RATING_CONFIG.baseTargetSec + stageIndex * RATING_CONFIG.targetSecPerStage;
}

export function getStageByIndex(stageIndex: number): StageDefinition {
  const safeIndex = Math.max(0, Math.min(STAGE_CATALOG.length - 1, stageIndex));
  return STAGE_CATALOG[safeIndex];
}

validateStageCatalog(STAGE_CATALOG);
validateItemConfig(ITEM_CONFIG);
