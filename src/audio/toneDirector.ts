import { getItemPickupSfxEvent } from "../game/itemRegistry";
import type { GameAudioSettings, ItemType, Scene } from "../game/types";
import { getStageBgmTrack, getTitleBgmTrack } from "./bgmCatalog";
import type { BgmController } from "./bgmSequencer";
import { BgmSequencer } from "./bgmSequencer";
import type { EventName, SfxManager } from "./sfx";

interface TimeoutScheduler {
  setTimeout(handler: () => void, timeoutMs: number): ReturnType<typeof setTimeout>;
  clearTimeout(id: ReturnType<typeof setTimeout>): void;
}

export interface ToneDirectorDeps {
  sequencer?: BgmController;
  scheduler?: TimeoutScheduler;
}

type JingleKind = "start" | "stage_clear" | "game_clear" | "game_over";

const START_JINGLE_MS = 900;

export class ToneDirector {
  private readonly sequencer: BgmController;
  private readonly scheduler: TimeoutScheduler;
  private readonly settings: GameAudioSettings = {
    bgmEnabled: true,
    sfxEnabled: true,
  };
  private scene: Scene = "start";
  private stageIndex = 0;
  private delayedStageStartId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly sfx: SfxManager,
    deps: ToneDirectorDeps = {},
  ) {
    this.sequencer = deps.sequencer ?? new BgmSequencer();
    this.scheduler = deps.scheduler ?? {
      setTimeout: (handler, timeoutMs) => setTimeout(handler, timeoutMs),
      clearTimeout: (id) => clearTimeout(id),
    };
  }

  async unlock(): Promise<void> {
    await this.sfx.resumeIfNeeded();
    await this.resumeToneTransportIfAvailable();
    const context = await this.sfx.getContext();
    if (context) {
      this.sequencer.attachContext(context);
    }
    this.applySceneAudio(this.scene, this.scene);
  }

  setSettings(settings: GameAudioSettings): void {
    this.settings.bgmEnabled = settings.bgmEnabled;
    this.settings.sfxEnabled = settings.sfxEnabled;
    this.sfx.setSfxEnabled(settings.sfxEnabled);
    this.sequencer.setEnabled(settings.bgmEnabled);

    this.clearDelayedStageStart();
    if (!this.settings.bgmEnabled) {
      this.sequencer.stop(120);
      return;
    }

    if (this.scene === "start") {
      this.sequencer.play(getTitleBgmTrack(), { fadeMs: 120 });
      return;
    }

    if (this.scene === "playing") {
      this.playCurrentStageBgm(120);
      return;
    }

    this.sequencer.stop(120);
  }

  syncScene(scene: Scene, previousScene: Scene): void {
    this.scene = scene;
    this.applySceneAudio(scene, previousScene);
  }

  notifyStageChanged(stageIndex: number): void {
    this.stageIndex = Math.max(0, Math.round(stageIndex));
    if (this.scene === "playing" && this.settings.bgmEnabled && !this.delayedStageStartId) {
      this.playCurrentStageBgm();
    }
  }

  setBgmForStage(stageNumber: number): void {
    this.notifyStageChanged(Math.max(0, stageNumber - 1));
    if (this.scene === "playing") {
      this.playCurrentStageBgm();
    }
  }

  playJingle(kind: JingleKind): void {
    const event = toJingleEvent(kind);
    void this.sfx.play(event, { force: true });
  }

  playItemSfx(itemType: ItemType): void {
    void this.sfx.play(getItemPickupSfxEvent(itemType));
  }

  playComboFill(): void {
    void this.sfx.play("combo_fill");
  }

  playMagicCast(): void {
    void this.sfx.play("magic_cast");
  }

  destroy(): void {
    this.clearDelayedStageStart();
    this.sequencer.destroy();
  }

  private applySceneAudio(scene: Scene, previousScene: Scene): void {
    this.clearDelayedStageStart();

    if (!this.settings.bgmEnabled) {
      this.sequencer.stop(80);
      return;
    }

    if (scene === "start") {
      this.sequencer.play(getTitleBgmTrack());
      return;
    }

    if (scene === "playing") {
      if (previousScene === "start") {
        this.sequencer.stop(120);
        this.playJingle("start");
        this.delayedStageStartId = this.scheduler.setTimeout(() => {
          this.delayedStageStartId = null;
          if (this.scene === "playing" && this.settings.bgmEnabled) {
            this.playCurrentStageBgm();
          }
        }, START_JINGLE_MS);
        return;
      }

      if (previousScene === "paused") {
        this.sequencer.resume();
        return;
      }

      this.playCurrentStageBgm();
      return;
    }

    if (scene === "paused") {
      this.sequencer.pause();
      return;
    }

    this.sequencer.stop();
    if (scene === "stageclear") {
      this.playJingle("stage_clear");
      return;
    }
    if (scene === "clear") {
      this.playJingle("game_clear");
      return;
    }
    if (scene === "gameover") {
      this.playJingle("game_over");
      return;
    }
  }

  private playCurrentStageBgm(fadeMs = 220): void {
    this.sequencer.play(getStageBgmTrack(this.stageIndex + 1), { fadeMs });
  }

  private clearDelayedStageStart(): void {
    if (this.delayedStageStartId) {
      this.scheduler.clearTimeout(this.delayedStageStartId);
      this.delayedStageStartId = null;
    }
  }

  private async resumeToneTransportIfAvailable(): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const tone = await import("tone");
      await tone.start();
    } catch {
      return;
    }
  }
}

function toJingleEvent(kind: JingleKind): EventName {
  if (kind === "start") {
    return "jingle_start";
  }
  if (kind === "stage_clear") {
    return "jingle_stage_clear";
  }
  if (kind === "game_clear") {
    return "jingle_game_clear";
  }
  return "jingle_game_over";
}
