import type { SfxManager } from "../../audio/sfx";
import type { AudioPort } from "../../core/ports";
import type { CoreEngine } from "../../core/engine";
import type { GameConfig, GameState, RandomSource, RuntimeErrorKey } from "../types";

export interface RuntimeLoopContext {
  state: GameState;
  config: GameConfig;
  random: RandomSource;
  sfx: SfxManager;
  audioPort: AudioPort;
  engine: CoreEngine;
  isRunning: boolean;
  destroyed: boolean;
  syncViewportForDpi: () => void;
  publishState: () => void;
  handleStageClear: () => void;
  handleBallLoss: () => void;
  setRuntimeError: (key: RuntimeErrorKey, detail?: string) => void;
}

export function runRuntimeFrame(timeMs: number, context: RuntimeLoopContext): void {
  if (!context.isRunning || context.destroyed) {
    return;
  }
  try {
    context.syncViewportForDpi();
    const previousBossPhase = context.state.encounter.bossPhase;
    const previousTelegraphKind = context.state.encounter.runtime.telegraph?.kind;
    const previousSweepActive = Boolean(context.state.encounter.runtime.sweep);
    context.engine.tick(
      timeMs,
      {
        config: context.config,
        random: context.random,
        sfx: context.sfx,
        playPickupSfx: (itemType) => context.audioPort.playItemPickup(itemType),
        playComboFillSfx: () => context.audioPort.playComboFill(),
        playMagicCastSfx: () => context.audioPort.playMagicCast(),
      },
      {
        onStageClear: () => context.handleStageClear(),
        onBallLoss: () => context.handleBallLoss(),
      },
    );
    syncEncounterAudio(
      {
        previousBossPhase,
        previousTelegraphKind,
        previousSweepActive,
      },
      context.state,
      context.audioPort,
    );
    context.publishState();
  } catch (error) {
    context.setRuntimeError(
      "runtime",
      error instanceof Error && error.message ? error.message : undefined,
    );
  }
}

function syncEncounterAudio(
  previous: {
    previousBossPhase: number;
    previousTelegraphKind:
      | NonNullable<GameState["encounter"]["runtime"]["telegraph"]>["kind"]
      | undefined;
    previousSweepActive: boolean;
  },
  state: GameState,
  audioPort: AudioPort,
): void {
  const nextTelegraph = state.encounter.runtime.telegraph;
  const nextSweepActive = Boolean(state.encounter.runtime.sweep);
  if (state.encounter.bossPhase > previous.previousBossPhase) {
    audioPort.playBossPhaseShift();
  }
  if (nextTelegraph && previous.previousTelegraphKind !== nextTelegraph.kind) {
    audioPort.playBossCast();
    if (typeof nextTelegraph.lane === "number") {
      audioPort.playDangerLane();
    }
  }
  if (!previous.previousSweepActive && nextSweepActive) {
    audioPort.playDangerLane();
  }
}
