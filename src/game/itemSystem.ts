import { DROP_CONFIG, ITEM_BALANCE, ITEM_CONFIG } from "./config";
import type { Ball, CollisionEvent, FallingItem, ItemState, ItemType, Paddle, RandomSource } from "./types";

const ITEM_SIZE = 16;

function createTimedEffect(type: "paddle_plus" | "slow_ball" | "multiball") {
  return {
    type,
    untilSec: 0,
  };
}

export function createItemState(): ItemState {
  return {
    falling: [],
    nextId: 1,
    active: {
      paddlePlus: createTimedEffect("paddle_plus"),
      slowBall: createTimedEffect("slow_ball"),
      multiball: createTimedEffect("multiball"),
      shield: {
        untilSec: 0,
        remainingHits: 0,
      },
    },
  };
}

function isActive(untilSec: number, elapsedSec: number): boolean {
  return untilSec > elapsedSec;
}

function extendUntil(currentUntilSec: number, elapsedSec: number, baseDurationSec: number): number {
  const upper = elapsedSec + DROP_CONFIG.maxDurationSec;
  if (isActive(currentUntilSec, elapsedSec)) {
    const extended = currentUntilSec + baseDurationSec * DROP_CONFIG.extendRatio;
    return Math.min(upper, extended);
  }
  return Math.min(upper, elapsedSec + baseDurationSec);
}

export function updateItemTimers(items: ItemState, elapsedSec: number): void {
  if (!isActive(items.active.paddlePlus.untilSec, elapsedSec)) {
    items.active.paddlePlus.untilSec = 0;
  }
  if (!isActive(items.active.slowBall.untilSec, elapsedSec)) {
    items.active.slowBall.untilSec = 0;
  }
  if (!isActive(items.active.multiball.untilSec, elapsedSec)) {
    items.active.multiball.untilSec = 0;
  }
  if (!isActive(items.active.shield.untilSec, elapsedSec)) {
    items.active.shield.untilSec = 0;
    items.active.shield.remainingHits = 0;
  }
}

export function getPaddleScale(items: ItemState, elapsedSec: number): number {
  if (!isActive(items.active.paddlePlus.untilSec, elapsedSec)) {
    return 1;
  }
  return ITEM_BALANCE.paddlePlusScale;
}

export function getSlowBallMaxSpeedScale(items: ItemState, elapsedSec: number): number {
  if (!isActive(items.active.slowBall.untilSec, elapsedSec)) {
    return 1;
  }
  return ITEM_BALANCE.slowBallMaxSpeedScale;
}

export function isMultiballActive(items: ItemState, elapsedSec: number): boolean {
  return isActive(items.active.multiball.untilSec, elapsedSec);
}

export function canUseShield(items: ItemState, elapsedSec: number): boolean {
  return isActive(items.active.shield.untilSec, elapsedSec) && items.active.shield.remainingHits > 0;
}

export function consumeShield(items: ItemState, elapsedSec: number): boolean {
  if (!canUseShield(items, elapsedSec)) {
    return false;
  }

  items.active.shield.remainingHits = Math.max(0, items.active.shield.remainingHits - 1);
  if (items.active.shield.remainingHits <= 0) {
    items.active.shield.untilSec = elapsedSec;
  }
  return true;
}

export function applyItemPickup(items: ItemState, type: ItemType, elapsedSec: number, balls: Ball[]): void {
  if (type === "paddle_plus") {
    items.active.paddlePlus.untilSec = extendUntil(
      items.active.paddlePlus.untilSec,
      elapsedSec,
      ITEM_CONFIG.paddle_plus.durationSec,
    );
    return;
  }

  if (type === "slow_ball") {
    items.active.slowBall.untilSec = extendUntil(
      items.active.slowBall.untilSec,
      elapsedSec,
      ITEM_CONFIG.slow_ball.durationSec,
    );
    for (const ball of balls) {
      ball.vel.x *= ITEM_BALANCE.slowBallInstantSpeedScale;
      ball.vel.y *= ITEM_BALANCE.slowBallInstantSpeedScale;
      ball.speed *= ITEM_BALANCE.slowBallInstantSpeedScale;
    }
    return;
  }

  if (type === "multiball") {
    items.active.multiball.untilSec = extendUntil(
      items.active.multiball.untilSec,
      elapsedSec,
      ITEM_CONFIG.multiball.durationSec,
    );
    return;
  }

  items.active.shield.untilSec = extendUntil(
    items.active.shield.untilSec,
    elapsedSec,
    ITEM_CONFIG.shield.durationSec,
  );
  items.active.shield.remainingHits = 1;
}

