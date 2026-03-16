import { ITEM_BALANCE } from "./config/items";
import { ITEM_ORDER, ITEM_REGISTRY } from "./itemRegistryData";
import type {
  ItemDefinition,
  ItemModifierBundle,
  ItemPickupImpact,
  ItemPickupPresentation,
  ItemPickupSfxEvent,
  ItemRegistry,
  ItemStackState,
} from "./itemTypes";
import type { Ball, GameState, ItemState, ItemType, RandomSource, StagePreviewTag } from "./types";

export { ITEM_ORDER, ITEM_REGISTRY } from "./itemRegistryData";

export interface ActiveItemEntry {
  type: ItemType;
  count: number;
}

export interface ItemPickupPolicyOptions {
  enableNewItemStacks?: boolean;
  gameState?:
    | Pick<GameState, "combat" | "ui">
    | {
        bricks: GameState["combat"]["bricks"];
        vfx: GameState["ui"]["vfx"];
      };
  scorePerBrick?: number;
}

const EMPTY_ITEM_STACKS: ItemStackState = {
  paddlePlusStacks: 0,
  slowBallStacks: 0,
  multiballStacks: 0,
  shieldCharges: 0,
  pierceStacks: 0,
  bombStacks: 0,
  laserStacks: 0,
  homingStacks: 0,
  railStacks: 0,
  shockwaveStacks: 0,
  pulseStacks: 0,
};

export function createItemStacks(): ItemStackState {
  return { ...EMPTY_ITEM_STACKS };
}

export function cloneItemStacks(stacks: ItemStackState): ItemStackState {
  return { ...stacks };
}

function getItemStackCount(stacks: ItemStackState, type: ItemType): number {
  return ITEM_REGISTRY[type].getLabelStack(stacks);
}

function setItemStackCount(stacks: ItemStackState, type: ItemType, count: number): void {
  const definition = ITEM_REGISTRY[type];
  stacks[definition.stackKey] = count;
}

export function applyItemPickupFromRegistry(
  state: ItemState,
  type: ItemType,
  balls: Ball[],
  options: ItemPickupPolicyOptions = {},
): ItemPickupImpact {
  const definition = ITEM_REGISTRY[type];
  if (options.enableNewItemStacks === false && definition.respectsNewStackSetting) {
    setItemStackCount(state.active, type, Math.min(1, definition.maxStacks));
    return {};
  }
  return (
    definition.applyPickup({
      stacks: state.active,
      balls,
      state: options.gameState,
      scorePerBrick: options.scorePerBrick,
    }) ?? {}
  );
}

export function createItemModifiers(
  stacks: ItemStackState,
  multiballMaxBalls = ITEM_BALANCE.multiballMaxBalls,
): ItemModifierBundle {
  const paddleScale = 1 + ITEM_BALANCE.paddlePlusScalePerStack * stacks.paddlePlusStacks;
  const maxSpeedScale =
    stacks.slowBallStacks <= 0
      ? 1
      : Math.max(
          ITEM_BALANCE.slowBallMinScale,
          ITEM_BALANCE.slowBallMaxSpeedScalePerStack ** stacks.slowBallStacks,
        );
  const synergyPierceBonus =
    stacks.pierceStacks > 0 && stacks.slowBallStacks > 0 ? ITEM_BALANCE.pierceSlowBonusDepth : 0;
  const homingLevel = Math.min(2, stacks.homingStacks);
  const railLevel = Math.min(2, stacks.railStacks);

  return {
    paddleScale,
    maxSpeedScale,
    targetBallCount: Math.min(1 + stacks.multiballStacks, multiballMaxBalls),
    pierceDepth:
      Math.min(1, stacks.pierceStacks) * ITEM_BALANCE.pierceDepthPerStack + synergyPierceBonus,
    bombRadiusTiles: stacks.bombStacks,
    explodeOnHit: stacks.bombStacks > 0,
    shieldCharges: stacks.shieldCharges,
    laserLevel: Math.min(2, stacks.laserStacks),
    homingStrength: (ITEM_BALANCE.homingMaxStrength * homingLevel) / 2,
    railLevel,
  };
}

export function getActiveItemEntriesFromRegistry(stacks: ItemStackState): ActiveItemEntry[] {
  return getRegistryByHudOrder().map((definition) => ({
    type: definition.type,
    count: getItemStackCount(stacks, definition.type),
  }));
}

export function getItemColor(type: ItemType): string {
  return ITEM_REGISTRY[type].color;
}

export function getItemPickupSfxEvent(type: ItemType): ItemPickupSfxEvent {
  return ITEM_REGISTRY[type].sfxEvent;
}

export function getItemPickupPresentation(type: ItemType): ItemPickupPresentation {
  return ITEM_REGISTRY[type].presentation;
}

export function getItemCounterplayTags(type: ItemType): readonly StagePreviewTag[] {
  return ITEM_REGISTRY[type].counterplayTags;
}

export function getItemPreviewAffinity(type: ItemType): readonly StagePreviewTag[] {
  return ITEM_REGISTRY[type].previewAffinity;
}

export function getDropSuppressedTypes(stacks: ItemStackState): ItemType[] {
  const suppressed: ItemType[] = [];
  for (const definition of Object.values(ITEM_REGISTRY)) {
    if (definition.dropSuppressedWhenActive && getItemStackCount(stacks, definition.type) > 0) {
      suppressed.push(definition.type);
    }
  }
  return suppressed;
}

export function pickWeightedItemType(
  random: RandomSource,
  excludedTypes: ItemType[] = [],
): ItemType {
  const excluded = new Set(excludedTypes);
  const selectable = ITEM_ORDER.filter((type) => !excluded.has(type));
  if (selectable.length <= 0) {
    return ITEM_ORDER[ITEM_ORDER.length - 1];
  }
  const totalWeight = selectable.reduce((total, type) => total + ITEM_REGISTRY[type].weight, 0);
  const value = random.next() * totalWeight;
  let cumulative = 0;

  for (const type of selectable) {
    cumulative += ITEM_REGISTRY[type].weight;
    if (value <= cumulative) {
      return type;
    }
  }

  return selectable[selectable.length - 1];
}

export function validateItemRegistry(registry: ItemRegistry = ITEM_REGISTRY): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  let weightSum = 0;

  for (const type of ITEM_ORDER) {
    const definition: ItemDefinition | undefined = registry[type];
    if (!definition) {
      issues.push(`missing definition: ${type}`);
      continue;
    }
    if (definition.type !== type) {
      issues.push(`type mismatch: ${type}`);
    }
    if (definition.weight <= 0) {
      issues.push(`invalid weight: ${type}`);
    }
    if (!Number.isFinite(definition.hudOrder)) {
      issues.push(`invalid hudOrder: ${type}`);
    }
    if (!(definition.maxStacks > 0)) {
      issues.push(`invalid maxStacks: ${type}`);
    }
    if (definition.previewAffinity.length <= 0) {
      issues.push(`missing previewAffinity: ${type}`);
    }
    if (definition.counterplayTags.length <= 0) {
      issues.push(`missing counterplayTags: ${type}`);
    }
    weightSum += definition.weight;
  }

  if (Math.abs(weightSum - 1) > 0.001) {
    issues.push(`weight sum must be 1, got ${weightSum}`);
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

function getRegistryByHudOrder(): ItemDefinition[] {
  return Object.values(ITEM_REGISTRY).sort((a, b) => a.hudOrder - b.hudOrder);
}
