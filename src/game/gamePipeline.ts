import type { SfxManager } from "../audio/sfx";
import { applyAssistToPaddle, getCurrentMaxBallSpeed } from "./assistSystem";
import { playCollisionSounds } from "./collisionEffects";
import { applyComboHits, normalizeCombo, resetCombo } from "./comboSystem";
import {
  BOSS_PHASE_CONFIG,
  FOCUS_CONFIG,
  getGameplayBalance,
  getStageModifier,
  HAZARD_CONFIG,
  ITEM_BALANCE,
  RISK_MODE_CONFIG,
} from "./config";
import { pickWeightedItemType } from "./itemRegistry";
import {
  applyItemPickup,
  clearActiveItemEffects,
  ensureMultiballCount,
  getBombRadiusTiles,
  getHomingStrength,
  getLaserLevel,
  getPaddleScale,
  getPierceDepth,
  getRailLevel,
  getSlowBallMaxSpeedScale,
  isStickyEnabled,
  spawnDropsFromBrickEvents,
  spawnGuaranteedDrop,
  syncMultiballStacksWithBallCount,
  updateFallingItems,
} from "./itemSystem";
import { runPhysicsForBalls } from "./physicsApply";
import { processEliteBrickEvents } from "./pipeline/elitePhase";
import { resolveEnemyHits, updateEnemies, updateEnemyWaveEvent } from "./pipeline/enemyPhase";
import { syncHeldBallsSnapshot, updateAutoLaserSpawner, updateLaserProjectiles } from "./pipeline/laserPhase";
import { castMagicStrike } from "./pipeline/magicPhase";
import { processShieldBurst } from "./pipeline/shieldPhase";
import { getModeEffectiveStageIndex, getStageInitialBallSpeed, getStageMaxBallSpeed } from "./roundSystem";
import type { Ball, GameConfig, GameState, ItemType, RandomSource } from "./types";
import { applyCollisionEvents, spawnItemPickupFeedback } from "./vfxSystem";

export type PipelineOutcome = "continue" | "stageclear" | "ballloss";

export interface GamePipelineDeps {
  config: GameConfig;
  random: RandomSource;
  sfx: SfxManager;
  tryShieldRescue: (ball: Ball, maxSpeed: number) => boolean;
  playPickupSfx: (itemType: ItemType) => void;
  playComboFillSfx: () => void;
  playMagicCastSfx: () => void;
}

