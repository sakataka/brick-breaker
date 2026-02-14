import { match } from "ts-pattern";
import { ITEM_BALANCE, ITEM_CONFIG } from "./config";
import type {
  ItemDefinition,
  ItemModifierBundle,
  ItemPickupSfxEvent,
  ItemRegistry,
  ItemStackState,
} from "./itemTypes";
import type { Ball, ItemState, ItemType, RandomSource } from "./types";

const ITEM_TYPE_ORDER = ["paddle_plus", "slow_ball", "shield", "multiball", "pierce", "bomb"] as const;
const ITEM_ORDER: ItemType[] = [...ITEM_TYPE_ORDER];

export const ITEM_REGISTRY: ItemRegistry = {
  paddle_plus: {
    type: "paddle_plus",
    label: ITEM_CONFIG.paddle_plus.label,
    hudLabel: "🟦パドル(幅)",
    description: "パドル幅を増やす",
    shortLabel: "幅",
    color: "rgba(104, 216, 255, 0.8)",
    weight: ITEM_CONFIG.paddle_plus.weight,
    maxStacks: Number.POSITIVE_INFINITY,
    dropSuppressedWhenActive: false,
    hudOrder: 1,
    sfxEvent: "item_paddle_plus",
    applyPickup: ({ stacks }) => {
      stacks.paddlePlusStacks += 1;
    },
    getLabelStack: (stacks) => stacks.paddlePlusStacks,
  },
  slow_ball: {
    type: "slow_ball",
    label: ITEM_CONFIG.slow_ball.label,
    hudLabel: "🐢スロー(減速)",
    description: "ボール速度を下げる",
    shortLabel: "遅",
    color: "rgba(255, 191, 112, 0.85)",
    weight: ITEM_CONFIG.slow_ball.weight,
    maxStacks: Number.POSITIVE_INFINITY,
    dropSuppressedWhenActive: false,
    hudOrder: 2,
    sfxEvent: "item_slow_ball",
    applyPickup: ({ stacks, balls }) => {
      stacks.slowBallStacks += 1;
      for (const ball of balls) {
        ball.vel.x *= ITEM_BALANCE.slowBallInstantSpeedScale;
        ball.vel.y *= ITEM_BALANCE.slowBallInstantSpeedScale;
        ball.speed *= ITEM_BALANCE.slowBallInstantSpeedScale;
      }
    },
    getLabelStack: (stacks) => stacks.slowBallStacks,
  },
  shield: {
    type: "shield",
    label: ITEM_CONFIG.shield.label,
    hudLabel: "🛡シールド(防御)",
    description: "落球を1回防ぐ",
    shortLabel: "盾",
    color: "rgba(112, 255, 210, 0.78)",
    weight: ITEM_CONFIG.shield.weight,
    maxStacks: Number.POSITIVE_INFINITY,
    dropSuppressedWhenActive: false,
    hudOrder: 3,
    sfxEvent: "item_shield",
    applyPickup: ({ stacks }) => {
      stacks.shieldCharges += 1;
    },
    getLabelStack: (stacks) => stacks.shieldCharges,
  },
  multiball: {
    type: "multiball",
    label: ITEM_CONFIG.multiball.label,
    hudLabel: "🎱マルチ(多球)",
    description: "ボール数を増やす",
    shortLabel: "多",
    color: "rgba(197, 143, 255, 0.82)",
    weight: ITEM_CONFIG.multiball.weight,
    maxStacks: Number.POSITIVE_INFINITY,
    dropSuppressedWhenActive: false,
    hudOrder: 4,
    sfxEvent: "item_multiball",
    applyPickup: ({ stacks }) => {
      stacks.multiballStacks += 1;
    },
    getLabelStack: (stacks) => stacks.multiballStacks,
  },
  pierce: {
    type: "pierce",
    label: ITEM_CONFIG.pierce.label,
    hudLabel: "🗡貫通",
    description: "ブロックを貫通する",
    shortLabel: "貫",
    color: "rgba(255, 130, 110, 0.86)",
    weight: ITEM_CONFIG.pierce.weight,
    maxStacks: 1,
    dropSuppressedWhenActive: true,
    hudOrder: 5,
    sfxEvent: "item_pierce",
    applyPickup: ({ stacks }) => {
      stacks.pierceStacks = 1;
    },
    getLabelStack: (stacks) => Math.min(1, stacks.pierceStacks),
  },
  bomb: {
    type: "bomb",
    label: ITEM_CONFIG.bomb.label,
    hudLabel: "💣ボム(爆発)",
    description: "直撃時に範囲破壊",
    shortLabel: "爆",
    color: "rgba(255, 95, 95, 0.88)",
    weight: ITEM_CONFIG.bomb.weight,
    maxStacks: 1,
    dropSuppressedWhenActive: true,
    hudOrder: 6,
    sfxEvent: "item_bomb",
    applyPickup: ({ stacks }) => {
      stacks.bombStacks = 1;
    },
    getLabelStack: (stacks) => stacks.bombStacks,
  },
};

export function createItemStacks(): ItemStackState {
  return {
    paddlePlusStacks: 0,
    slowBallStacks: 0,
    multiballStacks: 0,
    shieldCharges: 0,
    pierceStacks: 0,
    bombStacks: 0,
  };
}

export function applyItemPickupFromRegistry(state: ItemState, type: ItemType, balls: Ball[]): void {
  ITEM_REGISTRY[type].applyPickup({
    stacks: state.active,
    balls,
  });
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

  return {
    paddleScale,
    maxSpeedScale,
    targetBallCount: Math.min(1 + stacks.multiballStacks, multiballMaxBalls),
    pierceDepth: Math.min(1, stacks.pierceStacks) * ITEM_BALANCE.pierceDepthPerStack + synergyPierceBonus,
    bombRadiusTiles: stacks.bombStacks,
    explodeOnHit: stacks.bombStacks > 0,
    shieldCharges: stacks.shieldCharges,
  };
}

export function getActiveItemLabelsFromRegistry(stacks: ItemStackState): string[] {
  const labels: string[] = [];
  for (const definition of getRegistryByHudOrder()) {
    const count = getStackCount(stacks, definition.type);
    labels.push(`${definition.hudLabel}×${count}`);
  }
  return labels;
}

export function getItemShortLabel(type: ItemType): string {
  return ITEM_REGISTRY[type].shortLabel;
}

export function getItemColor(type: ItemType): string {
  return ITEM_REGISTRY[type].color;
}

export function getItemPickupSfxEvent(type: ItemType): ItemPickupSfxEvent {
  return ITEM_REGISTRY[type].sfxEvent;
}

export function getDropSuppressedTypes(stacks: ItemStackState): ItemType[] {
  const suppressed: ItemType[] = [];
  for (const definition of Object.values(ITEM_REGISTRY)) {
    if (!definition.dropSuppressedWhenActive) {
      continue;
    }
    if (definition.getLabelStack(stacks) > 0) {
      suppressed.push(definition.type);
    }
  }
  return suppressed;
}

export function pickWeightedItemType(random: RandomSource, excludedTypes: ItemType[] = []): ItemType {
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

function getStackCount(stacks: ItemStackState, type: ItemType): number {
  return match(type)
    .with("paddle_plus", () => stacks.paddlePlusStacks)
    .with("slow_ball", () => stacks.slowBallStacks)
    .with("multiball", () => stacks.multiballStacks)
    .with("shield", () => stacks.shieldCharges)
    .with("pierce", () => Math.min(1, stacks.pierceStacks))
    .with("bomb", () => stacks.bombStacks)
    .exhaustive();
}
