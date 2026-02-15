import type { SfxManager } from "../audio/sfx";
import { applyAssistToPaddle, getCurrentMaxBallSpeed } from "./assistSystem";
import { playCollisionSounds } from "./collisionEffects";
import { applyComboHits, normalizeCombo, resetCombo } from "./comboSystem";
import {
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
  getLaserLevel,
  getPaddleScale,
  getPierceDepth,
  getSlowBallMaxSpeedScale,
  isStickyEnabled,
  spawnDropsFromBrickEvents,
  spawnGuaranteedDrop,
  syncMultiballStacksWithBallCount,
  updateFallingItems,
} from "./itemSystem";
import { runPhysicsForBalls } from "./physicsApply";
import { resolveEnemyHits, updateEnemies } from "./pipeline/enemyPhase";
import { syncHeldBallsSnapshot, updateAutoLaserSpawner, updateLaserProjectiles } from "./pipeline/laserPhase";
import { castMagicStrike } from "./pipeline/magicPhase";
import { processShieldBurst } from "./pipeline/shieldPhase";
import { getStageInitialBallSpeed, getStageMaxBallSpeed } from "./roundSystem";
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
  const stageModifier = getStageModifier(state.campaign.stageIndex + 1);
  ensureShopOffer(state, random, state.options.stickyItemEnabled);
  updateEnemies(state, config, config.fixedDeltaSec);
  state.magic.cooldownSec = Math.max(0, state.magic.cooldownSec - config.fixedDeltaSec);
  state.elapsedSec += config.fixedDeltaSec;

  const stageInitialSpeed = getStageInitialBallSpeed(config, state.campaign.stageIndex);
  const stageMaxSpeed = getStageMaxBallSpeed(config, state.campaign.stageIndex);
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
    modifierSpeedScale;
  const pierceDepth = getPierceDepth(state.items);
  const bombRadiusTiles = getBombRadiusTiles(state.items);
  const scoreScale =
    (state.options.riskMode ? RISK_MODE_CONFIG.scoreScale : 1) * (1 + state.rogue.scoreScaleBonus);
  const laserLevel = getLaserLevel(state.items);
  const stickyEnabled = isStickyEnabled(state.items);

  const projectileEvents = updateLaserProjectiles(state, config.fixedDeltaSec);

  const basePaddleWidth =
    balance.paddleWidth * getPaddleScale(state.items) * (1 + state.rogue.paddleScaleBonus);
  applyAssistToPaddle(state.paddle, basePaddleWidth, config.width, state.assist, state.elapsedSec);

  const physics = runPhysicsForBalls(state.balls, state.paddle, state.bricks, config, config.fixedDeltaSec, {
    maxBallSpeed: effectiveMaxSpeed,
    initialBallSpeed: stageInitialSpeed,
    pierceDepth,
    bombRadiusTiles,
    explodeOnHit: bombRadiusTiles > 0,
    stickyEnabled,
    stickyHoldSec: ITEM_BALANCE.stickyHoldSec,
    stickyRecaptureCooldownSec: ITEM_BALANCE.stickyRecaptureCooldownSec,
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
  state.score += enemyHits.scoreGain;

  const destroyedBricks = physics.events.filter((event) => event.kind === "brick").length;
  const triggeredHazard = physics.events.some(
    (event) => event.kind === "brick" && event.brickKind === "hazard",
  );
  const comboRewardBefore = state.combo.rewardGranted;
  const comboFillBefore = state.combo.fillTriggered;
  const baseScoreGain = applyComboHits(state.combo, state.elapsedSec, destroyedBricks, balance.scorePerBrick);
  state.score += Math.round(baseScoreGain * scoreScale);
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

  const picks = updateFallingItems(state.items, state.paddle, config.height, config.fixedDeltaSec);
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
    updateAutoLaserSpawner(state, config.fixedDeltaSec, laserLevel);
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
  const excluded: ItemType[] = stickyItemEnabled ? [] : ["sticky"];
  const first = pickWeightedItemType(random, excluded);
  const second = pickWeightedItemType(random, [...excluded, first]);
  return [first, second];
}

function ensureShopOffer(state: GameState, random: RandomSource, stickyItemEnabled: boolean): void {
  if (state.shop.usedThisStage || state.shop.lastOffer) {
    return;
  }
  state.shop.lastOffer = generateShopOffer(random, stickyItemEnabled);
}
