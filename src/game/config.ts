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

export function getStageByIndex(stageIndex: number): StageDefinition {
  const safeIndex = Math.max(0, Math.min(STAGE_CATALOG.length - 1, stageIndex));
  return STAGE_CATALOG[safeIndex];
}

validateStageCatalog(STAGE_CATALOG);
validateItemConfig(ITEM_CONFIG);
