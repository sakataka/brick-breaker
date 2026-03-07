import { ITEM_BALANCE, ITEM_CONFIG } from "./config";
import type { ItemRegistry } from "./itemTypes";
import type { ItemType } from "./types";

export const ITEM_TYPE_ORDER = [
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

export const ITEM_ORDER: ItemType[] = [...ITEM_TYPE_ORDER];

export const ITEM_REGISTRY: ItemRegistry = {
  paddle_plus: {
    type: "paddle_plus",
    stackKey: "paddlePlusStacks",
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
    debugPresetStacks: { combat_check: 1 },
    applyPickup: ({ stacks }) => {
      stacks.paddlePlusStacks += 1;
    },
    getLabelStack: (stacks) => stacks.paddlePlusStacks,
  },
  slow_ball: {
    type: "slow_ball",
    stackKey: "slowBallStacks",
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
    debugPresetStacks: { combat_check: 1 },
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
    stackKey: "shieldCharges",
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
    debugPresetStacks: { combat_check: 1, boss_check: 2 },
    applyPickup: ({ stacks }) => {
      stacks.shieldCharges += 1;
    },
    getLabelStack: (stacks) => stacks.shieldCharges,
  },
  multiball: {
    type: "multiball",
    stackKey: "multiballStacks",
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
    debugPresetStacks: { combat_check: 1 },
    applyPickup: ({ stacks }) => {
      stacks.multiballStacks += 1;
    },
    getLabelStack: (stacks) => stacks.multiballStacks,
  },
  pierce: {
    type: "pierce",
    stackKey: "pierceStacks",
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
    debugPresetStacks: { boss_check: 1 },
    applyPickup: ({ stacks }) => {
      stacks.pierceStacks = 1;
    },
    getLabelStack: (stacks) => Math.min(1, stacks.pierceStacks),
  },
  bomb: {
    type: "bomb",
    stackKey: "bombStacks",
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
    debugPresetStacks: { boss_check: 1 },
    applyPickup: ({ stacks }) => {
      stacks.bombStacks = 1;
    },
    getLabelStack: (stacks) => stacks.bombStacks,
  },
  laser: {
    type: "laser",
    stackKey: "laserStacks",
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
    respectsNewStackSetting: true,
    debugPresetStacks: { boss_check: 2 },
    applyPickup: ({ stacks }) => {
      stacks.laserStacks = Math.min(2, stacks.laserStacks + 1);
    },
    getLabelStack: (stacks) => stacks.laserStacks,
  },
  homing: {
    type: "homing",
    stackKey: "homingStacks",
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
    respectsNewStackSetting: true,
    debugPresetStacks: { boss_check: 2 },
    applyPickup: ({ stacks }) => {
      stacks.homingStacks = Math.min(2, stacks.homingStacks + 1);
    },
    getLabelStack: (stacks) => stacks.homingStacks,
  },
  rail: {
    type: "rail",
    stackKey: "railStacks",
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
    respectsNewStackSetting: true,
    debugPresetStacks: { boss_check: 2 },
    applyPickup: ({ stacks }) => {
      stacks.railStacks = Math.min(2, stacks.railStacks + 1);
    },
    getLabelStack: (stacks) => stacks.railStacks,
  },
  sticky: {
    type: "sticky",
    stackKey: "stickyStacks",
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
    respectsNewStackSetting: true,
    debugPresetStacks: { boss_check: 1 },
    applyPickup: ({ stacks }) => {
      stacks.stickyStacks = 1;
    },
    getLabelStack: (stacks) => stacks.stickyStacks,
  },
};
