import { activateAssist, applyAssistToPaddle, createAssistState } from "./assistSystem";
import { createEncounterState } from "./bossState";
import { getBossDefinition } from "./config/bosses";
import { getGameplayBalance, getStageStory, getStageTimeTargetSec } from "./config";
import { cloneActiveItemState, createItemState, ensureMultiballCount } from "./itemSystem";
import { buildBricksFromStage } from "./level";
import {
  getStageInitialBallSpeed,
  resolveStageContextFromState,
  resolveStageMetadataFromState,
  resolveUpcomingStagePreviewFromState,
} from "./stageContext";
import { createBasePaddle, createServeBall } from "./stateFactory";
import type { EnemyUnit, GameConfig, GameState, RandomSource } from "./types";
import { createVfxState } from "./vfxSystem";

export { finalizeStageStats, getStageClearTimeSec, getStarRatingByScore } from "./stageScoring";

interface BuildStageRuntimeOptions {
  carriedActiveItems?: GameState["combat"]["items"]["active"];
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
  state.run.progress.encounterIndex = clampStartStageIndex(state, options.startStageIndex ?? 0);
  state.run.progress.totalEncounters = resolveStageMetadataFromState(state).activeCatalog.length;
  buildStageRuntime(state, config, random, { resetLives: true });
  state.run.progress.encounterStartScore = state.run.score;
}

export function advanceStage(state: GameState, config: GameConfig, random: RandomSource): boolean {
  if (state.run.progress.encounterIndex >= state.run.progress.totalEncounters - 1) {
    return false;
  }

  const carriedActiveItems = carryActiveItems(state.combat.items.active);
  state.encounter.story.activeStageNumber = null;
  state.run.progress.encounterIndex += 1;
  buildStageRuntime(state, config, random, {
    carriedActiveItems,
    resetLives: false,
  });
  state.run.progress.encounterStartScore = state.run.score;
  return true;
}

export function retryCurrentStage(
  state: GameState,
  config: GameConfig,
  random: RandomSource,
): void {
  state.run.score = state.run.progress.encounterStartScore;
  state.encounter.story.activeStageNumber = null;
  buildStageRuntime(state, config, random, { resetLives: true });
}

export function applyLifeLoss(
  state: GameState,
  livesLost: number,
  config: GameConfig,
  random: RandomSource,
): boolean {
  const balance = getGameplayBalance(config.difficulty);
  state.run.lives -= livesLost;
  state.encounter.stats.hitsTaken += livesLost;
  if (state.run.lives <= 0) {
    return false;
  }

  activateAssist(state.combat.assist, state.run.elapsedSec, config);
  applyAssistToPaddle(
    state.combat.paddle,
    balance.paddleWidth,
    config.width,
    state.combat.assist,
    state.run.elapsedSec,
  );
  const stageMetadata = resolveStageMetadataFromState(state);
  resetCombatState(
    state,
    (stageMetadata.stageModifier?.spawnEnemy ?? false) ||
      stageMetadata.stageEvents?.includes("enemy_pressure") === true,
  );
  state.combat.balls = [
    createServeBall(
      config,
      state.combat.paddle,
      balance.ballRadius,
      random,
      getStageInitialBallSpeed(config, {
        stageIndex: state.run.progress.encounterIndex,
        threatTier: state.run.options.threatTier,
      }),
    ),
  ];
  return true;
}

