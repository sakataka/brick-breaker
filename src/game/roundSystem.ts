import { activateAssist, applyAssistToPaddle, createAssistState } from "./assistSystem";
import { createEncounterState } from "./bossState";
import { getGameplayBalance, getStageStory, getStageTimeTargetSec, MODE_CONFIG } from "./config";
import { cloneActiveItemState, createItemState, ensureMultiballCount } from "./itemSystem";
import { buildBricksFromStage } from "./level";
import {
  getModeEffectiveStageIndex,
  getStageInitialBallSpeed,
  getStageMaxBallSpeed,
  getTotalStagesForMode,
  resolveStageContextFromState,
  resolveStageMetadataFromState,
} from "./stageContext";
import { createBasePaddle, createServeBall } from "./stateFactory";
import type { EnemyUnit, GameConfig, GameState, RandomSource, StageRoute } from "./types";
import { createVfxState } from "./vfxSystem";

export { applyRogueUpgradeSelection } from "./rogueProgression";
export { finalizeStageStats, getStageClearTimeSec, getStarRatingByScore } from "./stageScoring";

interface BuildStageRuntimeOptions {
  carriedActiveItems?: GameState["items"]["active"];
  resetLives?: boolean;
}

interface ResetRoundOptions {
  startStageIndex?: number;
}

export function resetRoundState(
  state: GameState,
  config: GameConfig,
  reducedMotion: boolean,
  random: RandomSource,
  options: ResetRoundOptions = {},
): void {
  resetRunProgress(state, reducedMotion);
  state.campaign.stageIndex = clampStartStageIndex(state, options.startStageIndex ?? 0);
  state.campaign.totalStages = getTotalStagesForMode(
    state.options.gameMode,
    resolveStageMetadataFromState(state).activeCatalog.length,
  );
  buildStageRuntime(state, config, random, { resetLives: true });
  state.campaign.stageStartScore = state.score;
}

export function advanceStage(state: GameState, config: GameConfig, random: RandomSource): boolean {
  if (state.campaign.stageIndex >= state.campaign.totalStages - 1) {
    return false;
  }

  if (
    state.options.gameMode === "campaign" &&
    state.campaign.stageIndex === 3 &&
    state.campaign.resolvedRoute === null
  ) {
    state.campaign.resolvedRoute = resolveRoute(state, random);
  }

  const carriedActiveItems = carryActiveItems(state.items.active);
  state.rogue.pendingOffer = null;
  state.story.activeStageNumber = null;
  state.campaign.stageIndex += 1;
  buildStageRuntime(state, config, random, {
    carriedActiveItems,
    resetLives: false,
  });
  state.campaign.stageStartScore = state.score;
  return true;
}

export function retryCurrentStage(
  state: GameState,
  config: GameConfig,
  random: RandomSource,
): void {
  state.score = state.campaign.stageStartScore;
  state.rogue.pendingOffer = null;
  state.story.activeStageNumber = null;
  buildStageRuntime(state, config, random, { resetLives: true });
}

export function applyLifeLoss(
  state: GameState,
  livesLost: number,
  config: GameConfig,
  random: RandomSource,
): boolean {
  const balance = getGameplayBalance(config.difficulty);
  state.lives -= livesLost;
  state.stageStats.hitsTaken += livesLost;
  if (state.lives <= 0) {
    return false;
  }

  activateAssist(state.assist, state.elapsedSec, config);
  applyAssistToPaddle(
    state.paddle,
    balance.paddleWidth,
    config.width,
    state.assist,
    state.elapsedSec,
  );
  const stageMetadata = resolveStageMetadataFromState(state);
  resetCombatState(
    state,
    (stageMetadata.stageModifier?.spawnEnemy ?? false) ||
      stageMetadata.stageEvents?.includes("enemy_pressure") === true,
  );
  state.balls = [
    createServeBall(
      config,
      state.paddle,
      balance.ballRadius,
      random,
      getStageInitialBallSpeed(config, {
        stageIndex: state.campaign.stageIndex,
        gameMode: state.options.gameMode,
        campaignCourse: state.options.campaignCourse,
        route: state.campaign.resolvedRoute,
        customStageCatalog: state.options.customStageCatalog,
      }),
    ),
  ];
  return true;
}

export function prepareStageStory(state: GameState): boolean {
  if (state.options.gameMode !== "campaign") {
    return false;
  }
  const stageNumber = state.campaign.stageIndex + 1;
  if (!getStageStory(stageNumber)) {
    return false;
  }
  if (state.story.seenStageNumbers.includes(stageNumber)) {
    return false;
  }
  state.story.seenStageNumbers.push(stageNumber);
  state.story.activeStageNumber = stageNumber;
  return true;
}

