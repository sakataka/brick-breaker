import type { MetaProgress } from "./metaProgress";
import type { GameState, ScoreFeedEntry } from "./types";

const SCORE_FEED_MAX = 6;

export function syncRecordStateFromMeta(state: GameState, meta: MetaProgress): void {
  state.run.records.overallBestScore = meta.records.overallBestScore;
  state.run.records.tier1BestScore = meta.records.tier1BestScore;
  state.run.records.tier2BestScore = meta.records.tier2BestScore;
  state.run.records.latestRunScore = meta.records.latestRunScore;
}

export function pushScoreFeed(
  state: Pick<GameState, "ui">,
  entry: Omit<ScoreFeedEntry, "id">,
): void {
  const nextId =
    state.ui.scoreFeed.length > 0 ? Math.max(...state.ui.scoreFeed.map((item) => item.id)) + 1 : 1;
  state.ui.scoreFeed.unshift({
    id: nextId,
    ...entry,
  });
  if (state.ui.scoreFeed.length > SCORE_FEED_MAX) {
    state.ui.scoreFeed.length = SCORE_FEED_MAX;
  }
  if (entry.tone === "style") {
    state.ui.styleBonus.lastBonusLabel = entry.label;
    state.ui.styleBonus.lastBonusScore = entry.amount;
  }
}

export function updateScoreFeedState(state: Pick<GameState, "ui">, deltaSec: number): void {
  const deltaMs = deltaSec * 1000;
  state.ui.scoreFeed = state.ui.scoreFeed.filter((entry) => {
    entry.lifeMs -= deltaMs;
    return entry.lifeMs > 0;
  });
}

export function syncLiveRecordState(state: Pick<GameState, "run">): void {
  const courseBest =
    state.run.options.threatTier === 2
      ? state.run.records.tier2BestScore
      : state.run.records.tier1BestScore;
  const bestToBeat = Math.max(courseBest, state.run.records.overallBestScore);
  state.run.records.currentRunRecord = state.run.score > bestToBeat;
  state.run.records.deltaToBest = state.run.score - bestToBeat;
}
