import { type GameplayBalance, getGameplayBalance, ITEM_BALANCE } from "./config";
import { clamp } from "./math";
import {
  applyBrickCollision,
  applyHomingAssist,
  isMultiHpTarget,
  nudgeForward,
  resetDamageLatchIfDetached,
  resolveBrickCollision,
  shouldLimitPierceRepeatHit,
} from "./physics/brickCollision";
import { applyFluxField } from "./physics/fluxField";
import { normalizeVelocity } from "./physics/velocity";
import { applyWarpZones } from "./physics/warpZones";
import type { PhysicsFrameResult, PhysicsInput } from "./physicsTypes";
import type { Ball, CollisionEvent } from "./types";

const MAX_SUBSTEPS = 12;
const MAX_MOVE = 4;

export function stepPhysicsCore({
  ball,
  paddle,
  bricks,
  config,
  deltaSec,
  stepConfig,
}: PhysicsInput): PhysicsFrameResult {
  const maxMove = stepConfig?.maxMove ?? MAX_MOVE;
  const maxSubSteps = stepConfig?.maxSubSteps ?? MAX_SUBSTEPS;
  const maxBallSpeed = stepConfig?.maxBallSpeed ?? config.maxBallSpeed;
  const initialBallSpeed = stepConfig?.initialBallSpeed ?? config.initialBallSpeed;
  const pierceDepth = Math.max(0, stepConfig?.pierceDepth ?? 0);
  const bombRadiusTiles = Math.max(0, stepConfig?.bombRadiusTiles ?? 0);
  const explodeOnHit = stepConfig?.explodeOnHit ?? false;
  const homingStrength = Math.max(0, stepConfig?.homingStrength ?? 0);
  const fluxField = stepConfig?.fluxField ?? false;
  const warpZones = stepConfig?.warpZones ?? [];
  const balance = stepConfig?.balance ?? getGameplayBalance(config.difficulty);

  const distance = Math.hypot(ball.vel.x, ball.vel.y) * deltaSec;
  const iterations = Math.min(maxSubSteps, Math.max(1, Math.ceil(distance / maxMove)));
  const subDt = deltaSec / iterations;

  const result: PhysicsFrameResult = {
    livesLost: 0,
    cleared: false,
    scoreGain: 0,
    events: [],
    collision: {
      wall: false,
      paddle: false,
      brick: 0,
    },
  };
  const protectedPierceHits = new Set<number>();

  for (let i = 0; i < iterations; i += 1) {
    ball.warpCooldownSec = Math.max(0, (ball.warpCooldownSec ?? 0) - subDt);
    if (homingStrength > 0) {
      applyHomingAssist(ball, bricks, subDt, homingStrength, maxBallSpeed, ITEM_BALANCE.homingAcceleration);
    }
    integratePosition(ball, subDt);
    applyWarpZones(ball, warpZones);
    resetDamageLatchIfDetached(ball, bricks);

    if (
      resolveWallCollision(
        ball,
        config.width,
        config.height,
        result.collision,
        result.events,
        stepConfig?.onMiss,
      )
    ) {
      result.livesLost = 1;
      return result;
    }

    if (resolvePaddleCollision(ball, paddle.x, paddle.y, paddle.width, paddle.height)) {
      applyPaddleCollision(ball, paddle.x, paddle.y, paddle.width, initialBallSpeed, balance, maxBallSpeed);
      result.collision.paddle = true;
      result.events.push({
        kind: "paddle",
        x: ball.pos.x,
        y: paddle.y,
      });
    }

    let directHits = 0;
    while (true) {
      const hitBrickIndex = resolveBrickCollision(ball, bricks);
      if (hitBrickIndex < 0) {
        break;
      }
      const hitBrick = bricks[hitBrickIndex];
      const repeatedPierceProtectedHit =
        pierceDepth > 0 && shouldLimitPierceRepeatHit(hitBrick) && protectedPierceHits.has(hitBrick.id);
      const repeatedLatchedHit =
        pierceDepth > 0 && isMultiHpTarget(hitBrick) && ball.lastDamageBrickId === hitBrick.id;
      if (repeatedPierceProtectedHit || repeatedLatchedHit) {
        nudgeForward(ball);
        break;
      }

      const canPierce = directHits < pierceDepth;
      const hit = applyBrickCollision(ball, bricks, hitBrickIndex, balance, maxBallSpeed, {
        reflect: !canPierce,
        bombRadiusTiles: explodeOnHit ? bombRadiusTiles : 0,
      });
      if (pierceDepth > 0 && isMultiHpTarget(hitBrick)) {
        ball.lastDamageBrickId = hitBrick.id;
      }
      if (hit.destroyedCount <= 0) {
        if (shouldLimitPierceRepeatHit(hitBrick)) {
          protectedPierceHits.add(hitBrick.id);
        }
        break;
      }

      result.scoreGain += hit.scoreGain;
      result.collision.brick += hit.destroyedCount;
      result.events.push(...hit.events);
      if (hit.cleared) {
        result.cleared = true;
      }
      if (shouldLimitPierceRepeatHit(hitBrick)) {
        protectedPierceHits.add(hitBrick.id);
      }

      directHits += 1;
      if (!canPierce) {
        break;
      }
      nudgeForward(ball);
    }

    if (fluxField) {
      applyFluxField(ball, paddle.x, paddle.y, paddle.width, subDt);
    }
    normalizeVelocity(ball, maxBallSpeed);
  }

  return result;
}

