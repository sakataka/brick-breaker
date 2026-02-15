import { DROP_CONFIG } from "./config";
import {
  applyItemPickupFromRegistry,
  createItemModifiers,
  createItemStacks,
  getActiveItemLabelsFromRegistry,
  getDropSuppressedTypes,
  pickWeightedItemType,
} from "./itemRegistry";
import type {
  Ball,
  CollisionEvent,
  DebugItemPreset,
  FallingItem,
  ItemState,
  ItemType,
  Paddle,
  PickedItem,
  RandomSource,
} from "./types";

const ITEM_SIZE = 16;
const NEW_STACK_ITEM_TYPES = new Set<ItemType>(["laser", "sticky"]);

export interface ItemPickupOptions {
  enableNewItemStacks?: boolean;
}

export interface DropOptions {
  stickyItemEnabled?: boolean;
}

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
    laserStacks: active.laserStacks,
    stickyStacks: active.stickyStacks,
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

export function getLaserLevel(items: ItemState): number {
  return createItemModifiers(items.active).laserLevel;
}

export function isStickyEnabled(items: ItemState): boolean {
  return createItemModifiers(items.active).stickyEnabled;
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

export function applyItemPickup(
  items: ItemState,
  type: ItemType,
  balls: Ball[],
  options: ItemPickupOptions = {},
): void {
  if (options.enableNewItemStacks === false && NEW_STACK_ITEM_TYPES.has(type)) {
    if (type === "laser") {
      items.active.laserStacks = 1;
      return;
    }
    if (type === "sticky") {
      items.active.stickyStacks = 1;
      return;
    }
  }
  applyItemPickupFromRegistry(items, type, balls);
}

export function applyDebugItemPreset(
  items: ItemState,
  preset: DebugItemPreset,
  enableNewItemStacks: boolean,
  stickyItemEnabled = true,
): void {
  items.active = createItemStacks();
  if (preset === "none") {
    return;
  }
  if (preset === "combat_check") {
    items.active.paddlePlusStacks = 1;
    items.active.slowBallStacks = 1;
    items.active.multiballStacks = 1;
    items.active.shieldCharges = 1;
    return;
  }

  items.active.shieldCharges = 2;
  items.active.pierceStacks = 1;
  items.active.bombStacks = 1;
  items.active.laserStacks = enableNewItemStacks ? 2 : 1;
  items.active.stickyStacks = stickyItemEnabled ? 1 : 0;
}

export function spawnDropsFromBrickEvents(
  items: ItemState,
  events: CollisionEvent[],
  random: RandomSource,
  options: DropOptions = {},
): void {
  const excludedTypes: ItemType[] = getDropSuppressedTypes(items.active);
  if (options.stickyItemEnabled === false) {
    excludedTypes.push("sticky");
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

export function spawnGuaranteedDrop(
  items: ItemState,
  random: RandomSource,
  x: number,
  y: number,
  options: DropOptions = {},
): boolean {
  if (items.falling.length >= DROP_CONFIG.maxFalling) {
    return false;
  }
  const excludedTypes: ItemType[] = getDropSuppressedTypes(items.active);
  if (options.stickyItemEnabled === false) {
    excludedTypes.push("sticky");
  }
  items.falling.push({
    id: items.nextId,
    type: pickWeightedItemType(random, excludedTypes),
    pos: { x, y },
    speed: DROP_CONFIG.fallSpeed,
    size: ITEM_SIZE,
  });
  items.nextId += 1;
  return true;
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
        lastDamageBrickId: undefined,
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