function buildStageRuntime(
  state: GameState,
  config: GameConfig,
  random: RandomSource,
  options: BuildStageRuntimeOptions = {},
): void {
  const stageContext = resolveStageContextFromState(state, config);
  const balance = getGameplayBalance(config.difficulty);

  if (options.resetLives ?? true) {
    state.lives = config.initialLives;
  }

  state.bricks = buildBricksFromStage(stageContext.stage);
  applyModeSpecificBrickTweaks(state);
  state.items = createItemState();
  if (options.carriedActiveItems) {
    state.items.active = cloneActiveItemState(options.carriedActiveItems);
  }
  state.assist = createAssistState(config);
  resetStageUiState(state);
  state.vfx = createVfxState(state.vfx.reducedMotion);
  state.paddle = createBasePaddle(config);
  resetCombatState(
    state,
    (stageContext.stageModifier?.spawnEnemy ?? false) ||
      stageContext.stageEvents?.includes("enemy_pressure") === true,
  );
  state.balls = ensureMultiballCount(
    state.items,
    [
      createServeBall(
        config,
        state.paddle,
        balance.ballRadius,
        random,
        stageContext.initialBallSpeed,
      ),
    ],
    random,
    config.multiballMaxBalls,
  );
  resetStageStats(state);
  state.enemies = createStageEnemies(
    config,
    (stageContext.stageModifier?.spawnEnemy ?? false) ||
      stageContext.stageEvents?.includes("enemy_pressure") === true,
  );
  state.magic.requestCast = false;
}

function resetRunProgress(state: GameState, reducedMotion: boolean): void {
  state.score = 0;
  state.elapsedSec = 0;
  state.lastGameOverScore = null;
  state.campaign.totalStages = 0;
  state.campaign.stageStartScore = 0;
  state.campaign.results = [];
  state.campaign.resolvedRoute = null;
  state.rogue = {
    upgradesTaken: 0,
    paddleScaleBonus: 0,
    maxSpeedScaleBonus: 0,
    scoreScaleBonus: 0,
    pendingOffer: null,
    lastChosen: null,
  };
  state.story.activeStageNumber = null;
  state.story.seenStageNumbers = [];
  state.ghost.recordAccumulatorSec = 0;
  state.ghost.recording = [];
  state.shop.purchaseCount = 0;
  state.vfx = createVfxState(reducedMotion);
}

function resetStageUiState(state: GameState): void {
  state.shop.usedThisStage = false;
  state.shop.lastOffer = null;
  state.shop.lastChosen = null;
  state.hazard.speedBoostUntilSec = 0;
}

function resetCombatState(state: GameState, spawnEnemy: boolean): void {
  const encounterState = createEncounterState();
  state.combat.laserCooldownSec = 0;
  state.combat.nextLaserId = 1;
  state.combat.laserProjectiles = [];
  state.combat.heldBalls = [];
  state.combat.shieldBurstQueued = false;
  state.combat.bossPhase = 0;
  state.combat.bossPhaseSummonCooldownSec = 0;
  state.combat.enemyWaveCooldownSec = spawnEnemy ? 6 : 0;
  state.combat.bossAttackState = encounterState;
  state.combat.encounterState = encounterState;
  state.combat.forcedBallLoss = false;
}

function resetStageStats(state: GameState): void {
  state.combo = {
    multiplier: 1,
    streak: 0,
    lastHitSec: -1,
    rewardGranted: false,
    fillTriggered: false,
  };
  state.stageStats = {
    hitsTaken: 0,
    startedAtSec: state.elapsedSec,
    missionTargetSec: getStageTimeTargetSec(state.campaign.stageIndex),
    missionResults: [],
    generatorShutdown: false,
  };
}

function clampStartStageIndex(state: GameState, stageIndex: number): number {
  const activeCatalog = resolveStageMetadataFromState(state).activeCatalog;
  const stageStartCap =
    state.options.gameMode === "boss_rush"
      ? MODE_CONFIG.bossRushRounds - 1
      : activeCatalog.length - 1;
  return Math.max(0, Math.min(stageStartCap, stageIndex));
}

function carryActiveItems(active: GameState["items"]["active"]): GameState["items"]["active"] {
  const carried = cloneActiveItemState(active);
  carried.bombStacks = 0;
  return carried;
}

function resolveRoute(state: GameState, random: RandomSource): StageRoute {
  if (state.campaign.routePreference === "A" || state.campaign.routePreference === "B") {
    return state.campaign.routePreference;
  }
  if (state.score >= 2500 || state.lives >= 3) {
    return "A";
  }
  return random.next() < 0.5 ? "A" : "B";
}

function createStageEnemies(config: GameConfig, spawnEnemy: boolean): EnemyUnit[] {
  if (!spawnEnemy) {
    return [];
  }
  return [
    {
      id: 1,
      x: config.width * 0.5,
      y: 138,
      vx: 90,
      radius: 11,
      alive: true,
    },
  ];
}

function applyModeSpecificBrickTweaks(state: GameState): void {
  if (state.options.gameMode !== "boss_rush") {
    return;
  }
  const round = Math.max(0, state.campaign.stageIndex);
  const hpBonus = round * MODE_CONFIG.bossRushBossHpStep;
  for (const brick of state.bricks) {
    if (brick.kind !== "boss") {
      continue;
    }
    const baseHp = brick.maxHp ?? brick.hp ?? 12;
    const scaledHp = baseHp + hpBonus;
    brick.maxHp = scaledHp;
    brick.hp = scaledHp;
  }
}

export { getModeEffectiveStageIndex, getStageInitialBallSpeed, getStageMaxBallSpeed };
