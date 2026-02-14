import { DROP_CONFIG } from "./config";
import {
  applyItemPickupFromRegistry,
  createItemModifiers,
  createItemStacks,
  getActiveItemLabelsFromRegistry,
  pickWeightedItemType,
} from "./itemRegistry";
import type {
  Ball,
  CollisionEvent,
  FallingItem,
  ItemState,
  ItemType,
  Paddle,
  PickedItem,
  RandomSource,
} from "./types";

const ITEM_SIZE = 16;

export function createItemState(): ItemState {
  return {
    falling: [],
    nextId: 1,
    active: createItemStacks(),
  };
}

export function clearActiveItemEffects(items: ItemState): void {
  items.active = createItemStacks();
}

export function cloneActiveItemState(active: ItemState["active"]): ItemState["active"] {
  return {
    paddlePlusStacks: active.paddlePlusStacks,
    slowBallStacks: active.slowBallStacks,
    multiballStacks: active.multiballStacks,
    shieldCharges: active.shieldCharges,
    pierceStacks: active.pierceStacks,
    bombStacks: active.bombStacks,
  };
}

export function getPaddleScale(items: ItemState): number {
  return createItemModifiers(items.active).paddleScale;
}

export function getSlowBallMaxSpeedScale(items: ItemState): number {
  return createItemModifiers(items.active).maxSpeedScale;
}

export function getTargetBallCount(items: ItemState, multiballMaxBalls: number): number {
  return createItemModifiers(items.active, multiballMaxBalls).targetBallCount;
}

export function getPierceDepth(items: ItemState): number {
  return createItemModifiers(items.active).pierceDepth;
}

export function getBombRadiusTiles(items: ItemState): number {
  return createItemModifiers(items.active).bombRadiusTiles;
}

export function canUseShield(items: ItemState): boolean {
  return items.active.shieldCharges > 0;
}

export function consumeShield(items: ItemState): boolean {
  if (!canUseShield(items)) {
    return false;
  }

  items.active.shieldCharges -= 1;
  return true;
}

export function applyItemPickup(items: ItemState, type: ItemType, balls: Ball[]): void {
  applyItemPickupFromRegistry(items, type, balls);
}

export function spawnDropsFromBrickEvents(
  items: ItemState,
  events: CollisionEvent[],
  random: RandomSource,
): void {
  const excludedTypes: ItemType[] = [];
  if (items.active.bombStacks >= 1) {
    excludedTypes.push("bomb");
  }
  if (items.active.pierceStacks >= 1) {
    excludedTypes.push("pierce");
  }
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
      type: pickWeightedItemType(random, excludedTypes),
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
): PickedItem[] {
  if (items.falling.length === 0) {
    return [];
  }

  const picked: PickedItem[] = [];
  const next: FallingItem[] = [];

  for (const drop of items.falling) {
    drop.pos.y += drop.speed * deltaSec;

    if (intersectsPaddle(drop, paddle)) {
      picked.push({
        type: drop.type,
        pos: { x: drop.pos.x, y: drop.pos.y },
      });
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
  balls: Ball[],
  random: RandomSource,
  multiballMaxBalls: number,
): Ball[] {
  const target = getTargetBallCount(items, multiballMaxBalls);
  if (balls.length === 0) {
    return balls;
  }

  if (balls.length > target) {
    return balls.slice(0, target);
  }

  let next = balls;
  while (next.length < target) {
    const source = next[next.length - 1] ?? next[0];
    const currentSpeed = Math.hypot(source.vel.x, source.vel.y) || source.speed;
    const spread = Math.max(40, currentSpeed * 0.26);
    const dir = random.next() > 0.5 ? 1 : -1;
    next = [
      ...next,
      {
        pos: { x: source.pos.x, y: source.pos.y },
        vel: { x: source.vel.x * -1 + spread * dir, y: source.vel.y },
        radius: source.radius,
        speed: currentSpeed,
      },
    ];
  }

  return next;
}

export function getActiveItemLabels(items: ItemState): string[] {
  return getActiveItemLabelsFromRegistry(items.active);
}

export function syncMultiballStacksWithBallCount(items: ItemState, balls: Ball[]): void {
  items.active.multiballStacks = Math.max(0, balls.length - 1);
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
