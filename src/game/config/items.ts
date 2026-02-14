import { validateItemConfig } from "../configSchema";
import type { ItemType } from "../types";
import { DEFAULT_MULTIBALL_MAX_BALLS } from "./gameplay";

export interface ItemRule {
  type: ItemType;
  weight: number;
  label: string;
}

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
}

export const ITEM_CONFIG: Record<ItemType, ItemRule> = {
  paddle_plus: {
    type: "paddle_plus",
    weight: 1 / 6,
    label: "パドル+",
  },
  slow_ball: {
    type: "slow_ball",
    weight: 1 / 6,
    label: "スロー",
  },
  shield: {
    type: "shield",
    weight: 1 / 6,
    label: "シールド",
  },
  multiball: {
    type: "multiball",
    weight: 1 / 6,
    label: "マルチ",
  },
  pierce: {
    type: "pierce",
    weight: 1 / 6,
    label: "貫通",
  },
  bomb: {
    type: "bomb",
    weight: 1 / 6,
    label: "ボム",
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
};

export const DROP_CONFIG: DropConfig = {
  chance: 0.18,
  maxFalling: 3,
  fallSpeed: 160,
};

validateItemConfig(ITEM_CONFIG);
