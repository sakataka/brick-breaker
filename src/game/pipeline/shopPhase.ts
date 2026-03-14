import { ITEM_REGISTRY, pickWeightedItemType } from "../itemRegistry";
import type { GameState, ItemType, RandomSource } from "../types";

interface ShopOfferContext {
  enabledItems: readonly ItemType[];
  stageIndex: number;
}

export function generateShopOffer(
  random: RandomSource,
  enabledItems: readonly ItemType[],
): [ItemType, ItemType] {
  return generateShopOfferByContext(random, {
    enabledItems,
    stageIndex: 0,
  });
}

export function ensureShopOffer(
  state: GameState,
  random: RandomSource,
  enabledItems: readonly ItemType[],
  effectiveStageIndex: number,
): void {
  if (state.shop.usedThisStage || state.shop.lastOffer) {
    return;
  }
  state.shop.lastOffer = generateShopOfferByContext(random, {
    enabledItems,
    stageIndex: effectiveStageIndex,
  });
}

function generateShopOfferByContext(
  random: RandomSource,
  context: ShopOfferContext,
): [ItemType, ItemType] {
  const enabled = new Set(context.enabledItems);
  const available = (Object.keys(ITEM_REGISTRY) as ItemType[]).filter((type) => enabled.has(type));
  const rolePriority: Array<"attack" | "defense" | "control"> =
    context.stageIndex >= 7 ? ["attack", "defense", "control"] : ["control", "defense", "attack"];
  const first = pickByRole(random, available, rolePriority[0]);
  const second =
    pickByRole(
      random,
      available.filter((type) => type !== first),
      rolePriority[1],
    ) ??
    pickWeightedItemType(
      random,
      (Object.keys(ITEM_REGISTRY) as ItemType[]).filter(
        (type) => !enabled.has(type) || type === first,
      ),
    );
  if (first === second) {
    const fallback = pickWeightedItemType(
      random,
      (Object.keys(ITEM_REGISTRY) as ItemType[]).filter(
        (type) => !enabled.has(type) || type === first,
      ),
    );
    return [first, fallback];
  }
  return [first, second];
}

function pickByRole(
  random: RandomSource,
  pool: ItemType[],
  role: "attack" | "defense" | "control",
): ItemType {
  const preferred = pool.filter((type) => ITEM_REGISTRY[type].roleTag === role);
  const available = preferred.length > 0 ? preferred : pool;
  if (available.length <= 0) {
    return pickWeightedItemType(random);
  }
  const index = Math.floor(random.next() * available.length);
  return available[index] ?? available[available.length - 1];
}