function integratePosition(ball: Ball, deltaSec: number): void {
  ball.pos.x += ball.vel.x * deltaSec;
  ball.pos.y += ball.vel.y * deltaSec;
}

function resolveWallCollision(
  ball: Ball,
  worldWidth: number,
  worldHeight: number,
  collision: PhysicsFrameResult["collision"],
  events: CollisionEvent[],
  onMiss?: (ball: Ball) => boolean,
): boolean {
  let hasWallHit = false;
  if (ball.pos.x - ball.radius < 0) {
    ball.pos.x = ball.radius;
    ball.vel.x = Math.abs(ball.vel.x);
    collision.wall = true;
    hasWallHit = true;
  } else if (ball.pos.x + ball.radius > worldWidth) {
    ball.pos.x = worldWidth - ball.radius;
    ball.vel.x = -Math.abs(ball.vel.x);
    collision.wall = true;
    hasWallHit = true;
  }

  if (ball.pos.y - ball.radius < 0) {
    ball.pos.y = ball.radius;
    ball.vel.y = Math.abs(ball.vel.y);
    collision.wall = true;
    hasWallHit = true;
  }

  if (hasWallHit) {
    events.push({
      kind: "wall",
      x: ball.pos.x,
      y: ball.pos.y,
    });
  }

  if (ball.pos.y - ball.radius > worldHeight) {
    if (onMiss?.(ball)) {
      collision.wall = true;
      events.push({
        kind: "wall",
        x: ball.pos.x,
        y: worldHeight,
      });
      return false;
    }
    events.push({
      kind: "miss",
      x: ball.pos.x,
      y: worldHeight,
    });
    return true;
  }

  return false;
}

function resolvePaddleCollision(
  ball: Ball,
  paddleX: number,
  paddleY: number,
  paddleWidth: number,
  paddleHeight: number,
): boolean {
  if (ball.vel.y <= 0) {
    return false;
  }

  if (
    ball.pos.x + ball.radius < paddleX ||
    ball.pos.x - ball.radius > paddleX + paddleWidth ||
    ball.pos.y + ball.radius < paddleY ||
    ball.pos.y - ball.radius > paddleY + paddleHeight
  ) {
    return false;
  }

  const closestX = clamp(ball.pos.x, paddleX, paddleX + paddleWidth);
  const closestY = clamp(ball.pos.y, paddleY, paddleY + paddleHeight);
  const dx = ball.pos.x - closestX;
  const dy = ball.pos.y - closestY;

  return dx * dx + dy * dy <= ball.radius * ball.radius;
}

function applyPaddleCollision(
  ball: Ball,
  paddleX: number,
  paddleY: number,
  paddleWidth: number,
  initialBallSpeed: number,
  balance: GameplayBalance,
  maxBallSpeed: number,
): void {
  ball.pos.y = paddleY - ball.radius;
  const relativeX = (ball.pos.x - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);
  const impact = Math.max(-1, Math.min(1, relativeX));
  const angle = impact * balance.paddleMaxBounceAngle;
  const speed = Math.min(maxBallSpeed, Math.max(initialBallSpeed, Math.hypot(ball.vel.x, ball.vel.y)));
  ball.vel.x = Math.sin(angle) * speed;
  ball.vel.y = -Math.cos(angle) * speed;
}
