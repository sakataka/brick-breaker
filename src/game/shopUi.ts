import { getShopPurchaseCost } from "./config";
import { ITEM_REGISTRY } from "./itemRegistry";
import type { GameState } from "./types";

export interface ShopUiView {
  visible: boolean;
  status: string;
  currentCostText: string;
  priceBandText: string;
  optionALabel: string;
  optionBLabel: string;
  optionADisabled: boolean;
  optionBDisabled: boolean;
}

const HIDDEN_VIEW: ShopUiView = {
  visible: false,
  status: "ショップ",
  currentCostText: "0点",
  priceBandText: "",
  optionALabel: "選択肢A",
  optionBLabel: "選択肢B",
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
  const optionA = ITEM_REGISTRY[offer[0]];
  const optionB = ITEM_REGISTRY[offer[1]];
  const status = state.shop.usedThisStage ? "ショップ: このステージは購入済み" : "ショップ: 1回限定";
  const priceBandText = `価格帯: ${getPriceBandLabel(purchaseCost)}`;
  return {
    visible: true,
    status,
    currentCostText: `${purchaseCost}点`,
    priceBandText,
    optionALabel: `${optionA.emoji} ${optionA.label}`,
    optionBLabel: `${optionB.emoji} ${optionB.label}`,
    optionADisabled: !canBuy,
    optionBDisabled: !canBuy,
  };
}

function getPriceBandLabel(cost: number): string {
  if (cost < 2000) {
    return "LOW";
  }
  if (cost < 4000) {
    return "MID";
  }
  return "HIGH";
}
