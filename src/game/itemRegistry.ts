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

export interface ActiveItemEntry {
  type: ItemType;
  count: number;
  emoji: string;
}

const ITEM_TYPE_ORDER = [
  "paddle_plus",
  "slow_ball",
  "shield",
  "multiball",
  "pierce",
  "bomb",
  "laser",
  "homing",
  "rail",
  "sticky",
] as const;
const ITEM_ORDER: ItemType[] = [...ITEM_TYPE_ORDER];

export const ITEM_REGISTRY: ItemRegistry = {
  paddle_plus: {
    type: "paddle_plus",
    label: ITEM_CONFIG.paddle_plus.label,
    hudLabel: "🟦幅増加",
    emoji: "🟦",
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
    hudLabel: "🐢スロー",
    emoji: "🐢",
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
    hudLabel: "🛡シールド",
    emoji: "🛡",
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
    hudLabel: "🎱マルチ",
    emoji: "🎱",
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
    emoji: "🗡",
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
    hudLabel: "💣ボム",
    emoji: "💣",
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
  laser: {
    type: "laser",
    label: ITEM_CONFIG.laser.label,
    hudLabel: "🔫レーザー",
    emoji: "🔫",
    description: "自動でレーザーを発射",
    shortLabel: "砲",
    color: "rgba(255, 122, 122, 0.88)",
    weight: ITEM_CONFIG.laser.weight,
    maxStacks: 2,
    dropSuppressedWhenActive: false,
    hudOrder: 7,
    sfxEvent: "item_laser",
    applyPickup: ({ stacks }) => {
      stacks.laserStacks = Math.min(2, stacks.laserStacks + 1);
    },
    getLabelStack: (stacks) => stacks.laserStacks,
  },
  homing: {
    type: "homing",
    label: ITEM_CONFIG.homing.label,
    hudLabel: "🛰ホーミング",
    emoji: "🛰",
    description: "ボール軌道を近くのブロックへ補正",
    shortLabel: "追",
    color: "rgba(136, 197, 255, 0.88)",
    weight: ITEM_CONFIG.homing.weight,
    maxStacks: 2,
    dropSuppressedWhenActive: false,
    hudOrder: 8,
    sfxEvent: "item_homing",
    applyPickup: ({ stacks }) => {
      stacks.homingStacks = Math.min(2, stacks.homingStacks + 1);
    },
    getLabelStack: (stacks) => stacks.homingStacks,
  },
  rail: {
    type: "rail",
    label: ITEM_CONFIG.rail.label,
    hudLabel: "⚡レール",
    emoji: "⚡",
    description: "レーザーが複数のブロックを貫く",
    shortLabel: "線",
    color: "rgba(255, 206, 128, 0.9)",
    weight: ITEM_CONFIG.rail.weight,
    maxStacks: 2,
    dropSuppressedWhenActive: false,
    hudOrder: 9,
    sfxEvent: "item_rail",
    applyPickup: ({ stacks }) => {
      stacks.railStacks = Math.min(2, stacks.railStacks + 1);
    },
    getLabelStack: (stacks) => stacks.railStacks,
  },
  sticky: {
    type: "sticky",
    label: ITEM_CONFIG.sticky.label,
    hudLabel: "🧲スティッキー",
    emoji: "🧲",
    description: "ボールを一時保持して自動発射",
    shortLabel: "粘",
    color: "rgba(161, 255, 151, 0.86)",
    weight: ITEM_CONFIG.sticky.weight,
    maxStacks: 1,
    dropSuppressedWhenActive: false,
    hudOrder: 10,
    sfxEvent: "item_sticky",
    applyPickup: ({ stacks }) => {
      stacks.stickyStacks = 1;
    },
    getLabelStack: (stacks) => stacks.stickyStacks,
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
    laserStacks: 0,
    stickyStacks: 0,
    homingStacks: 0,
    railStacks: 0,
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
  const homingLevel = Math.min(2, stacks.homingStacks);
  const railLevel = Math.min(2, stacks.railStacks);

  return {
    paddleScale,
    maxSpeedScale,
    targetBallCount: Math.min(1 + stacks.multiballStacks, multiballMaxBalls),
    pierceDepth: Math.min(1, stacks.pierceStacks) * ITEM_BALANCE.pierceDepthPerStack + synergyPierceBonus,
    bombRadiusTiles: stacks.bombStacks,
    explodeOnHit: stacks.bombStacks > 0,
    shieldCharges: stacks.shieldCharges,
    laserLevel: Math.min(2, stacks.laserStacks),
    stickyEnabled: stacks.stickyStacks > 0,
    homingStrength: (ITEM_BALANCE.homingMaxStrength * homingLevel) / 2,
    railLevel,
  };
}

export function getActiveItemEntriesFromRegistry(stacks: ItemStackState): ActiveItemEntry[] {
  const labels: ActiveItemEntry[] = [];
  for (const definition of getRegistryByHudOrder()) {
    const count = getStackCount(stacks, definition.type);
    labels.push({
      type: definition.type,
      count,
      emoji: definition.emoji,
    });
  }
  return labels;
}

export function getItemEmoji(type: ItemType): string {
  return ITEM_REGISTRY[type].emoji;
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
    .with("laser", () => stacks.laserStacks)
    .with("homing", () => stacks.homingStacks)
    .with("rail", () => stacks.railStacks)
    .with("sticky", () => stacks.stickyStacks)
    .exhaustive();
}
