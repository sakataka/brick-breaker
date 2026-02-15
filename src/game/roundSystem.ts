import { activateAssist, applyAssistToPaddle, createAssistState } from "./assistSystem";
import {
  getGameplayBalance,
  getStageForCampaign,
  getStageModifier,
  getStageStory,
  getStageTimeTargetSec,
  MISSION_CONFIG,
  MODE_CONFIG,
  RATING_CONFIG,
  ROGUE_CONFIG,
  STAGE_CATALOG,
} from "./config";
import { cloneActiveItemState, createItemState, ensureMultiballCount } from "./itemSystem";
import { buildBricksFromStage } from "./level";
import { createBasePaddle, createServeBall } from "./stateFactory";
import type {
  EnemyUnit,
  GameConfig,
  GameMode,
  GameState,
  RandomSource,
  RogueUpgradeType,
  StageRoute,
} from "./types";
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
  const activeCatalog = getActiveStageCatalog(state);
  const runtimeStageIndex = getModeEffectiveStageIndex(
    state.campaign.stageIndex,
    state.options.gameMode,
    activeCatalog.length,
  );
  const stage =
    state.options.customStageCatalog && activeCatalog.length > 0
      ? (activeCatalog[runtimeStageIndex] ?? activeCatalog[activeCatalog.length - 1] ?? STAGE_CATALOG[0])
      : getStageForCampaign(
          runtimeStageIndex,
          state.options.gameMode === "campaign" ? state.campaign.resolvedRoute : null,
        );
  const stageModifier = getStageModifier(runtimeStageIndex + 1);
  const balance = getGameplayBalance(config.difficulty);
  const stageInitialSpeed = getStageInitialBallSpeed(
    config,
    state.campaign.stageIndex,
    state.options.gameMode,
    state.options.customStageCatalog,
  );
  if (options.resetLives ?? true) {
    state.lives = config.initialLives;
  }
  state.bricks = buildBricksFromStage(stage);
  applyModeSpecificBrickTweaks(state);
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
  state.combat.focusRequest = false;
  state.combat.focusRemainingSec = 0;
  state.combat.focusCooldownSec = 0;
  state.combat.bossPhase = 0;
  state.combat.bossPhaseSummonCooldownSec = 0;
  state.combat.enemyWaveCooldownSec = stageModifier?.spawnEnemy ? 6 : 0;
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
    missionResults: [],
  };
  state.enemies = createStageEnemies(runtimeStageIndex, config);
  state.magic.requestCast = false;
}

export function resetRoundState(
  state: GameState,
  config: GameConfig,
  reducedMotion: boolean,
  random: RandomSource,
  options: ResetRoundOptions = {},
): void {
  const stageStartCap =
    state.options.gameMode === "boss_rush"
      ? MODE_CONFIG.bossRushRounds - 1
      : getActiveStageCatalog(state).length - 1;
  const clampedStageIndex = Math.max(0, Math.min(stageStartCap, options.startStageIndex ?? 0));
  state.score = 0;
  state.elapsedSec = 0;
  state.campaign.stageIndex = clampedStageIndex;
  state.campaign.totalStages = getTotalStagesForMode(
    state.options.gameMode,
    getActiveStageCatalog(state).length,
  );
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
  buildStageRound(state, config, random, { resetLives: true });
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
  state.combat.focusRequest = false;
  state.combat.focusRemainingSec = 0;
  state.combat.focusCooldownSec = 0;
  state.combat.bossPhase = 0;
  state.combat.bossPhaseSummonCooldownSec = 0;
  state.combat.enemyWaveCooldownSec = getStageModifier(state.campaign.stageIndex + 1)?.spawnEnemy ? 6 : 0;
  state.balls = [
    createServeBall(
      config,
      state.paddle,
      balance.ballRadius,
      random,
      getStageInitialBallSpeed(
        config,
        state.campaign.stageIndex,
        state.options.gameMode,
        state.options.customStageCatalog,
      ),
    ),
  ];
  return true;
}

export function getStageInitialBallSpeed(
  config: GameConfig,
  stageIndex: number,
  mode: GameMode = "campaign",
  customCatalog: GameState["options"]["customStageCatalog"] = null,
): number {
  return getModeScaledBallSpeed(config.initialBallSpeed, stageIndex, mode, customCatalog);
}

export function getStageMaxBallSpeed(
  config: GameConfig,
  stageIndex: number,
  mode: GameMode = "campaign",
  customCatalog: GameState["options"]["customStageCatalog"] = null,
): number {
  return getModeScaledBallSpeed(config.maxBallSpeed, stageIndex, mode, customCatalog);
}

