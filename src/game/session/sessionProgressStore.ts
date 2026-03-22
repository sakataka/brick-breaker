import {
  applyRunScoreToMeta,
  readMetaProgress,
  shouldUnlockThreatTier2,
  type MetaProgress,
  writeMetaProgress,
} from "../metaProgress";
import { syncRecordStateFromMeta } from "../scoreSystem";
import type { GameState } from "../types";

export interface SessionProgressStoreDeps {
  storage?: Storage | null;
  setMetaProgress: (metaProgress: MetaProgress) => void;
}

export class SessionProgressStore {
  constructor(private readonly deps: SessionProgressStoreDeps) {}

  hydrateRecords(state: GameState): void {
    syncRecordStateFromMeta(state, readMetaProgress(this.deps.storage));
  }

  persistClear(state: GameState): void {
    let nextMeta = readMetaProgress(this.deps.storage);
    if (
      shouldUnlockThreatTier2({
        scene: state.scene,
        options: { threatTier: state.run.options.threatTier },
      })
    ) {
      nextMeta = {
        ...nextMeta,
        progression: {
          ...nextMeta.progression,
          threatTier2Unlocked: true,
        },
      };
    }
    if (shouldPersistRunScore(state)) {
      nextMeta = applyRunScoreToMeta(nextMeta, {
        score: state.run.score,
        threatTier: state.run.options.threatTier,
      });
    }
    this.writeAndSync(state, nextMeta);
  }

  persistGameOver(state: GameState): void {
    if (!shouldPersistRunScore(state)) {
      return;
    }
    const nextMeta = applyRunScoreToMeta(readMetaProgress(this.deps.storage), {
      score: state.run.lastGameOverScore ?? state.run.score,
      threatTier: state.run.options.threatTier,
    });
    this.writeAndSync(state, nextMeta);
  }

  private writeAndSync(state: GameState, metaProgress: MetaProgress): void {
    writeMetaProgress(this.deps.storage, metaProgress);
    this.syncMeta(state, metaProgress);
  }

  private syncMeta(state: GameState, metaProgress: MetaProgress): void {
    this.deps.setMetaProgress(metaProgress);
    syncRecordStateFromMeta(state, metaProgress);
  }
}

function shouldPersistRunScore(state: GameState): boolean {
  void state;
  return true;
}
