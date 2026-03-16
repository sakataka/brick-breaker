import { getShopPurchaseCost } from "../config";
import { applyItemPickup, ensureMultiballCount } from "../itemSystem";
import type { GameConfig, GameState, ItemType, RandomSource } from "../types";
import { spawnItemPickupFeedback } from "../vfxSystem";

export function purchaseShopOption(
  state: GameState,
  index: 0 | 1,
  config: GameConfig,
  random: RandomSource,
): ItemType | null {
  if (state.scene !== "playing" || state.encounter.shop.usedThisStage) {
    return null;
  }
  const offer = state.encounter.shop.lastOffer;
  const purchaseCost = getShopPurchaseCost(state.encounter.shop.purchaseCount);
  if (!offer || state.run.score < purchaseCost) {
    return null;
  }

  const picked = offer[index];
  state.run.score -= purchaseCost;
  state.encounter.shop.usedThisStage = true;
  state.encounter.shop.purchaseCount += 1;
  state.encounter.shop.lastChosen = picked;
  applyItemPickup(state.combat.items, picked, state.combat.balls, {
    enableNewItemStacks: state.run.modulePolicy.allowExtendedStacks,
  });
  if (picked === "multiball") {
    state.combat.balls = ensureMultiballCount(
      state.combat.items,
      state.combat.balls,
      random,
      config.multiballMaxBalls,
    );
  }
  const anchor = state.combat.balls[0];
  if (anchor) {
    spawnItemPickupFeedback(state.ui.vfx, picked, anchor.pos.x, anchor.pos.y);
  }
  return picked;
}
