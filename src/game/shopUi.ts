import { getShopPurchaseCost } from "./config";
import type { GameState, ItemType } from "./types";

export interface ShopUiView {
  visible: boolean;
  status: "hidden" | "one_time" | "purchased";
  cost: number;
  priceBandVisible: boolean;
  optionAType: ItemType | null;
  optionBType: ItemType | null;
  optionADisabled: boolean;
  optionBDisabled: boolean;
}

const HIDDEN_VIEW: ShopUiView = {
  visible: false,
  status: "hidden",
  cost: 0,
  priceBandVisible: false,
  optionAType: null,
  optionBType: null,
  optionADisabled: true,
  optionBDisabled: true,
};

export function buildShopUiView(state: GameState): ShopUiView {
  if (state.scene !== "playing") {
    return HIDDEN_VIEW;
  }
  const offer = state.shop.lastOffer;
  if (!offer) {
    return HIDDEN_VIEW;
  }
  const purchaseCost = getShopPurchaseCost(state.shop.purchaseCount);
  const canBuy = !state.shop.usedThisStage && state.score >= purchaseCost;
  const status = state.shop.usedThisStage ? "purchased" : "one_time";
  return {
    visible: true,
    status,
    cost: purchaseCost,
    priceBandVisible: true,
    optionAType: offer[0],
    optionBType: offer[1],
    optionADisabled: !canBuy,
    optionBDisabled: !canBuy,
  };
}
