import type { Difficulty, GameConfig } from "../public/types";
import type { StartSettingsSelection } from "../public/startSettings";

export const DEFAULT_GAME_CONFIG: GameConfig = {
  width: 960,
  height: 540,
  fixedDeltaSec: 1 / 120,
  difficulty: "standard",
  initialLives: 3,
  initialBallSpeed: 300,
  maxBallSpeed: 600,
  multiballMaxBalls: 4,
  assistDurationSec: 3.5,
  assistPaddleScale: 1.08,
  assistMaxSpeedScale: 0.94,
};

const DIFFICULTY_PRESETS: Record<Difficulty, Partial<GameConfig>> = {
  casual: {
    difficulty: "casual",
    initialLives: 4,
    initialBallSpeed: 260,
    maxBallSpeed: 520,
    assistDurationSec: 6,
    assistPaddleScale: 1.15,
    assistMaxSpeedScale: 0.88,
  },
  standard: {
    difficulty: "standard",
    initialLives: 3,
    initialBallSpeed: 300,
    maxBallSpeed: 600,
    assistDurationSec: 3.5,
    assistPaddleScale: 1.08,
    assistMaxSpeedScale: 0.94,
  },
  hard: {
    difficulty: "hard",
    initialLives: 2,
    initialBallSpeed: 340,
    maxBallSpeed: 680,
    assistDurationSec: 2.2,
    assistPaddleScale: 1.04,
    assistMaxSpeedScale: 0.97,
  },
};

export function buildGameConfig(
  base: GameConfig = DEFAULT_GAME_CONFIG,
  settings?: Pick<StartSettingsSelection, "difficulty">,
): GameConfig {
  return {
    ...base,
    ...DIFFICULTY_PRESETS[settings?.difficulty ?? base.difficulty],
  };
}