export function stepPlayingPipeline(state: GameState, deps: GamePipelineDeps): PipelineOutcome {
  const { config, random } = deps;
  const balance = getGameplayBalance(config.difficulty);
  const hadAliveBricksBeforeTick = state.bricks.some((brick) => brick.alive);
  const effectiveStageIndex = getModeEffectiveStageIndex(
    state.campaign.stageIndex,
    state.options.gameMode,
    state.options.customStageCatalog?.length,
  );
  const stageModifier = getStageModifier(effectiveStageIndex + 1);
  ensureShopOffer(state, random, state.options.stickyItemEnabled, effectiveStageIndex);
  const focusTimeScale = updateFocusState(state, config.fixedDeltaSec, deps.sfx);
  const pipelineDeltaSec = config.fixedDeltaSec * focusTimeScale;
  updateEnemies(state, config, pipelineDeltaSec);
  if (updateEnemyWaveEvent(state, config, random, pipelineDeltaSec, stageModifier?.spawnEnemy ?? false)) {
    state.vfx.floatingTexts.push({
      text: "REINFORCE",
      pos: { x: config.width / 2, y: 114 },
      lifeMs: 440,
      maxLifeMs: 440,
      color: "rgba(255, 182, 122, 0.95)",
    });
  }
  state.magic.cooldownSec = Math.max(0, state.magic.cooldownSec - pipelineDeltaSec);
  state.elapsedSec += config.fixedDeltaSec;
  const bossPhaseSpeedScale = updateBossPhase(state, config, random, deps.sfx, pipelineDeltaSec);

  const stageInitialSpeed = getStageInitialBallSpeed(
    config,
    state.campaign.stageIndex,
    state.options.gameMode,
    state.options.customStageCatalog,
  );
  const stageMaxSpeed = getStageMaxBallSpeed(
    config,
    state.campaign.stageIndex,
    state.options.gameMode,
    state.options.customStageCatalog,
  );
  const maxWithAssist = getCurrentMaxBallSpeed(stageMaxSpeed, state.assist, state.elapsedSec);
  const hazardSpeedScale =
    state.elapsedSec < state.hazard.speedBoostUntilSec ? HAZARD_CONFIG.maxSpeedScale : 1;
  const riskSpeedScale = state.options.riskMode ? RISK_MODE_CONFIG.maxSpeedScale : 1;
  const rogueSpeedScale = 1 + state.rogue.maxSpeedScaleBonus;
  const modifierSpeedScale = stageModifier?.maxSpeedScale ?? 1;
  const effectiveMaxSpeed =
    maxWithAssist *
    getSlowBallMaxSpeedScale(state.items) *
    hazardSpeedScale *
    riskSpeedScale *
    rogueSpeedScale *
    modifierSpeedScale *
    bossPhaseSpeedScale;
  const pierceDepth = getPierceDepth(state.items);
  const bombRadiusTiles = getBombRadiusTiles(state.items);
  const homingStrength = getHomingStrength(state.items);
  const railLevel = getRailLevel(state.items);
  const scoreScale =
    (state.options.riskMode ? RISK_MODE_CONFIG.scoreScale : 1) * (1 + state.rogue.scoreScaleBonus);
  const laserLevel = getLaserLevel(state.items);
  const stickyEnabled = isStickyEnabled(state.items);

  const projectileEvents = updateLaserProjectiles(state, pipelineDeltaSec, railLevel);

  const basePaddleWidth =
    balance.paddleWidth * getPaddleScale(state.items) * (1 + state.rogue.paddleScaleBonus);
  applyAssistToPaddle(state.paddle, basePaddleWidth, config.width, state.assist, state.elapsedSec);

  const physics = runPhysicsForBalls(state.balls, state.paddle, state.bricks, config, pipelineDeltaSec, {
    maxBallSpeed: effectiveMaxSpeed,
    initialBallSpeed: stageInitialSpeed,
    pierceDepth,
    bombRadiusTiles,
    explodeOnHit: bombRadiusTiles > 0,
    stickyEnabled,
    stickyHoldSec: ITEM_BALANCE.stickyHoldSec,
    stickyRecaptureCooldownSec: ITEM_BALANCE.stickyRecaptureCooldownSec,
    homingStrength,
    fluxField: stageModifier?.fluxField,
    warpZones: stageModifier?.warpZones,
    onMiss: (target) => deps.tryShieldRescue(target, effectiveMaxSpeed),
  });
  if (projectileEvents.length > 0) {
    physics.events.push(...projectileEvents);
  }
  const enemyHits = resolveEnemyHits(state, physics.survivors, scoreScale);
  if (enemyHits.events.length > 0) {
    physics.events.push(...enemyHits.events);
  }
  const burstEvents = processShieldBurst(state, physics.survivors, effectiveMaxSpeed, deps.sfx, random);
  if (burstEvents.length > 0) {
    physics.events.push(...burstEvents);
  }
  const eliteEffects = processEliteBrickEvents(state, physics.events, config, random);
  state.score += enemyHits.scoreGain;

  const destroyedBricks = physics.events.filter((event) => event.kind === "brick").length;
  const triggeredHazard = physics.events.some(
    (event) => event.kind === "brick" && event.brickKind === "hazard",
  );
  const comboRewardBefore = state.combo.rewardGranted;
  const comboFillBefore = state.combo.fillTriggered;
  const baseScoreGain = applyComboHits(state.combo, state.elapsedSec, destroyedBricks, balance.scorePerBrick);
  state.score += Math.round(baseScoreGain * scoreScale);
  if (eliteEffects.scorePenalty > 0) {
    state.score = Math.max(0, state.score - eliteEffects.scorePenalty);
  }
  if (!comboFillBefore && state.combo.multiplier >= 2.5) {
    state.combo.fillTriggered = true;
    deps.playComboFillSfx();
  }
  const comboRewardTriggered = !comboRewardBefore && state.combo.rewardGranted;
  const hadBallDrop = physics.lostBalls > 0;
  const lostAllBalls = physics.survivors.length <= 0;
  playCollisionSounds(deps.sfx, physics.events);
  applyCollisionEvents(state.vfx, physics.events, random);
  spawnDropsFromBrickEvents(state.items, physics.events, random, {
    stickyItemEnabled: state.options.stickyItemEnabled,
  });
  if (comboRewardTriggered) {
    const rewardOrigin = physics.survivors[0] ?? state.balls[0];
    const rewardX = rewardOrigin?.pos.x ?? state.paddle.x + state.paddle.width / 2;
    const rewardY = rewardOrigin?.pos.y ?? state.paddle.y - 28;
    spawnGuaranteedDrop(state.items, random, rewardX, rewardY, {
      stickyItemEnabled: state.options.stickyItemEnabled,
    });
  }

  const picks = updateFallingItems(state.items, state.paddle, config.height, pipelineDeltaSec);
  let pickedMultiball = false;
  for (const pick of picks) {
    applyItemPickup(state.items, pick.type, physics.survivors, {
      enableNewItemStacks: state.options.enableNewItemStacks,
    });
    if (pick.type === "multiball") {
      pickedMultiball = true;
    }
    spawnItemPickupFeedback(state.vfx, pick.type, pick.pos.x, pick.pos.y);
  }
  for (const pick of picks.slice(0, 2)) {
    deps.playPickupSfx(pick.type);
  }

  if (triggeredHazard) {
    state.items.active.slowBallStacks = 0;
    state.hazard.speedBoostUntilSec = state.elapsedSec + HAZARD_CONFIG.durationSec;
    const boostedMaxSpeed = maxWithAssist * HAZARD_CONFIG.maxSpeedScale;
    for (const ball of physics.survivors) {
      const speed = Math.hypot(ball.vel.x, ball.vel.y);
      const target = Math.min(boostedMaxSpeed, speed * HAZARD_CONFIG.instantSpeedScale);
      if (speed <= 0 || target <= 0) {
        continue;
      }
      const scale = target / speed;
      ball.vel.x *= scale;
      ball.vel.y *= scale;
      ball.speed = target;
    }
  }

  if (lostAllBalls) {
    clearActiveItemEffects(state.items);
    state.combat.laserProjectiles = [];
    state.combat.laserCooldownSec = 0;
  }
  castMagicStrike(state, scoreScale, random, deps.playMagicCastSfx);
  if (hadBallDrop) {
    resetCombo(state.combo);
  } else {
    normalizeCombo(state.combo, state.elapsedSec);
  }

  state.balls =
    pickedMultiball && !hadBallDrop
      ? ensureMultiballCount(state.items, physics.survivors, random, config.multiballMaxBalls)
      : physics.survivors;
  syncMultiballStacksWithBallCount(state.items, state.balls);
  syncHeldBallsSnapshot(state);
  if (!lostAllBalls) {
    updateAutoLaserSpawner(state, pipelineDeltaSec, laserLevel);
  }

  const clearedAfterMagic = hadAliveBricksBeforeTick && !state.bricks.some((brick) => brick.alive);
  if (physics.hasClear || clearedAfterMagic) {
    return "stageclear";
  }
  if (state.balls.length <= 0) {
    return "ballloss";
  }
  return "continue";
}

