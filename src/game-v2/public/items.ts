import type { ItemRoleTag, ItemType, StagePreviewTag } from "./types";

export type ItemPickupSfxEvent =
  | "item_paddle_plus"
  | "item_slow_ball"
  | "item_shield"
  | "item_multiball"
  | "item_pierce"
  | "item_bomb"
  | "item_shockwave"
  | "item_pulse"
  | "item_laser"
  | "item_homing"
  | "item_rail";

export interface PublicItemDefinition {
  type: ItemType;
  color: string;
  roleTag: ItemRoleTag;
  encounterBias?: "midboss" | "boss" | "any";
  previewAffinity: readonly StagePreviewTag[];
  counterplayTags: readonly StagePreviewTag[];
  sfxEvent: ItemPickupSfxEvent;
}

export const ITEM_ORDER: readonly ItemType[] = [
  "paddle_plus",
  "slow_ball",
  "shield",
  "multiball",
  "pierce",
  "bomb",
  "shockwave",
  "pulse",
  "laser",
  "homing",
  "rail",
] as const;

export const ITEM_REGISTRY: Record<ItemType, PublicItemDefinition> = {
  paddle_plus: {
    type: "paddle_plus",
    color: "rgba(104, 216, 255, 0.8)",
    roleTag: "control",
    previewAffinity: ["survival_check", "hazard_flux"],
    counterplayTags: ["survival_check", "hazard_flux"],
    sfxEvent: "item_paddle_plus",
  },
  slow_ball: {
    type: "slow_ball",
    color: "rgba(255, 191, 112, 0.85)",
    roleTag: "control",
    previewAffinity: ["hazard_flux", "sweep_alert"],
    counterplayTags: ["sweep_alert", "hazard_flux", "turret_lane"],
    sfxEvent: "item_slow_ball",
  },
  shield: {
    type: "shield",
    color: "rgba(112, 255, 210, 0.78)",
    roleTag: "defense",
    encounterBias: "boss",
    previewAffinity: ["survival_check", "boss_break"],
    counterplayTags: ["boss_break", "sweep_alert", "survival_check"],
    sfxEvent: "item_shield",
  },
  multiball: {
    type: "multiball",
    color: "rgba(197, 143, 255, 0.82)",
    roleTag: "attack",
    previewAffinity: ["reactor_chain", "boss_break"],
    counterplayTags: ["relay_chain", "reactor_chain"],
    sfxEvent: "item_multiball",
  },
  pierce: {
    type: "pierce",
    color: "rgba(255, 130, 110, 0.86)",
    roleTag: "attack",
    encounterBias: "boss",
    previewAffinity: ["shielded_grid", "fortress_core", "boss_break"],
    counterplayTags: ["shielded_grid", "fortress_core", "boss_break"],
    sfxEvent: "item_pierce",
  },
  bomb: {
    type: "bomb",
    color: "rgba(255, 95, 95, 0.88)",
    roleTag: "attack",
    previewAffinity: ["reactor_chain", "turret_lane"],
    counterplayTags: ["relay_chain", "reactor_chain", "turret_lane"],
    sfxEvent: "item_bomb",
  },
  shockwave: {
    type: "shockwave",
    color: "rgba(255, 214, 120, 0.84)",
    roleTag: "attack",
    previewAffinity: ["relay_chain", "gate_pressure"],
    counterplayTags: ["relay_chain", "shielded_grid"],
    sfxEvent: "item_shockwave",
  },
  pulse: {
    type: "pulse",
    color: "rgba(120, 255, 214, 0.84)",
    roleTag: "attack",
    previewAffinity: ["turret_lane", "hazard_flux"],
    counterplayTags: ["gate_pressure", "turret_lane"],
    sfxEvent: "item_pulse",
  },
  laser: {
    type: "laser",
    color: "rgba(255, 122, 122, 0.86)",
    roleTag: "attack",
    encounterBias: "midboss",
    previewAffinity: ["turret_lane", "boss_break"],
    counterplayTags: ["turret_lane", "sweep_alert"],
    sfxEvent: "item_laser",
  },
  homing: {
    type: "homing",
    color: "rgba(122, 232, 176, 0.82)",
    roleTag: "control",
    previewAffinity: ["relay_chain", "survival_check"],
    counterplayTags: ["relay_chain", "hazard_flux"],
    sfxEvent: "item_homing",
  },
  rail: {
    type: "rail",
    color: "rgba(255, 214, 122, 0.88)",
    roleTag: "attack",
    encounterBias: "boss",
    previewAffinity: ["fortress_core", "boss_break"],
    counterplayTags: ["fortress_core", "boss_break"],
    sfxEvent: "item_rail",
  },
};

export function getItemColor(type: ItemType): string {
  return ITEM_REGISTRY[type].color;
}

export function getItemPickupSfxEvent(type: ItemType): ItemPickupSfxEvent {
  return ITEM_REGISTRY[type].sfxEvent;
}
