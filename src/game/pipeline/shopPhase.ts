import { pickWeightedItemType } from "../itemRegistry";
import type { GameState, ItemType, RandomSource } from "../types";

interface ShopOfferContext {
  stickyItemEnabled: boolean;
  stageIndex: number;
}

export function generateShopOffer(random: RandomSource, stickyItemEnabled: boolean): [ItemType, ItemType] {
  return generateShopOfferByContext(random, {
    stickyItemEnabled,
    stageIndex: 0,
  });
}

export function ensureShopOffer(
  state: GameState,
  random: RandomSource,
  stickyItemEnabled: boolean,
  effectiveStageIndex: number,
): void {
  if (state.shop.usedThisStage || state.shop.lastOffer) {
    return;
  }
  state.shop.lastOffer = generateShopOfferByContext(random, {
    stickyItemEnabled,
    stageIndex: effectiveStageIndex,
  });
}

function generateShopOfferByContext(random: RandomSource, context: ShopOfferContext): [ItemType, ItemType] {
  const excluded: ItemType[] = context.stickyItemEnabled ? [] : ["sticky"];
  const earlyPool: ItemType[] = ["paddle_plus", "slow_ball", "shield", "multiball", "sticky"];
  const latePool: ItemType[] = ["laser", "pierce", "bomb", "shockwave", "homing", "rail", "multiball"];
  const firstPool = context.stageIndex >= 7 ? latePool : earlyPool;
  const secondPool = context.stageIndex >= 7 ? earlyPool : latePool;
  const first = pickFromPool(random, firstPool, excluded);
  const second = pickFromPool(random, secondPool, [...excluded, first]);
  if (first === second) {
    const fallback = pickWeightedItemType(random, [...excluded, first]);
    return [first, fallback];
  }
  return [first, second];
}

function pickFromPool(random: RandomSource, pool: ItemType[], excluded: ItemType[]): ItemType {
  const available = pool.filter((type) => !excluded.includes(type));
  if (available.length <= 0) {
    return pickWeightedItemType(random, excluded);
  }
  const index = Math.floor(random.next() * available.length);
  return available[index] ?? available[available.length - 1];
}
