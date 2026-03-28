import type { ItemType, ScoreFocus } from "./types";

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

export function createHiddenShopView(): ShopUiView {
  return {
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
}
