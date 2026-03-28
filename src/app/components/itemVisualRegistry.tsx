import { ITEM_REGISTRY } from "../../game-v2/public/items";
import type { ItemType } from "../../game-v2/public/types";
import type { AppIconName } from "./AppIcon";

export interface ItemVisualSpec {
  type: ItemType;
  icon: AppIconName;
  accent: string;
  tone: "attack" | "defense" | "control";
  emphasis: "default" | "midboss" | "boss";
}

export function getItemVisualSpec(type: ItemType): ItemVisualSpec {
  const item = ITEM_REGISTRY[type];
  return {
    type,
    icon: type,
    accent: item.color,
    tone: item.roleTag,
    emphasis:
      item.encounterBias === "boss"
        ? "boss"
        : item.encounterBias === "midboss"
          ? "midboss"
          : "default",
  };
}
