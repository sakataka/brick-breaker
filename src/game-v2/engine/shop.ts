import { ITEM_ORDER, ITEM_REGISTRY } from "../public/items";
import type { GameState, ItemType } from "../public/types";

export function buildShopOffer(stageNumber: number): readonly [ItemType, ItemType] {
  const startIndex = ((stageNumber - 1) * 2) % ITEM_ORDER.length;
  return [ITEM_ORDER[startIndex], ITEM_ORDER[(startIndex + 3) % ITEM_ORDER.length]];
}

export function applyShopSelection(state: GameState, index: 0 | 1): ItemType | null {
  const offer = state.encounter.shop.lastOffer;
  if (!offer || state.encounter.shop.purchased) {
    return null;
  }
  const type = offer.options[index];
  state.encounter.shop.purchased = true;
  const existing = state.run.activeItems.find((item) => item.type === type);
  if (existing) {
    existing.count += 1;
  } else {
    state.run.activeItems.push({ type, count: 1 });
  }
  state.run.score = Math.max(0, state.run.score - offer.cost);
  state.ui.pickupToast = {
    type,
    color: ITEM_REGISTRY[type].color,
    progress: 1,
  };
  return type;
}
