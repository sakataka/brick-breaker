import { activateAssist, applyAssistToPaddle, createAssistState } from "./assistSystem";
import {
  getGameplayBalance,
  getStageForCampaign,
  getStageModifier,
  getStageStory,
  getStageTimeTargetSec,
  RATING_CONFIG,
  ROGUE_CONFIG,
  STAGE_CATALOG,
} from "./config";
import { cloneActiveItemState, createItemState, ensureMultiballCount } from "./itemSystem";
import { buildBricksFromStage } from "./level";
import { createBasePaddle, createServeBall } from "./stateFactory";
import type { EnemyUnit, GameConfig, GameState, RandomSource, RogueUpgradeType, StageRoute } from "./types";
import { createVfxState } from "./vfxSystem";

interface BuildStageRoundOptions {
  carriedActiveItems?: GameState["items"]["active"];
  resetLives?: boolean;
}

interface ResetRoundOptions {
  startStageIndex?: number;
}

function buildStageRound(
  state: GameState,
  config: GameConfig,
  random: RandomSource,
  options: BuildStageRoundOptions = {},
): void {
  const stage = getStageForCampaign(state.campaign.stageIndex, state.campaign.resolvedRoute);
  const balance = getGameplayBalance(config.difficulty);
  const stageInitialSpeed = getStageInitialBallSpeed(config, state.campaign.stageIndex);
  if (options.resetLives ?? true) {
    state.lives = config.initialLives;
  }
  state.bricks = buildBricksFromStage(stage);
  state.items = createItemState();
  if (options.carriedActiveItems) {
    state.items.active = cloneActiveItemState(options.carriedActiveItems);
  }
  state.assist = createAssistState(config);
  state.shop.usedThisStage = false;
  state.shop.lastOffer = null;
  state.shop.lastChosen = null;
  state.hazard.speedBoostUntilSec = 0;
  state.vfx = createVfxState(state.vfx.reducedMotion);
  state.paddle = createBasePaddle(config);
  state.combat.laserCooldownSec = 0;
  state.combat.nextLaserId = 1;
  state.combat.laserProjectiles = [];
  state.combat.heldBalls = [];
  state.combat.shieldBurstQueued = false;
  state.balls = ensureMultiballCount(
    state.items,
    [createServeBall(config, state.paddle, balance.ballRadius, random, stageInitialSpeed)],
    random,
    config.multiballMaxBalls,
  );
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
  };
  state.enemies = createStageEnemies(state.campaign.stageIndex, config);
  state.magic.requestCast = false;
}

export function resetRoundState(
  state: GameState,
  config: GameConfig,
  reducedMotion: boolean,
  random: RandomSource,
  options: ResetRoundOptions = {},
): void {
  const clampedStageIndex = Math.max(0, Math.min(STAGE_CATALOG.length - 1, options.startStageIndex ?? 0));
  state.score = 0;
  state.elapsedSec = 0;
  state.campaign.stageIndex = clampedStageIndex;
  state.campaign.totalStages = STAGE_CATALOG.length;
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
  state.shop.purchaseCount = 0;
  state.vfx = createVfxState(reducedMotion);
  buildStageRound(state, config, random, { resetLives: true });
  state.campaign.stageStartScore = state.score;
}

export function advanceStage(state: GameState, config: GameConfig, random: RandomSource): boolean {
  if (state.campaign.stageIndex >= state.campaign.totalStages - 1) {
    return false;
  }

  if (state.campaign.stageIndex === 3 && state.campaign.resolvedRoute === null) {
    state.campaign.resolvedRoute = resolveRoute(state, random);
  }

  const carriedActiveItems = cloneActiveItemState(state.items.active);
  carriedActiveItems.bombStacks = 0;
  state.rogue.pendingOffer = null;
  state.story.activeStageNumber = null;
  state.campaign.stageIndex += 1;
  buildStageRound(state, config, random, {
    carriedActiveItems,
    resetLives: false,
  });
  state.campaign.stageStartScore = state.score;
  return true;
}

export function retryCurrentStage(state: GameState, config: GameConfig, random: RandomSource): void {
  state.score = state.campaign.stageStartScore;
  state.rogue.pendingOffer = null;
  state.story.activeStageNumber = null;
  buildStageRound(state, config, random, { resetLives: true });
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
  const baseWidth = balance.paddleWidth;
  applyAssistToPaddle(state.paddle, baseWidth, config.width, state.assist, state.elapsedSec);
  state.combat.laserProjectiles = [];
  state.combat.heldBalls = [];
  state.combat.shieldBurstQueued = false;
  state.balls = [
    createServeBall(
      config,
      state.paddle,
      balance.ballRadius,
      random,
      getStageInitialBallSpeed(config, state.campaign.stageIndex),
    ),
  ];
  return true;
}

export function getStageInitialBallSpeed(config: GameConfig, stageIndex: number): number {
  return config.initialBallSpeed * getStageForCampaign(stageIndex, null).speedScale;
}

export function getStageMaxBallSpeed(config: GameConfig, stageIndex: number): number {
  return config.maxBallSpeed * getStageForCampaign(stageIndex, null).speedScale;
}

