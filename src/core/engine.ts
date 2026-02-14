import type { SfxManager } from "../audio/sfx";
import { computeFrameDelta, handleBallLoss, handleStageClear, runPlayingLoop } from "../game/gameRuntime";
import type { GameConfig, GameState, ItemType, RandomSource } from "../game/types";
import { nextDensityScale, updateVfxState } from "../game/vfxSystem";

interface TickHooks {
  onStageClear: () => void;
  onBallLoss: () => void;
}

interface TickDeps {
  config: GameConfig;
  random: RandomSource;
  sfx: SfxManager;
  playPickupSfx: (itemType: ItemType) => void;
  playComboFillSfx: () => void;
  playMagicCastSfx: () => void;
}

export class CoreEngine {
  private accumulator = 0;
  private lastFrameTime = 0;

  constructor(
    private readonly state: GameState,
    private readonly configRef: () => GameConfig,
    private readonly randomRef: () => RandomSource,
  ) {}

  resetClock(): void {
    this.lastFrameTime = 0;
    this.accumulator = 0;
  }

  tick(timeMs: number, deps: TickDeps, hooks: TickHooks): void {
    const timeSec = timeMs / 1000;
    const frame = computeFrameDelta(this.lastFrameTime, timeSec);
    const delta = frame.delta;
    this.lastFrameTime = frame.nextFrameTime;
    this.state.vfx.densityScale = nextDensityScale(this.state.vfx.densityScale, delta, this.state.scene);
    if (this.state.scene === "playing") {
      this.accumulator = runPlayingLoop(
        this.state,
        {
          config: deps.config,
          random: deps.random,
          sfx: deps.sfx,
          playPickupSfx: deps.playPickupSfx,
          playComboFillSfx: deps.playComboFillSfx,
          playMagicCastSfx: deps.playMagicCastSfx,
        },
        this.accumulator,
        delta,
        hooks.onStageClear,
        hooks.onBallLoss,
      );
      return;
    }
    updateVfxState(this.state.vfx, delta, deps.random);
  }

  applyStageClear(onTransition: (event: "GAME_CLEAR" | "STAGE_CLEAR") => void): void {
    handleStageClear(this.state, this.configRef(), onTransition);
  }

  applyBallLoss(onGameOver: () => void): void {
    handleBallLoss(this.state, this.configRef(), this.randomRef(), onGameOver);
  }
}
