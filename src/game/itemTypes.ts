import type { Ball, ItemType, RandomSource } from "./types";

export interface ItemStackState {
  paddlePlusStacks: number;
  slowBallStacks: number;
  multiballStacks: number;
  shieldCharges: number;
  pierceStacks: number;
  bombStacks: number;
  laserStacks: number;
  stickyStacks: number;
}

export interface ItemEffectContext {
  stacks: ItemStackState;
  balls: Ball[];
}

export interface ItemModifierBundle {
  paddleScale: number;
  maxSpeedScale: number;
  targetBallCount: number;
  pierceDepth: number;
  bombRadiusTiles: number;
  explodeOnHit: boolean;
  shieldCharges: number;
  laserLevel: number;
  stickyEnabled: boolean;
}

export interface ItemDefinition {
  type: ItemType;
  label: string;
  hudLabel: string;
  emoji: string;
  description: string;
  shortLabel: string;
  color: string;
  weight: number;
  maxStacks: number;
  dropSuppressedWhenActive: boolean;
  hudOrder: number;
  sfxEvent: ItemPickupSfxEvent;
  applyPickup: (context: ItemEffectContext) => void;
  getLabelStack: (stacks: ItemStackState) => number;
}

export type ItemRegistry = Record<ItemType, ItemDefinition>;

export interface ItemWeightEntry {
  type: ItemType;
  weight: number;
}

export interface ItemWeightPicker {
  weighted: ItemWeightEntry[];
  pick: (random: RandomSource) => ItemType;
}

export type ItemPickupSfxEvent =
  | "item_paddle_plus"
  | "item_slow_ball"
  | "item_multiball"
  | "item_shield"
  | "item_pierce"
  | "item_bomb"
  | "item_laser"
  | "item_sticky";
