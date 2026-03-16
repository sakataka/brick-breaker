import { createAssistState } from "./assistSystem";
import { createEncounterState } from "./bossState";
import {
  getGameplayBalance,
  getStageByIndex,
  getStageTimeTargetSec,
  STAGE_CATALOG,
} from "./config";
import { ITEM_ORDER } from "./itemRegistry";
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

function createRestingBall(
  config: GameConfig,
  paddle: Paddle,
  speed = config.initialBallSpeed,
): Ball {
  const balance = getGameplayBalance(config.difficulty);
  return {
    pos: {
      x: config.width / 2,
      y: paddle.y - (balance.paddleHeight + balance.ballRadius + 2),
    },
    vel: { x: 0, y: 0 },
    radius: balance.ballRadius,
    speed,
    lastDamageBrickId: undefined,
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
    lastDamageBrickId: undefined,
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
  const encounterRuntime = createEncounterState();
  const vfx = createVfxState(reducedMotion);

  return {
    scene,
    run: {
      score: 0,
      lives: config.initialLives,
      lastGameOverScore: null,
      elapsedSec: 0,
      progress: {
        encounterIndex: 0,
        totalEncounters: STAGE_CATALOG.length,
        encounterStartScore: 0,
        results: [],
        unlockedThreatTier: 1,
      },
      combo: {
        multiplier: 1,
        streak: 0,
        lastHitSec: -1,
        rewardGranted: false,
        fillTriggered: false,
      },
      options: {
        threatTier: 1,
        difficulty: config.difficulty,
        reducedMotionEnabled: reducedMotion,
        highContrastEnabled: highContrast,
        bgmEnabled: true,
        sfxEnabled: true,
      },
      modulePolicy: {
        enabledTypes: [...ITEM_ORDER],
        allowExtendedStacks: false,
      },
      records: {
        overallBestScore: 0,
        tier1BestScore: 0,
        tier2BestScore: 0,
        latestRunScore: 0,
        currentRunRecord: false,
        deltaToBest: 0,
      },
    },
    encounter: {
      currentEncounterId: null,
      stats: {
        hitsTaken: 0,
        startedAtSec: 0,
        missionTargetSec: getStageTimeTargetSec(0),
        missionResults: [],
        canceledShots: 0,
      },
      shop: {
        usedThisStage: false,
        purchaseCount: 0,
        lastOffer: null,
        lastChosen: null,
      },
      story: {
        activeStageNumber: null,
        seenStageNumbers: [],
      },
      threatLevel: "low",
      activeTelegraphs: [],
      rewardPreview: null,
      runtime: encounterRuntime,
      bossPhase: 0,
      bossPhaseSummonCooldownSec: 0,
      enemyWaveCooldownSec: 0,
      forcedBallLoss: false,
    },
    combat: {
      balls: [ball],
      paddle,
      bricks: buildBricksFromStage(stage),
      enemies: [],
      laserCooldownSec: 0,
      nextLaserId: 1,
      laserProjectiles: [],
      heldBalls: [],
      shieldBurstQueued: false,
      magic: {
        cooldownSec: 0,
        requestCast: false,
        cooldownMaxSec: 10,
      },
      items: createItemState(),
      assist: createAssistState(config),
      hazard: {
        speedBoostUntilSec: 0,
      },
      enemyProjectileStyle: {
        defaultProfile: "spike_orb",
        turretProfile: "plasma_bolt",
        bossProfile: "void_core",
      },
    },
    ui: {
      vfx,
      a11y: {
        reducedMotion,
        highContrast,
      },
      scoreFeed: [],
      styleBonus: {
        stageFocus: "survival_chain",
        bonusRules: [],
        chainLevel: 0,
        lastBonusLabel: null,
        lastBonusScore: 0,
        noDropChainActive: false,
      },
      error: null,
    },
  };
}