export function spawnDropsFromBrickEvents(
  items: ItemState,
  events: CollisionEvent[],
  random: RandomSource,
): void {
  for (const event of events) {
    if (event.kind !== "brick") {
      continue;
    }

    if (items.falling.length >= DROP_CONFIG.maxFalling) {
      return;
    }

    if (random.next() >= DROP_CONFIG.chance) {
      continue;
    }

    items.falling.push({
      id: items.nextId,
      type: pickWeightedItem(random),
      pos: { x: event.x, y: event.y },
      speed: DROP_CONFIG.fallSpeed,
      size: ITEM_SIZE,
    });
    items.nextId += 1;
  }
}

export function updateFallingItems(
  items: ItemState,
  paddle: Paddle,
  worldHeight: number,
  deltaSec: number,
): ItemType[] {
  if (items.falling.length === 0) {
    return [];
  }

  const picked: ItemType[] = [];
  const next: FallingItem[] = [];

  for (const drop of items.falling) {
    drop.pos.y += drop.speed * deltaSec;

    if (intersectsPaddle(drop, paddle)) {
      picked.push(drop.type);
      continue;
    }

    if (drop.pos.y - drop.size / 2 > worldHeight) {
      continue;
    }

    next.push(drop);
  }

  items.falling = next;
  return picked;
}

export function ensureMultiballCount(
  items: ItemState,
  elapsedSec: number,
  balls: Ball[],
  random: RandomSource,
): Ball[] {
  if (!isMultiballActive(items, elapsedSec)) {
    return balls;
  }

  if (balls.length === 0) {
    return balls;
  }

  if (balls.length >= ITEM_BALANCE.multiballMaxBalls) {
    return balls;
  }

  const source = balls[0];
  const currentSpeed = Math.hypot(source.vel.x, source.vel.y) || source.speed;
  const spread = Math.max(40, currentSpeed * 0.26);
  const dir = random.next() > 0.5 ? 1 : -1;
  const nextVX = source.vel.x * -1 + spread * dir;
  const nextVY = source.vel.y;

  const cloned: Ball = {
    pos: { x: source.pos.x, y: source.pos.y },
    vel: { x: nextVX, y: nextVY },
    radius: source.radius,
    speed: currentSpeed,
  };

  return [...balls, cloned];
}

export function trimBallsWhenMultiballEnds(items: ItemState, elapsedSec: number, balls: Ball[]): Ball[] {
  if (isMultiballActive(items, elapsedSec)) {
    return balls;
  }

  if (balls.length <= 1) {
    return balls;
  }

  return [balls[0]];
}

export function getActiveItemLabels(items: ItemState, elapsedSec: number): string[] {
  const labels: string[] = [];

  if (isActive(items.active.paddlePlus.untilSec, elapsedSec)) {
    labels.push(
      `${ITEM_CONFIG.paddle_plus.label} ${formatRemain(items.active.paddlePlus.untilSec, elapsedSec)}`,
    );
  }
  if (isActive(items.active.slowBall.untilSec, elapsedSec)) {
    labels.push(`${ITEM_CONFIG.slow_ball.label} ${formatRemain(items.active.slowBall.untilSec, elapsedSec)}`);
  }
  if (isActive(items.active.multiball.untilSec, elapsedSec)) {
    labels.push(
      `${ITEM_CONFIG.multiball.label} ${formatRemain(items.active.multiball.untilSec, elapsedSec)}`,
    );
  }
  if (isActive(items.active.shield.untilSec, elapsedSec) && items.active.shield.remainingHits > 0) {
    labels.push(`${ITEM_CONFIG.shield.label} x${items.active.shield.remainingHits}`);
  }

  return labels;
}

function intersectsPaddle(item: FallingItem, paddle: Paddle): boolean {
  const half = item.size / 2;
  const left = item.pos.x - half;
  const right = item.pos.x + half;
  const top = item.pos.y - half;
  const bottom = item.pos.y + half;

  return !(
    right < paddle.x ||
    left > paddle.x + paddle.width ||
    bottom < paddle.y ||
    top > paddle.y + paddle.height
  );
}

function pickWeightedItem(random: RandomSource): ItemType {
  const value = random.next();
  let acc = 0;
  const weighted: ItemType[] = ["paddle_plus", "slow_ball", "shield", "multiball"];

  for (const type of weighted) {
    acc += ITEM_CONFIG[type].weight;
    if (value <= acc) {
      return type;
    }
  }

  return "multiball";
}

function formatRemain(untilSec: number, elapsedSec: number): string {
  const remain = Math.max(0, untilSec - elapsedSec);
  return `${remain.toFixed(1)}s`;
}