export function finalizeStageStats(state: GameState, persistResult = true): void {
  const clearTimeSec = Math.max(0, state.elapsedSec - state.stageStats.startedAtSec);
  const ratingScore = computeStageRatingScore(state, clearTimeSec);
  const stars = getStarRatingByScore(ratingScore);
  const missionTargetSec = getStageTimeTargetSec(state.campaign.stageIndex);
  const missionAchieved = clearTimeSec <= missionTargetSec;
  state.stageStats.clearedAtSec = state.elapsedSec;
  state.stageStats.ratingScore = ratingScore;
  state.stageStats.starRating = stars;
  state.stageStats.missionTargetSec = missionTargetSec;
  state.stageStats.missionAchieved = missionAchieved;
  if (persistResult) {
    upsertCampaignStageResult(state, clearTimeSec, stars, ratingScore, missionTargetSec, missionAchieved);
  }
  prepareRogueUpgradeOffer(state);
}

export function getStageClearTimeSec(state: GameState): number | null {
  if (typeof state.stageStats.clearedAtSec !== "number") {
    return null;
  }
  return Math.max(0, state.stageStats.clearedAtSec - state.stageStats.startedAtSec);
}

export function getStarRatingByScore(score: number): 1 | 2 | 3 {
  if (score >= RATING_CONFIG.star3Min) {
    return 3;
  }
  if (score >= RATING_CONFIG.star2Min) {
    return 2;
  }
  return 1;
}

function computeStageRatingScore(state: GameState, clearTimeSec: number): number {
  const targetSec = getStageTimeTargetSec(state.campaign.stageIndex);
  const safeClearSec = Math.max(1, clearTimeSec);
  const timeScore = Math.max(
    0,
    Math.min(
      RATING_CONFIG.timeScoreMax,
      (targetSec / Math.max(targetSec, safeClearSec)) * RATING_CONFIG.timeScoreMax,
    ),
  );
  const hitScore = Math.max(
    0,
    RATING_CONFIG.hitScoreMax - state.stageStats.hitsTaken * RATING_CONFIG.hitPenalty,
  );
  const lifeScore = Math.max(
    0,
    Math.min(RATING_CONFIG.lifeScoreMax, state.lives * RATING_CONFIG.lifeScorePerLife),
  );
  return Math.round(timeScore + hitScore + lifeScore);
}

function upsertCampaignStageResult(
  state: GameState,
  clearTimeSec: number,
  stars: 1 | 2 | 3,
  ratingScore: number,
  missionTargetSec: number,
  missionAchieved: boolean,
): void {
  const stageNumber = state.campaign.stageIndex + 1;
  const entry = {
    stageNumber,
    clearTimeSec,
    stars,
    ratingScore,
    livesAtClear: state.lives,
    missionTargetSec,
    missionAchieved,
  };
  const existing = state.campaign.results.findIndex((result) => result.stageNumber === stageNumber);
  if (existing >= 0) {
    state.campaign.results[existing] = entry;
    return;
  }
  state.campaign.results.push(entry);
  state.campaign.results.sort((a, b) => a.stageNumber - b.stageNumber);
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

export function prepareStageStory(state: GameState): boolean {
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

export function applyRogueUpgradeSelection(state: GameState, selected: RogueUpgradeType): void {
  if (!state.rogue.pendingOffer) {
    return;
  }
  if (!state.rogue.pendingOffer.includes(selected)) {
    selected = state.rogue.pendingOffer[0];
  }
  if (state.rogue.upgradesTaken >= ROGUE_CONFIG.maxUpgrades) {
    state.rogue.pendingOffer = null;
    return;
  }
  if (selected === "paddle_core") {
    state.rogue.paddleScaleBonus += ROGUE_CONFIG.paddleScaleStep;
  } else if (selected === "speed_core") {
    state.rogue.maxSpeedScaleBonus += ROGUE_CONFIG.maxSpeedScaleStep;
  } else {
    state.rogue.scoreScaleBonus += ROGUE_CONFIG.scoreScaleStep;
  }
  state.rogue.upgradesTaken += 1;
  state.rogue.lastChosen = selected;
  state.rogue.pendingOffer = null;
}

function createStageEnemies(stageIndex: number, config: GameConfig): EnemyUnit[] {
  const modifier = getStageModifier(stageIndex + 1);
  if (!modifier?.spawnEnemy) {
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

function prepareRogueUpgradeOffer(state: GameState): void {
  if (state.rogue.upgradesTaken >= ROGUE_CONFIG.maxUpgrades) {
    state.rogue.pendingOffer = null;
    return;
  }
  const stageNumber = state.campaign.stageIndex + 1;
  if (!ROGUE_CONFIG.checkpointStages.includes(stageNumber)) {
    state.rogue.pendingOffer = null;
    return;
  }

  const upgrades: RogueUpgradeType[] = ["paddle_core", "speed_core", "score_core"];
  const pivot = (stageNumber + state.rogue.upgradesTaken + state.lives) % upgrades.length;
  const first = upgrades[pivot];
  const second = upgrades[(pivot + 1) % upgrades.length];
  state.rogue.pendingOffer = [first, second];
}
