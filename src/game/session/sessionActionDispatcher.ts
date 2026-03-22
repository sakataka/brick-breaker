import type { CoreEngine } from "../../core/engine";
import type { AudioPort } from "../../core/ports";
import type { SceneEvent } from "../sceneMachine";
import type { GameConfig, GameState, RandomSource } from "../types";
import {
  handleBallLossSession,
  handleStageClearSession,
  startOrResumeSession,
  type SessionTransitionResult,
} from "./sessionFlow";
import type { SessionProgressStore } from "./sessionProgressStore";

export interface SessionActionDispatcherDeps {
  state: GameState;
  engine: CoreEngine;
  audioPort: AudioPort;
  progressStore: SessionProgressStore;
  transition: (event: SceneEvent) => SessionTransitionResult;
  syncAudioForTransition: (result: SessionTransitionResult) => void;
  publishState: () => void;
}

export class SessionActionDispatcher {
  constructor(private readonly deps: SessionActionDispatcherDeps) {}

  startOrResume(config: GameConfig, random: RandomSource, pendingStartStageIndex: number): void {
    startOrResumeSession({
      state: this.deps.state,
      config,
      random,
      audioPort: this.deps.audioPort,
      engine: this.deps.engine,
      pendingStartStageIndex,
      transition: this.deps.transition,
      syncAudioForTransition: this.deps.syncAudioForTransition,
      syncViewPorts: this.deps.publishState,
    });
  }

  togglePause(): void {
    void this.deps.audioPort.unlock().catch(() => {});
    const result = this.deps.transition({ type: "TOGGLE_PAUSE" });
    if (result.previous === "paused" && result.next === "playing") {
      this.deps.engine.resetClock();
    }
    this.deps.syncAudioForTransition(result);
    this.deps.publishState();
  }

  backToStart(): void {
    const result = this.deps.transition({ type: "BACK_TO_START" });
    this.deps.syncAudioForTransition(result);
    this.deps.publishState();
  }

  handleStageClear(): void {
    handleStageClearSession({
      state: this.deps.state,
      engine: this.deps.engine,
      transition: this.deps.transition,
      syncAudioForTransition: this.deps.syncAudioForTransition,
      syncViewPorts: this.deps.publishState,
      onReachedClear: () => this.deps.progressStore.persistClear(this.deps.state),
    });
  }

  handleBallLoss(): void {
    handleBallLossSession({
      state: this.deps.state,
      engine: this.deps.engine,
      transition: this.deps.transition,
      syncAudioForTransition: this.deps.syncAudioForTransition,
      syncViewPorts: this.deps.publishState,
      onGameOver: () => this.deps.progressStore.persistGameOver(this.deps.state),
    });
  }
}
