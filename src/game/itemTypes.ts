import type { Ball, CollisionEvent, GameState, ItemType, RandomSource } from "./types";

export interface ItemStackState {
  paddlePlusStacks: number;
  slowBallStacks: number;
  multiballStacks: number;
  shieldCharges: number;
  pierceStacks: number;
  bombStacks: number;
  laserStacks: number;
  homingStacks: number;
  railStacks: number;
  shockwaveStacks: number;
  pulseStacks: number;
}

export interface ItemEffectContext {
  stacks: ItemStackState;
  balls: Ball[];
  state?: Pick<GameState, "bricks" | "vfx">;
  scorePerBrick?: number;
}

export interface ItemPickupImpact {
  scoreGain?: number;
  collisionEvents?: CollisionEvent[];
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
  homingStrength: number;
  railLevel: number;
}

export interface ItemDefinition {
  type: ItemType;
  stackKey: keyof ItemStackState;
  label: string;
  hudLabel: string;
  icon: string;
  emoji: string;
  description: string;
  shortLabel: string;
  color: string;
  weight: number;
  maxStacks: number;
  dropSuppressedWhenActive: boolean;
  hudOrder: number;
  startSettingsVisibleOrder: number;
  roleTag: "attack" | "defense" | "control";
  encounterBias?: "midboss" | "boss" | "any";
  sfxEvent: ItemPickupSfxEvent;
  presentation: ItemPickupPresentation;
  respectsNewStackSetting?: boolean;
  debugPresetStacks?: Partial<Record<"combat_check" | "boss_check", number>>;
  applyPickup: (context: ItemEffectContext) => ItemPickupImpact | undefined;
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
  | "item_homing"
  | "item_rail"
  | "item_shockwave"
  | "item_pulse";

export interface ItemPickupPresentation {
  flashMs: number;
  hitFreezeMs: number;
  shakeMs: number;
  shakePx: number;
  auraMs: number;
  toastMs: number;
}
