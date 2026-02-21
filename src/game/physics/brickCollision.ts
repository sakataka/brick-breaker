import { applyBrickDamage } from "../brickDamage";
import type { GameplayBalance } from "../config";
import { clamp } from "../math";
import type { Ball, Brick, CollisionEvent } from "../types";
import { normalizeVelocity } from "./velocity";

export interface BrickHitResult {
  scoreGain: number;
  destroyedCount: number;
  cleared: boolean;
  events: CollisionEvent[];
}

export function resolveBrickCollision(ball: Ball, bricks: Brick[]): number {
  for (let i = 0; i < bricks.length; i += 1) {
    const brick = bricks[i];
    if (!brick.alive) {
      continue;
    }

    if (
      ball.pos.x + ball.radius < brick.x ||
      ball.pos.x - ball.radius > brick.x + brick.width ||
      ball.pos.y + ball.radius < brick.y ||
      ball.pos.y - ball.radius > brick.y + brick.height
    ) {
      continue;
    }

    const closestX = clamp(ball.pos.x, brick.x, brick.x + brick.width);
    const closestY = clamp(ball.pos.y, brick.y, brick.y + brick.height);
    const dx = ball.pos.x - closestX;
    const dy = ball.pos.y - closestY;

    if (dx * dx + dy * dy > ball.radius * ball.radius) {
      continue;
    }

    return i;
  }

  return -1;
}

export function applyBrickCollision(
  ball: Ball,
  bricks: Brick[],
  hitBrickIndex: number,
  balance: GameplayBalance,
  maxBallSpeed: number,
  options: {
    reflect: boolean;
    bombRadiusTiles: number;
  },
): BrickHitResult {
  const brick = bricks[hitBrickIndex];
  if (!brick.alive) {
    return {
      scoreGain: 0,
      destroyedCount: 0,
      cleared: !bricks.some((candidate) => candidate.alive),
      events: [],
    };
  }

  const destroyed: Brick[] = [];
  applyDamageAndTrack(brick, "direct", destroyed);

  if (options.bombRadiusTiles > 0) {
    damageExplodedBricks(bricks, brick, options.bombRadiusTiles, destroyed);
  }

  ball.speed = Math.min(maxBallSpeed, ball.speed + balance.brickHitSpeedGain);

  if (options.reflect) {
    const hitX = clamp(ball.pos.x, brick.x, brick.x + brick.width);
    const hitY = clamp(ball.pos.y, brick.y, brick.y + brick.height);
    const dx = ball.pos.x - hitX;
    const dy = ball.pos.y - hitY;

    if (Math.abs(dx) > Math.abs(dy)) {
      ball.vel.x = -ball.vel.x;
      if (dx > 0) {
        ball.pos.x = brick.x + brick.width + ball.radius;
      } else {
        ball.pos.x = brick.x - ball.radius;
      }
    } else {
      ball.vel.y = -ball.vel.y;
      if (dy > 0) {
        ball.pos.y = brick.y + brick.height + ball.radius;
      } else {
        ball.pos.y = brick.y - ball.radius;
      }
    }
  }

  const scoreGain = destroyed.length * balance.scorePerBrick;
  const events = destroyed.map((target) => ({
    kind: "brick" as const,
    x: target.x + target.width / 2,
    y: target.y + target.height / 2,
    color: target.color,
    brickKind: target.kind ?? "normal",
    brickId: target.id,
  }));

  return {
    scoreGain,
    destroyedCount: destroyed.length,
    cleared: !bricks.some((candidate) => candidate.alive),
    events,
  };
}

export function shouldLimitPierceRepeatHit(brick: Brick): boolean {
  if (isMultiHpTarget(brick)) {
    return true;
  }
  return false;
}

export function isMultiHpTarget(brick: Brick): boolean {
  const kind = brick.kind ?? "normal";
  if (kind === "boss" || kind === "durable" || kind === "armored" || kind === "regen") {
    return true;
  }
  const maxHp = brick.maxHp ?? brick.hp ?? 1;
  return maxHp > 1;
}

