import { SHOP_CONFIG } from "./config";
import { ITEM_REGISTRY } from "./itemRegistry";
import type { GameState } from "./types";

export interface ShopUiView {
  visible: boolean;
  status: string;
  optionALabel: string;
  optionBLabel: string;
  optionADisabled: boolean;
  optionBDisabled: boolean;
}

const HIDDEN_VIEW: ShopUiView = {
  visible: false,
  status: "ショップ",
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
  const canBuy = !state.shop.usedThisStage && state.score >= SHOP_CONFIG.purchaseCost;
  const status = state.shop.usedThisStage
    ? "ショップ: このステージは購入済み"
    : `ショップ: 1回限定 (${SHOP_CONFIG.purchaseCost}点)`;
  return {
    visible: true,
    status,
    optionALabel: ITEM_REGISTRY[offer[0]].label,
    optionBLabel: ITEM_REGISTRY[offer[1]].label,
    optionADisabled: !canBuy,
    optionBDisabled: !canBuy,
  };
}
