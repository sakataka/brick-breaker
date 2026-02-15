import { createAssistState } from "./assistSystem";
import { getGameplayBalance, getStageByIndex, getStageTimeTargetSec, STAGE_CATALOG } from "./config";
import { createItemState } from "./itemSystem";
import { buildBricksFromStage } from "./level";
import { clamp } from "./math";
import type { Ball, GameConfig, GameState, Paddle, RandomSource, Scene } from "./types";
import { createVfxState } from "./vfxSystem";

export function createBasePaddle(config: GameConfig): Paddle {
  const balance = getGameplayBalance(config.difficulty);
  return {
    x: config.width / 2 - balance.paddleWidth / 2,
    y: config.height - balance.paddleBottomOffset,
    width: balance.paddleWidth,
    height: balance.paddleHeight,
  };
}

export function createRestingBall(config: GameConfig, paddle: Paddle, speed = config.initialBallSpeed): Ball {
  const balance = getGameplayBalance(config.difficulty);
  return {
    pos: {
      x: config.width / 2,
      y: paddle.y - (balance.paddleHeight + balance.ballRadius + 2),
    },
    vel: { x: 0, y: 0 },
    radius: balance.ballRadius,
    speed,
  };
}

export function createServeBall(
  config: GameConfig,
  paddle: Paddle,
  radius: number,
  random: RandomSource,
  speed = config.initialBallSpeed,
): Ball {
  const balance = getGameplayBalance(config.difficulty);
  const spread = (random.next() - 0.5) * speed * balance.serveSpreadRatio;
  const vx = clamp(spread, -speed * 0.45, speed * 0.45);
  const vy = -Math.sqrt(speed * speed - vx * vx);

  return {
    pos: {
      x: paddle.x + paddle.width / 2,
      y: paddle.y - balance.serveYOffset,
    },
    vel: { x: vx, y: vy },
    radius,
    speed,
  };
}

export function createInitialGameState(
  config: GameConfig,
  reducedMotion: boolean,
  scene: Scene,
  highContrast = false,
): GameState {
  const stage = getStageByIndex(0);
  const stageSpeed = config.initialBallSpeed * stage.speedScale;
  const paddle = createBasePaddle(config);
  const ball = createRestingBall(config, paddle, stageSpeed);

  return {
    scene,
    score: 0,
    lives: config.initialLives,
    elapsedSec: 0,
    combo: {
      multiplier: 1,
      streak: 0,
      lastHitSec: -1,
      rewardGranted: false,
      fillTriggered: false,
    },
    stageStats: {
      hitsTaken: 0,
      startedAtSec: 0,
      missionTargetSec: getStageTimeTargetSec(0),
    },
    options: {
      riskMode: false,
      enableNewItemStacks: false,
      debugModeEnabled: false,
      debugRecordResults: false,
      debugScenario: "normal",
      debugItemPreset: "none",
    },
    balls: [ball],
    paddle,
    bricks: buildBricksFromStage(stage),
    combat: {
      laserCooldownSec: 0,
      nextLaserId: 1,
      laserProjectiles: [],
      heldBalls: [],
      shieldBurstQueued: false,
    },
    enemies: [],
    magic: {
      cooldownSec: 0,
      requestCast: false,
      cooldownMaxSec: 10,
    },
    campaign: {
      stageIndex: 0,
      totalStages: STAGE_CATALOG.length,
      stageStartScore: 0,
      results: [],
      routePreference: "auto",
      resolvedRoute: null,
    },
    items: createItemState(),
    assist: createAssistState(config),
    hazard: {
      speedBoostUntilSec: 0,
    },
    shop: {
      usedThisStage: false,
      lastOffer: null,
      lastChosen: null,
    },
    rogue: {
      upgradesTaken: 0,
      paddleScaleBonus: 0,
      maxSpeedScaleBonus: 0,
      scoreScaleBonus: 0,
      pendingOffer: null,
      lastChosen: null,
    },
    story: {
      activeStageNumber: null,
      seenStageNumbers: [],
    },
    vfx: createVfxState(reducedMotion),
    a11y: {
      reducedMotion,
      highContrast,
    },
    errorMessage: null,
  };
}