export function generateShopOffer(random: RandomSource, stickyItemEnabled: boolean): [ItemType, ItemType] {
  return generateShopOfferByContext(random, {
    stickyItemEnabled,
    stageIndex: 0,
  });
}

interface ShopOfferContext {
  stickyItemEnabled: boolean;
  stageIndex: number;
}

function generateShopOfferByContext(random: RandomSource, context: ShopOfferContext): [ItemType, ItemType] {
  const excluded: ItemType[] = context.stickyItemEnabled ? [] : ["sticky"];
  const earlyPool: ItemType[] = ["paddle_plus", "slow_ball", "shield", "multiball", "sticky"];
  const latePool: ItemType[] = ["laser", "pierce", "bomb", "homing", "rail", "multiball"];
  const firstPool = context.stageIndex >= 7 ? latePool : earlyPool;
  const secondPool = context.stageIndex >= 7 ? earlyPool : latePool;
  const first = pickFromPool(random, firstPool, excluded);
  const second = pickFromPool(random, secondPool, [...excluded, first]);
  if (first === second) {
    const fallback = pickWeightedItemType(random, [...excluded, first]);
    return [first, fallback];
  }
  return [first, second];
}

function ensureShopOffer(
  state: GameState,
  random: RandomSource,
  stickyItemEnabled: boolean,
  effectiveStageIndex: number,
): void {
  if (state.shop.usedThisStage || state.shop.lastOffer) {
    return;
  }
  state.shop.lastOffer = generateShopOfferByContext(random, {
    stickyItemEnabled,
    stageIndex: effectiveStageIndex,
  });
}

