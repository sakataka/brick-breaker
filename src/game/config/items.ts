import { validateItemConfig } from "../configSchema";
import type { ItemType } from "../types";
import { DEFAULT_MULTIBALL_MAX_BALLS } from "./gameplay";
import type { ItemRule } from "./types";

export interface DropConfig {
  chance: number;
  maxFalling: number;
  fallSpeed: number;
}

export interface ItemBalance {
  paddlePlusScalePerStack: number;
  slowBallMaxSpeedScalePerStack: number;
  slowBallMinScale: number;
  slowBallInstantSpeedScale: number;
  multiballMaxBalls: number;
  pierceDepthPerStack: number;
  pierceSlowBonusDepth: number;
  laserFireIntervalSecByLevel: readonly [number, number];
  laserProjectileSpeed: number;
  stickyHoldSec: number;
  stickyRecaptureCooldownSec: number;
  homingMaxStrength: number;
  homingAcceleration: number;
  railPierceHitsByLevel: readonly [number, number];
}

export const ITEM_CONFIG: Record<ItemType, ItemRule> = {
  paddle_plus: {
    type: "paddle_plus",
    weight: 0.12,
    label: "パドル+",
  },
  slow_ball: {
    type: "slow_ball",
    weight: 0.12,
    label: "スロー",
  },
  shield: {
    type: "shield",
    weight: 0.11,
    label: "シールド",
  },
  multiball: {
    type: "multiball",
    weight: 0.12,
    label: "マルチ",
  },
  pierce: {
    type: "pierce",
    weight: 0.1,
    label: "貫通",
  },
  bomb: {
    type: "bomb",
    weight: 0.09,
    label: "ボム",
  },
  laser: {
    type: "laser",
    weight: 0.1,
    label: "レーザー",
  },
  sticky: {
    type: "sticky",
    weight: 0.08,
    label: "スティッキー",
  },
  homing: {
    type: "homing",
    weight: 0.08,
    label: "ホーミング",
  },
  rail: {
    type: "rail",
    weight: 0.08,
    label: "レール",
  },
};

export const ITEM_BALANCE: ItemBalance = {
  paddlePlusScalePerStack: 0.18,
  slowBallMaxSpeedScalePerStack: 0.82,
  slowBallMinScale: 0.35,
  slowBallInstantSpeedScale: 0.9,
  multiballMaxBalls: DEFAULT_MULTIBALL_MAX_BALLS,
  pierceDepthPerStack: 4,
  pierceSlowBonusDepth: 1,
  laserFireIntervalSecByLevel: [1.2, 0.72],
  laserProjectileSpeed: 760,
  stickyHoldSec: 0.55,
  stickyRecaptureCooldownSec: 1.2,
  homingMaxStrength: 0.24,
  homingAcceleration: 320,
  railPierceHitsByLevel: [2, 4],
};

export const DROP_CONFIG: DropConfig = {
  chance: 0.18,
  maxFalling: 3,
  fallSpeed: 160,
};

validateItemConfig(ITEM_CONFIG);