export function finalizeStageStats(state: GameState, persistResult = true): void {
  const clearTimeSec = Math.max(0, state.elapsedSec - state.stageStats.startedAtSec);
  const ratingScore = computeStageRatingScore(state, clearTimeSec);
  const missionTargetSec = getStageTimeTargetSec(state.campaign.stageIndex);
  const missionResults = buildStageMissionResults(state, clearTimeSec, missionTargetSec);
  const missionAchieved = missionResults.every((mission) => mission.achieved);
  const missionBonusStars = missionAchieved ? MISSION_CONFIG.bonusStarsOnAllClear : 0;
  const stars = Math.min(3, getStarRatingByScore(ratingScore) + missionBonusStars) as 1 | 2 | 3;
  state.stageStats.clearedAtSec = state.elapsedSec;
  state.stageStats.ratingScore = ratingScore;
  state.stageStats.starRating = stars;
  state.stageStats.missionTargetSec = missionTargetSec;
  state.stageStats.missionAchieved = missionAchieved;
  state.stageStats.missionResults = missionResults;
  if (persistResult) {
    upsertCampaignStageResult(
      state,
      clearTimeSec,
      stars,
      ratingScore,
      missionTargetSec,
      missionAchieved,
      missionResults,
    );
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
  missionResults: GameState["stageStats"]["missionResults"],
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
    missionResults: missionResults ?? [],
  };
  const existing = state.campaign.results.findIndex((result) => result.stageNumber === stageNumber);
  if (existing >= 0) {
    state.campaign.results[existing] = entry;
    return;
  }
  state.campaign.results.push(entry);
  state.campaign.results.sort((a, b) => a.stageNumber - b.stageNumber);
}

function buildStageMissionResults(
  state: GameState,
  clearTimeSec: number,
  missionTargetSec: number,
): NonNullable<GameState["stageStats"]["missionResults"]> {
  const timeAchieved = clearTimeSec <= missionTargetSec;
  const noShopAchieved = !state.shop.usedThisStage;
  return [
    {
      key: "time_limit",
      label: "制限時間",
      targetText: `${Math.round(missionTargetSec)}秒以内`,
      achieved: timeAchieved,
    },
    {
      key: "no_shop",
      label: "ショップ未使用",
      achieved: noShopAchieved,
    },
  ];
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

function getTotalStagesForMode(mode: GameMode, stageCount: number): number {
  const safeStageCount = Math.max(1, stageCount);
  if (mode === "endless") {
    return MODE_CONFIG.endlessVirtualStages;
  }
  if (mode === "boss_rush") {
    return MODE_CONFIG.bossRushRounds;
  }
  return safeStageCount;
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

export function getModeEffectiveStageIndex(
  stageIndex: number,
  mode: GameMode,
  stageCount = STAGE_CATALOG.length,
): number {
  const safeStageCount = Math.max(1, stageCount);
  if (mode === "boss_rush") {
    return safeStageCount - 1;
  }
  if (mode === "endless") {
    return stageIndex % safeStageCount;
  }
  return stageIndex;
}

function getModeScaledBallSpeed(
  baseSpeed: number,
  stageIndex: number,
  mode: GameMode,
  customCatalog: GameState["options"]["customStageCatalog"],
): number {
  const activeCatalog = customCatalog && customCatalog.length > 0 ? customCatalog : STAGE_CATALOG;
  const effectiveStage = getModeEffectiveStageIndex(stageIndex, mode, activeCatalog.length);
  const stageDef =
    customCatalog && customCatalog.length > 0
      ? (activeCatalog[effectiveStage] ?? activeCatalog[activeCatalog.length - 1] ?? STAGE_CATALOG[0])
      : getStageForCampaign(effectiveStage, null);
  const baseScale = stageDef.speedScale;
  if (mode !== "boss_rush") {
    return baseSpeed * baseScale;
  }
  const rushScale = 1 + Math.max(0, stageIndex) * MODE_CONFIG.bossRushSpeedScaleStep;
  return baseSpeed * baseScale * rushScale;
}

function getActiveStageCatalog(
  state: Pick<GameState, "options">,
): NonNullable<GameState["options"]["customStageCatalog"]> | typeof STAGE_CATALOG {
  if (state.options.customStageCatalog && state.options.customStageCatalog.length > 0) {
    return state.options.customStageCatalog;
  }
  return STAGE_CATALOG;
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
