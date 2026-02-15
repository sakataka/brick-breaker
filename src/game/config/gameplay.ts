import type { Difficulty, GameConfig } from "../types";

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

export type SpeedPreset = "0.75" | "1.00" | "1.25";

export interface StartSetupOptions {
  difficulty: Difficulty;
  initialLives: number;
  speedPreset: SpeedPreset;
  multiballMaxBalls: number;
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

export interface HazardConfig {
  durationSec: number;
  maxSpeedScale: number;
  instantSpeedScale: number;
}

export interface RiskModeConfig {
  scoreScale: number;
  maxSpeedScale: number;
}

export interface ShopConfig {
  purchaseCost: number;
}

export interface RogueConfig {
  maxUpgrades: number;
  checkpointStages: readonly number[];
  paddleScaleStep: number;
  maxSpeedScaleStep: number;
  scoreScaleStep: number;
}

export interface CombatConfig {
  enemyDefeatScore: number;
  magicStrikeScore: number;
  laserMaxProjectiles: number;
  laserSpawnYOffset: number;
  shieldRescue: {
    yOffset: number;
    minUpwardSpeed: number;
    minSpreadX: number;
    spreadRatio: number;
  };
}

export const DEFAULT_MULTIBALL_MAX_BALLS = 4;

export const START_SETTING_LIMITS = {
  minLives: 1,
  maxLives: 6,
  minMultiballMaxBalls: 2,
  maxMultiballMaxBalls: 8,
} as const;

const BASE_CONFIG: Omit<
  GameConfig,
  | "difficulty"
  | "initialLives"
  | "initialBallSpeed"
  | "maxBallSpeed"
  | "multiballMaxBalls"
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

export const DEFAULT_DIFFICULTY: Difficulty = "standard";
const activePreset = DIFFICULTY_PRESETS[DEFAULT_DIFFICULTY];

export const GAME_CONFIG: GameConfig = {
  ...BASE_CONFIG,
  difficulty: DEFAULT_DIFFICULTY,
  ...activePreset.config,
  multiballMaxBalls: DEFAULT_MULTIBALL_MAX_BALLS,
};

export const GAME_BALANCE: GameplayBalance = {
  ...BASE_BALANCE,
  ...activePreset.balance,
} as const;

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

export const HAZARD_CONFIG: HazardConfig = {
  durationSec: 3,
  maxSpeedScale: 1.2,
  instantSpeedScale: 1.15,
};

export const RISK_MODE_CONFIG: RiskModeConfig = {
  scoreScale: 1.35,
  maxSpeedScale: 1.12,
};

export const SHOP_CONFIG: ShopConfig = {
  purchaseCost: 1200,
};

export const ROGUE_CONFIG: RogueConfig = {
  maxUpgrades: 3,
  checkpointStages: [3, 7, 11],
  paddleScaleStep: 0.08,
  maxSpeedScaleStep: 0.07,
  scoreScaleStep: 0.15,
};

export const COMBAT_CONFIG: CombatConfig = {
  enemyDefeatScore: 150,
  magicStrikeScore: 120,
  laserMaxProjectiles: 18,
  laserSpawnYOffset: 8,
  shieldRescue: {
    yOffset: 10,
    minUpwardSpeed: 120,
    minSpreadX: 40,
    spreadRatio: 0.28,
  },
} as const;

export function getGameplayBalance(difficulty: Difficulty): GameplayBalance {
  return {
    ...BASE_BALANCE,
    ...DIFFICULTY_PRESETS[difficulty].balance,
  };
}

export function resolveSpeedScale(speedPreset: SpeedPreset): number {
  const parsed = Number(speedPreset);
  if (Number.isNaN(parsed)) {
    return 1;
  }
  return Math.max(0.5, Math.min(2, parsed));
}

export function buildStartConfig(base: GameConfig, setup: StartSetupOptions): GameConfig {
  const preset = DIFFICULTY_PRESETS[setup.difficulty];
  const speedScale = resolveSpeedScale(setup.speedPreset);
  const safeLives = Math.max(
    START_SETTING_LIMITS.minLives,
    Math.min(START_SETTING_LIMITS.maxLives, setup.initialLives),
  );
  const safeMultiballMaxBalls = Math.max(
    START_SETTING_LIMITS.minMultiballMaxBalls,
    Math.min(START_SETTING_LIMITS.maxMultiballMaxBalls, Math.round(setup.multiballMaxBalls)),
  );
  return {
    ...base,
    difficulty: setup.difficulty,
    initialLives: safeLives,
    initialBallSpeed: preset.config.initialBallSpeed * speedScale,
    maxBallSpeed: preset.config.maxBallSpeed * speedScale,
    multiballMaxBalls: safeMultiballMaxBalls,
    assistDurationSec: preset.config.assistDurationSec,
    assistPaddleScale: preset.config.assistPaddleScale,
    assistMaxSpeedScale: preset.config.assistMaxSpeedScale,
  };
}
