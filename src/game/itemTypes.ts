import type {
  Ball,
  CollisionEvent,
  GameState,
  ItemType,
  RandomSource,
  StagePreviewTag,
} from "./types";

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
  state?:
    | Pick<GameState, "combat" | "ui">
    | {
        bricks: GameState["combat"]["bricks"];
        vfx: GameState["ui"]["vfx"];
      };
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
  icon: string;
  color: string;
  weight: number;
  maxStacks: number;
  dropSuppressedWhenActive: boolean;
  hudOrder: number;
  startSettingsVisibleOrder: number;
  roleTag: "attack" | "defense" | "control";
  encounterBias?: "midboss" | "boss" | "any";
  synergyTags: readonly ("offense" | "control" | "survival" | "boss_break")[];
  counterplayTags: readonly StagePreviewTag[];
  previewAffinity: readonly StagePreviewTag[];
  sfxEvent: ItemPickupSfxEvent;
  presentation: ItemPickupPresentation;
  respectsNewStackSetting?: boolean;
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
