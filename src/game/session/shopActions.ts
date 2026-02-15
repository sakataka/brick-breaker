import { getShopPurchaseCost } from "../config";
import { generateShopOffer } from "../gamePipeline";
import { applyItemPickup, ensureMultiballCount } from "../itemSystem";
import type { GameConfig, GameState, ItemType, RandomSource } from "../types";
import { spawnItemPickupFeedback } from "../vfxSystem";

export function purchaseShopOption(
  state: GameState,
  index: 0 | 1,
  config: GameConfig,
  random: RandomSource,
): ItemType | null {
  if (state.scene !== "playing" || state.shop.usedThisStage) {
    return null;
  }
  const offer = state.shop.lastOffer;
  const purchaseCost = getShopPurchaseCost(state.shop.purchaseCount);
  if (!offer || state.score < purchaseCost) {
    return null;
  }

  const picked = offer[index];
  state.score -= purchaseCost;
  state.shop.usedThisStage = true;
  state.shop.purchaseCount += 1;
  state.shop.lastChosen = picked;
  applyItemPickup(state.items, picked, state.balls, {
    enableNewItemStacks: state.options.enableNewItemStacks,
  });
  if (picked === "multiball") {
    state.balls = ensureMultiballCount(state.items, state.balls, random, config.multiballMaxBalls);
  }
  const anchor = state.balls[0];
  if (anchor) {
    spawnItemPickupFeedback(state.vfx, picked, anchor.pos.x, anchor.pos.y);
  }
  return picked;
}

export function rerollShopOffer(state: GameState, random: RandomSource): boolean {
  if (state.scene !== "playing") {
    return false;
  }
  if (state.shop.usedThisStage || state.shop.rerolledThisStage || !state.shop.lastOffer) {
    return false;
  }
  state.shop.lastOffer = generateShopOffer(random, state.options.stickyItemEnabled);
  state.shop.rerolledThisStage = true;
  return true;
}
