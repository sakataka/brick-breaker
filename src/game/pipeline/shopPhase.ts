import {
  getItemCounterplayTags,
  getItemPreviewAffinity,
  ITEM_REGISTRY,
  pickWeightedItemType,
} from "../itemRegistry";
import { resolveUpcomingStagePreviewFromState } from "../stageContext";
import type { GameState, ItemType, RandomSource, StagePreviewTag } from "../types";

interface ShopOfferContext {
  enabledItems: readonly ItemType[];
  stageIndex: number;
  previewTags: readonly StagePreviewTag[];
  scoreFocus: "reactor_chain" | "turret_cancel" | "boss_break" | "survival_chain";
}

export function generateShopOffer(
  random: RandomSource,
  enabledItems: readonly ItemType[],
): [ItemType, ItemType] {
  return generateShopOfferByContext(random, {
    enabledItems,
    stageIndex: 0,
    previewTags: [],
    scoreFocus: "survival_chain",
  });
}

export function ensureShopOffer(
  state: GameState,
  random: RandomSource,
  enabledItems: readonly ItemType[],
  effectiveStageIndex: number,
): void {
  if (state.encounter.shop.usedThisStage || state.encounter.shop.lastOffer) {
    return;
  }
  state.encounter.shop.lastOffer = generateShopOfferByContext(random, {
    enabledItems,
    stageIndex: effectiveStageIndex,
    previewTags: resolveUpcomingStagePreviewFromState(state)?.previewTags ?? [],
    scoreFocus: resolveUpcomingStagePreviewFromState(state)?.scoreFocus ?? "survival_chain",
  });
}

function generateShopOfferByContext(
  random: RandomSource,
  context: ShopOfferContext,
): [ItemType, ItemType] {
  const enabled = new Set(context.enabledItems);
  const available = (Object.keys(ITEM_REGISTRY) as ItemType[]).filter((type) => enabled.has(type));
  const preferredTone =
    context.scoreFocus === "boss_break"
      ? "offense"
      : context.scoreFocus === "survival_chain"
        ? "survival"
        : context.scoreFocus === "reactor_chain"
          ? "control"
          : "offense";
  const ranked = [...available].sort((left, right) => {
    const scoreDiff = scoreItemForPreview(context, right) - scoreItemForPreview(context, left);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
    return ITEM_REGISTRY[right].weight - ITEM_REGISTRY[left].weight;
  });
  const first = ranked[0] ?? pickWeightedItemType(random);
  const secondPool = ranked.filter((type) => type !== first);
  const complementaryRole = context.stageIndex >= 7 ? "defense" : "control";
  const second =
    pickByRole(
      random,
      secondPool.filter(
        (type) =>
          ITEM_REGISTRY[type].roleTag === complementaryRole ||
          ITEM_REGISTRY[type].synergyTags.includes(preferredTone) ||
          scoreItemForPreview(context, type) > 0,
      ),
      complementaryRole,
    ) ??
    secondPool[0] ??
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

function scoreItemForPreview(context: ShopOfferContext, type: ItemType): number {
  const previewAffinity = getItemPreviewAffinity(type);
  const counterplayTags = getItemCounterplayTags(type);
  let score = ITEM_REGISTRY[type].weight * 10;
  if (
    (context.scoreFocus === "boss_break" &&
      ITEM_REGISTRY[type].synergyTags.includes("boss_break")) ||
    (context.scoreFocus === "survival_chain" &&
      ITEM_REGISTRY[type].synergyTags.includes("survival")) ||
    (context.scoreFocus === "reactor_chain" &&
      ITEM_REGISTRY[type].synergyTags.includes("control")) ||
    (context.scoreFocus === "turret_cancel" && ITEM_REGISTRY[type].synergyTags.includes("offense"))
  ) {
    score += 4;
  }
  for (const tag of context.previewTags) {
    if (previewAffinity.includes(tag)) {
      score += 5;
    }
    if (counterplayTags.includes(tag)) {
      score += 3;
    }
  }
  if (context.previewTags.includes("boss_break") && ITEM_REGISTRY[type].encounterBias === "boss") {
    score += 3;
  }
  if (context.previewTags.includes("survival_check") && ITEM_REGISTRY[type].roleTag === "defense") {
    score += 2;
  }
  if (context.previewTags.includes("hazard_flux") && ITEM_REGISTRY[type].roleTag === "control") {
    score += 2;
  }
  return score;
}
