import { getPublicEncounterCatalog } from "../content";
import { ITEM_REGISTRY } from "../public/items";
import { createHiddenShopView, type ShopUiView } from "../public/shopView";
import type { GameState } from "../public";

export function projectShopView(state: GameState): ShopUiView {
  const offer = state.encounter.shop.lastOffer;
  if (!offer || state.scene !== "playing") {
    return createHiddenShopView();
  }
  const encounters = getPublicEncounterCatalog(state.run.threatTier);
  const nextEncounter = encounters[state.run.progress.currentEncounterIndex + 1] ?? null;
  const optionA = ITEM_REGISTRY[offer.options[0]];
  const optionB = ITEM_REGISTRY[offer.options[1]];
  const disabled = state.encounter.shop.purchased || state.run.score < offer.cost;
  return {
    visible: true,
    status: state.encounter.shop.purchased ? "purchased" : "one_time",
    cost: offer.cost,
    priceBandVisible: true,
    optionAType: offer.options[0],
    optionBType: offer.options[1],
    optionADisabled: disabled,
    optionBDisabled: disabled,
    optionA: {
      type: offer.options[0],
      role: optionA.roleTag,
      previewAffinity: optionA.previewAffinity,
      counterplayTags: optionA.counterplayTags,
    },
    optionB: {
      type: offer.options[1],
      role: optionB.roleTag,
      previewAffinity: optionB.previewAffinity,
      counterplayTags: optionB.counterplayTags,
    },
    previewStageNumber: nextEncounter?.stageNumber ?? null,
    previewFocus: nextEncounter?.scoreFocus ?? null,
    previewTags: nextEncounter?.previewTags ?? [],
  };
}
