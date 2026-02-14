import type { Ball, ItemType, RandomSource } from "./types";

export interface ItemStackState {
  paddlePlusStacks: number;
  slowBallStacks: number;
  multiballStacks: number;
  shieldCharges: number;
  pierceStacks: number;
  bombStacks: number;
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
}

export interface ItemDefinition {
  type: ItemType;
  label: string;
  shortLabel: string;
  color: string;
  weight: number;
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