export function resetDamageLatchIfDetached(ball: Ball, bricks: Brick[]): void {
  if (typeof ball.lastDamageBrickId !== "number") {
    return;
  }
  const latchedBrick = bricks.find((brick) => brick.id === ball.lastDamageBrickId);
  if (!latchedBrick || !latchedBrick.alive || !isBallTouchingBrick(ball, latchedBrick)) {
    ball.lastDamageBrickId = undefined;
  }
}

export function nudgeForward(ball: Ball): void {
  const speed = Math.hypot(ball.vel.x, ball.vel.y);
  if (speed <= 0) {
    return;
  }
  const push = ball.radius * 0.55;
  ball.pos.x += (ball.vel.x / speed) * push;
  ball.pos.y += (ball.vel.y / speed) * push;
}

export function applyHomingAssist(
  ball: Ball,
  bricks: Brick[],
  deltaSec: number,
  strength: number,
  maxBallSpeed: number,
  homingAcceleration: number,
): void {
  const target = findNearestAliveBrick(ball, bricks);
  if (!target) {
    return;
  }
  const cx = target.x + target.width / 2;
  const cy = target.y + target.height / 2;
  const dx = cx - ball.pos.x;
  const dy = cy - ball.pos.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) {
    return;
  }
  const accel = homingAcceleration * strength;
  ball.vel.x += (dx / distance) * accel * deltaSec;
  ball.vel.y += (dy / distance) * accel * deltaSec;
  normalizeVelocity(ball, maxBallSpeed);
}

function damageExplodedBricks(bricks: Brick[], center: Brick, radiusTiles: number, destroyed: Brick[]): void {
  for (const candidate of bricks) {
    if (!candidate.alive || candidate.id === center.id) {
      continue;
    }

    if (isWithinExplosionRange(candidate, center, radiusTiles)) {
      applyDamageAndTrack(candidate, "explosion", destroyed);
    }
  }
}

function applyDamageAndTrack(brick: Brick, source: "direct" | "explosion", destroyed: Brick[]): void {
  const result = applyBrickDamage(brick, source);
  if (result.destroyed) {
    destroyed.push(brick);
  }
}

function isWithinExplosionRange(candidate: Brick, center: Brick, radiusTiles: number): boolean {
  if (
    typeof candidate.row === "number" &&
    typeof candidate.col === "number" &&
    typeof center.row === "number" &&
    typeof center.col === "number"
  ) {
    return (
      Math.abs(candidate.row - center.row) <= radiusTiles &&
      Math.abs(candidate.col - center.col) <= radiusTiles
    );
  }

  const centerX = center.x + center.width / 2;
  const centerY = center.y + center.height / 2;
  const candidateX = candidate.x + candidate.width / 2;
  const candidateY = candidate.y + candidate.height / 2;
  const tileW = Math.max(1, center.width);
  const tileH = Math.max(1, center.height);

  return (
    Math.abs(candidateX - centerX) <= tileW * radiusTiles + tileW * 0.5 &&
    Math.abs(candidateY - centerY) <= tileH * radiusTiles + tileH * 0.5
  );
}

function isBallTouchingBrick(ball: Ball, brick: Brick): boolean {
  if (
    ball.pos.x + ball.radius < brick.x ||
    ball.pos.x - ball.radius > brick.x + brick.width ||
    ball.pos.y + ball.radius < brick.y ||
    ball.pos.y - ball.radius > brick.y + brick.height
  ) {
    return false;
  }

  const closestX = clamp(ball.pos.x, brick.x, brick.x + brick.width);
  const closestY = clamp(ball.pos.y, brick.y, brick.y + brick.height);
  const dx = ball.pos.x - closestX;
  const dy = ball.pos.y - closestY;
  return dx * dx + dy * dy <= ball.radius * ball.radius;
}

function findNearestAliveBrick(ball: Ball, bricks: Brick[]): Brick | null {
  let nearest: Brick | null = null;
  let nearestDistanceSq = Number.POSITIVE_INFINITY;
  for (const brick of bricks) {
    if (!brick.alive) {
      continue;
    }
    const cx = brick.x + brick.width / 2;
    const cy = brick.y + brick.height / 2;
    const dx = cx - ball.pos.x;
    const dy = cy - ball.pos.y;
    const distanceSq = dx * dx + dy * dy;
    if (distanceSq < nearestDistanceSq) {
      nearestDistanceSq = distanceSq;
      nearest = brick;
    }
  }
  return nearest;
}
