import { getShopPurchaseCost } from "./config";
import { getItemCounterplayTags, getItemPreviewAffinity, ITEM_REGISTRY } from "./itemRegistry";
import { resolveUpcomingStagePreviewFromState } from "./stageContext";
import type { GameState, ItemType, ScoreFocus } from "./types";

export interface ShopOptionUiView {
  type: ItemType | null;
  role: "attack" | "defense" | "control" | null;
  previewAffinity: readonly string[];
  counterplayTags: readonly string[];
}

export interface ShopUiView {
  visible: boolean;
  status: "hidden" | "one_time" | "purchased";
  cost: number;
  priceBandVisible: boolean;
  optionAType: ItemType | null;
  optionBType: ItemType | null;
  optionADisabled: boolean;
  optionBDisabled: boolean;
  optionA: ShopOptionUiView;
  optionB: ShopOptionUiView;
  previewStageNumber: number | null;
  previewFocus: ScoreFocus | null;
  previewTags: readonly string[];
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
  optionA: { type: null, role: null, previewAffinity: [], counterplayTags: [] },
  optionB: { type: null, role: null, previewAffinity: [], counterplayTags: [] },
  previewStageNumber: null,
  previewFocus: null,
  previewTags: [],
};

export function buildShopUiView(state: GameState): ShopUiView {
  if (state.scene !== "playing") {
    return HIDDEN_VIEW;
  }
  const offer = state.encounter.shop.lastOffer;
  if (!offer) {
    return HIDDEN_VIEW;
  }
  const purchaseCost = getShopPurchaseCost(state.encounter.shop.purchaseCount);
  const canBuy = !state.encounter.shop.usedThisStage && state.run.score >= purchaseCost;
  const status = state.encounter.shop.usedThisStage ? "purchased" : "one_time";
  const upcoming = resolveUpcomingStagePreviewFromState(state);
  return {
    visible: true,
    status,
    cost: purchaseCost,
    priceBandVisible: true,
    optionAType: offer[0],
    optionBType: offer[1],
    optionADisabled: !canBuy,
    optionBDisabled: !canBuy,
    optionA: buildOptionView(offer[0]),
    optionB: buildOptionView(offer[1]),
    previewStageNumber: upcoming?.stageNumber ?? null,
    previewFocus: upcoming?.scoreFocus ?? null,
    previewTags: upcoming?.previewTags ?? [],
  };
}

function buildOptionView(type: ItemType): ShopOptionUiView {
  return {
    type,
    role: ITEM_REGISTRY[type].roleTag,
    previewAffinity: getItemPreviewAffinity(type),
    counterplayTags: getItemCounterplayTags(type),
  };
}