export function prepareStageStory(state: GameState): boolean {
  const stageNumber = state.run.progress.encounterIndex + 1;
  if (!getStageStory(stageNumber)) {
    return false;
  }
  if (state.encounter.story.seenStageNumbers.includes(stageNumber)) {
    return false;
  }
  state.encounter.story.seenStageNumbers.push(stageNumber);
  state.encounter.story.activeStageNumber = stageNumber;
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
    state.run.lives = config.initialLives;
  }

  state.encounter.currentEncounterId = `encounter-${state.run.progress.encounterIndex + 1}`;
  state.combat.bricks = buildBricksFromStage(stageContext.stage);
  applyModeSpecificBrickTweaks(state);
  state.combat.items = createItemState();
  if (options.carriedActiveItems) {
    state.combat.items.active = cloneActiveItemState(options.carriedActiveItems);
  }
  state.combat.assist = createAssistState(config);
  resetStageUiState(state);
  state.ui.vfx = createVfxState(state.ui.vfx.reducedMotion);
  state.combat.paddle = createBasePaddle(config);
  resetCombatState(
    state,
    (stageContext.stageModifier?.spawnEnemy ?? false) ||
      stageContext.stageEvents?.includes("enemy_pressure") === true,
  );
  const bossDefinition =
    stageContext.stage.encounter?.bossDefinition ??
    getBossDefinition(stageContext.stage.encounter?.profile ?? "none");
  state.combat.enemyProjectileStyle = {
    defaultProfile: stageContext.stage.enemyShotProfile ?? "spike_orb",
    turretProfile: "plasma_bolt",
    bossProfile:
      bossDefinition?.projectileSkin ?? stageContext.stage.enemyShotProfile ?? "void_core",
  };
  state.combat.balls = ensureMultiballCount(
    state.combat.items,
    [
      createServeBall(
        config,
        state.combat.paddle,
        balance.ballRadius,
        random,
        stageContext.initialBallSpeed,
      ),
    ],
    random,
    config.multiballMaxBalls,
  );
  resetStageStats(state);
  state.encounter.rewardPreview = resolveUpcomingStagePreviewFromState(state);
  state.combat.enemies = createStageEnemies(
    config,
    (stageContext.stageModifier?.spawnEnemy ?? false) ||
      stageContext.stageEvents?.includes("enemy_pressure") === true,
  );
  state.combat.magic.requestCast = false;
}

function resetRunProgress(state: GameState, reducedMotion: boolean): void {
  state.run.score = 0;
  state.run.elapsedSec = 0;
  state.run.lastGameOverScore = null;
  state.run.records.currentRunRecord = false;
  state.run.records.deltaToBest = 0;
  state.run.progress.totalEncounters = 0;
  state.run.progress.encounterStartScore = 0;
  state.run.progress.results = [];
  state.encounter.story.activeStageNumber = null;
  state.encounter.story.seenStageNumbers = [];
  state.encounter.shop.purchaseCount = 0;
  state.ui.vfx = createVfxState(reducedMotion);
  state.ui.scoreFeed = [];
}

function resetStageUiState(state: GameState): void {
  state.encounter.shop.usedThisStage = false;
  state.encounter.shop.lastOffer = null;
  state.encounter.shop.lastChosen = null;
  state.combat.hazard.speedBoostUntilSec = 0;
}

function resetCombatState(state: GameState, spawnEnemy: boolean): void {
  const encounterState = createEncounterState();
  state.combat.laserCooldownSec = 0;
  state.combat.nextLaserId = 1;
  state.combat.laserProjectiles = [];
  state.combat.heldBalls = [];
  state.combat.shieldBurstQueued = false;
  state.encounter.bossPhase = 0;
  state.encounter.bossPhaseSummonCooldownSec = 0;
  state.encounter.enemyWaveCooldownSec = spawnEnemy ? 6 : 0;
  state.encounter.runtime = encounterState;
  state.encounter.activeTelegraphs = [];
  state.encounter.threatLevel = "low";
  state.combat.enemyProjectileStyle = {
    defaultProfile: "spike_orb",
    turretProfile: "plasma_bolt",
    bossProfile: "void_core",
  };
  state.encounter.forcedBallLoss = false;
}

function resetStageStats(state: GameState): void {
  state.run.combo = {
    multiplier: 1,
    streak: 0,
    lastHitSec: -1,
    rewardGranted: false,
    fillTriggered: false,
  };
  state.encounter.stats = {
    hitsTaken: 0,
    startedAtSec: state.run.elapsedSec,
    missionTargetSec: getStageTimeTargetSec(state.run.progress.encounterIndex),
    missionResults: [],
    generatorShutdown: false,
    canceledShots: 0,
  };
  const stage = resolveStageMetadataFromState(state).stage;
  state.ui.styleBonus = {
    stageFocus: stage.scoreFocus ?? "survival_chain",
    bonusRules: stage.bonusRules ?? [],
    chainLevel: 0,
    lastBonusLabel: null,
    lastBonusScore: 0,
    noDropChainActive: true,
  };
}

function clampStartStageIndex(state: GameState, stageIndex: number): number {
  const activeCatalog = resolveStageMetadataFromState(state).activeCatalog;
  const stageStartCap = activeCatalog.length - 1;
  return Math.max(0, Math.min(stageStartCap, stageIndex));
}

function carryActiveItems(
  active: GameState["combat"]["items"]["active"],
): GameState["combat"]["items"]["active"] {
  const carried = cloneActiveItemState(active);
  carried.bombStacks = 0;
  return carried;
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

function applyModeSpecificBrickTweaks(_state: GameState): void {}
