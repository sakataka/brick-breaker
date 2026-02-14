import type { SfxManager } from "../audio/sfx";
import { applyAssistToPaddle, getCurrentMaxBallSpeed } from "./assistSystem";
import { playCollisionSounds } from "./collisionEffects";
import { applyComboHits, normalizeCombo, resetCombo } from "./comboSystem";
import { getGameplayBalance, getStageModifier, HAZARD_CONFIG, RISK_MODE_CONFIG } from "./config";
import { pickWeightedItemType } from "./itemRegistry";
import {
  applyItemPickup,
  clearActiveItemEffects,
  ensureMultiballCount,
  getBombRadiusTiles,
  getPaddleScale,
  getPierceDepth,
  getSlowBallMaxSpeedScale,
  spawnDropsFromBrickEvents,
  spawnGuaranteedDrop,
  syncMultiballStacksWithBallCount,
  updateFallingItems,
} from "./itemSystem";
import { runPhysicsForBalls } from "./physicsApply";
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
  ensureShopOffer(state, random);
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

  const basePaddleWidth =
    balance.paddleWidth * getPaddleScale(state.items) * (1 + state.rogue.paddleScaleBonus);
  applyAssistToPaddle(state.paddle, basePaddleWidth, config.width, state.assist, state.elapsedSec);

  const physics = runPhysicsForBalls(state.balls, state.paddle, state.bricks, config, config.fixedDeltaSec, {
    maxBallSpeed: effectiveMaxSpeed,
    initialBallSpeed: stageInitialSpeed,
    pierceDepth,
    bombRadiusTiles,
    explodeOnHit: bombRadiusTiles > 0,
    lowGravity: stageModifier?.lowGravity,
    warpZones: stageModifier?.warpZones,
    onMiss: (target) => deps.tryShieldRescue(target, effectiveMaxSpeed),
  });
  const enemyHits = resolveEnemyHits(state, physics.survivors, scoreScale);
  if (enemyHits.events.length > 0) {
    physics.events.push(...enemyHits.events);
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
  spawnDropsFromBrickEvents(state.items, physics.events, random);
  if (comboRewardTriggered) {
    const rewardOrigin = physics.survivors[0] ?? state.balls[0];
    const rewardX = rewardOrigin?.pos.x ?? state.paddle.x + state.paddle.width / 2;
    const rewardY = rewardOrigin?.pos.y ?? state.paddle.y - 28;
    spawnGuaranteedDrop(state.items, random, rewardX, rewardY);
  }

  const picks = updateFallingItems(state.items, state.paddle, config.height, config.fixedDeltaSec);
  let pickedMultiball = false;
  for (const pick of picks) {
    applyItemPickup(state.items, pick.type, physics.survivors);
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

  const clearedAfterMagic = hadAliveBricksBeforeTick && !state.bricks.some((brick) => brick.alive);
  if (physics.hasClear || clearedAfterMagic) {
    return "stageclear";
  }
  if (state.balls.length <= 0) {
    return "ballloss";
  }
  return "continue";
}

function ensureShopOffer(state: GameState, random: RandomSource): void {
  if (state.shop.usedThisStage || state.shop.lastOffer) {
    return;
  }
  const first = pickWeightedItemType(random);
  const second = pickWeightedItemType(random, [first]);
  state.shop.lastOffer = [first, second];
}

function updateEnemies(state: GameState, config: GameConfig, deltaSec: number): void {
  if (state.enemies.length <= 0) {
    return;
  }
  for (const enemy of state.enemies) {
    if (!enemy.alive) {
      continue;
    }
    enemy.x += enemy.vx * deltaSec;
    const left = enemy.radius + 8;
    const right = config.width - enemy.radius - 8;
    if (enemy.x <= left) {
      enemy.x = left;
      enemy.vx = Math.abs(enemy.vx);
    } else if (enemy.x >= right) {
      enemy.x = right;
      enemy.vx = -Math.abs(enemy.vx);
    }
  }
}

function resolveEnemyHits(
  state: GameState,
  balls: Ball[],
  scoreScale: number,
): {
  scoreGain: number;
  events: Array<{
    kind: "brick";
    x: number;
    y: number;
    color?: string;
  }>;
} {
  let scoreGain = 0;
  const events: Array<{ kind: "brick"; x: number; y: number; color?: string }> = [];
  const enemyScore = 150;

  for (const ball of balls) {
    for (const enemy of state.enemies) {
      if (!enemy.alive) {
        continue;
      }
      const dx = ball.pos.x - enemy.x;
      const dy = ball.pos.y - enemy.y;
      const distanceSq = dx * dx + dy * dy;
      const limit = ball.radius + enemy.radius;
      if (distanceSq > limit * limit) {
        continue;
      }

      enemy.alive = false;
      scoreGain += Math.round(enemyScore * scoreScale);
      events.push({
        kind: "brick",
        x: enemy.x,
        y: enemy.y,
        color: "rgba(255, 168, 104, 0.9)",
      });

      const nextDy = Math.abs(ball.vel.y) < 80 ? -120 : -Math.abs(ball.vel.y);
      ball.vel.y = nextDy;
      ball.vel.x += dx >= 0 ? 24 : -24;
    }
  }

  state.enemies = state.enemies.filter((enemy) => enemy.alive);
  return { scoreGain, events };
}

function castMagicStrike(
  state: GameState,
  scoreScale: number,
  random: RandomSource,
  playMagicCastSfx: () => void,
): void {
  if (!state.magic.requestCast) {
    return;
  }
  state.magic.requestCast = false;
  if (state.magic.cooldownSec > 0) {
    return;
  }
  const target = selectMagicTarget(state);
  if (!target) {
    return;
  }
  target.alive = false;
  target.hp = 0;
  state.score += Math.round(120 * scoreScale);
  state.magic.cooldownSec = state.magic.cooldownMaxSec;
  state.vfx.flashMs = Math.max(state.vfx.flashMs, 90);
  state.vfx.shakeMs = Math.max(state.vfx.shakeMs, 80);
  state.vfx.shakePx = Math.max(state.vfx.shakePx, 3);
  state.vfx.floatingTexts.push({
    text: "SPELL",
    pos: { x: target.x + target.width / 2, y: target.y + target.height / 2 },
    lifeMs: 420,
    maxLifeMs: 420,
    color: "rgba(130, 247, 255, 0.92)",
  });
  state.vfx.impactRings.push({
    pos: { x: target.x + target.width / 2, y: target.y + target.height / 2 },
    radiusStart: 6,
    radiusEnd: 28,
    lifeMs: 220,
    maxLifeMs: 220,
    color: "rgba(130, 247, 255, 0.82)",
  });
  for (let i = 0; i < 8; i += 1) {
    const angle = random.next() * Math.PI * 2;
    const speed = 90 + random.next() * 110;
    state.vfx.particles.push({
      pos: { x: target.x + target.width / 2, y: target.y + target.height / 2 },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      lifeMs: 240,
      maxLifeMs: 240,
      size: 2 + random.next() * 2.4,
      color: "rgba(130, 247, 255, 0.9)",
    });
  }
  playMagicCastSfx();
}

function selectMagicTarget(state: GameState): GameState["bricks"][number] | null {
  let best: GameState["bricks"][number] | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  const originX = state.paddle.x + state.paddle.width / 2;
  const originY = state.paddle.y;
  for (const brick of state.bricks) {
    if (!brick.alive) {
      continue;
    }
    const cx = brick.x + brick.width / 2;
    const cy = brick.y + brick.height / 2;
    const dx = cx - originX;
    const dy = cy - originY;
    const distance = dx * dx + dy * dy;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = brick;
    }
  }
  return best;
}