function pickFromPool(random: RandomSource, pool: ItemType[], excluded: ItemType[]): ItemType {
  const available = pool.filter((type) => !excluded.includes(type));
  if (available.length <= 0) {
    return pickWeightedItemType(random, excluded);
  }
  const index = Math.floor(random.next() * available.length);
  return available[index] ?? available[available.length - 1];
}

function updateFocusState(state: GameState, deltaSec: number, sfx: SfxManager): number {
  const wasActive = state.combat.focusRemainingSec > 0;
  state.combat.focusRemainingSec = Math.max(0, state.combat.focusRemainingSec - deltaSec);
  if (!wasActive && state.combat.focusCooldownSec > 0) {
    state.combat.focusCooldownSec = Math.max(0, state.combat.focusCooldownSec - deltaSec);
  }
  if (state.combat.focusRequest) {
    state.combat.focusRequest = false;
    const canActivate =
      state.combat.focusRemainingSec <= 0 &&
      state.combat.focusCooldownSec <= 0 &&
      state.score >= FOCUS_CONFIG.scoreCost;
    if (canActivate) {
      state.score -= FOCUS_CONFIG.scoreCost;
      state.combat.focusRemainingSec = FOCUS_CONFIG.durationSec;
      void sfx.play("focus_activate");
    }
  }
  if (wasActive && state.combat.focusRemainingSec <= 0) {
    state.combat.focusCooldownSec = FOCUS_CONFIG.cooldownSec;
  }
  return state.combat.focusRemainingSec > 0 ? FOCUS_CONFIG.timeScale : 1;
}

function updateBossPhase(
  state: GameState,
  config: GameConfig,
  random: RandomSource,
  sfx: SfxManager,
  deltaSec: number,
): number {
  const boss = state.bricks.find((brick) => brick.alive && brick.kind === "boss");
  if (!boss) {
    state.combat.bossPhase = 0;
    state.combat.bossPhaseSummonCooldownSec = 0;
    return 1;
  }
  const hp = Math.max(0, boss.hp ?? 0);
  const maxHp = Math.max(hp, boss.maxHp ?? 12);
  const phase = hp <= maxHp * BOSS_PHASE_CONFIG.phase2Ratio ? 2 : 1;
  if (state.combat.bossPhase !== phase) {
    state.combat.bossPhase = phase;
    if (phase === 2) {
      state.combat.bossPhaseSummonCooldownSec = BOSS_PHASE_CONFIG.summonIntervalSec;
      state.vfx.flashMs = Math.max(state.vfx.flashMs, 120);
      state.vfx.shakeMs = Math.max(state.vfx.shakeMs, 90);
      state.vfx.shakePx = Math.max(state.vfx.shakePx, 4);
      state.vfx.floatingTexts.push({
        text: "BOSS PHASE 2",
        pos: { x: boss.x + boss.width / 2, y: boss.y + boss.height / 2 },
        lifeMs: 600,
        maxLifeMs: 600,
        color: "rgba(255, 196, 112, 0.95)",
      });
      void sfx.play("combo_fill");
    }
  }
  if (phase >= 2) {
    state.combat.bossPhaseSummonCooldownSec = Math.max(0, state.combat.bossPhaseSummonCooldownSec - deltaSec);
    if (state.combat.bossPhaseSummonCooldownSec <= 0) {
      spawnBossAdd(state, config, random);
      state.combat.bossPhaseSummonCooldownSec = BOSS_PHASE_CONFIG.summonIntervalSec;
    }
    return BOSS_PHASE_CONFIG.phase2SpeedScale;
  }
  return 1;
}

function spawnBossAdd(state: GameState, config: GameConfig, random: RandomSource): void {
  if (state.enemies.length >= 2) {
    return;
  }
  const nextId = state.enemies.reduce((max, enemy) => Math.max(max, enemy.id), 0) + 1;
  const x = 120 + random.next() * (config.width - 240);
  state.enemies.push({
    id: nextId,
    x,
    y: 138,
    vx: random.next() > 0.5 ? 110 : -110,
    radius: 11,
    alive: true,
  });
}
