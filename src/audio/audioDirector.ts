import type { GameAudioSettings, ItemType, Scene } from "../game/types";
import { getStageBgmTrack, getTitleBgmTrack } from "./bgmCatalog";
import type { BgmController } from "./bgmSequencer";
import { BgmSequencer } from "./bgmSequencer";
import type { SfxManager } from "./sfx";

interface TimeoutScheduler {
  setTimeout(handler: () => void, timeoutMs: number): ReturnType<typeof setTimeout>;
  clearTimeout(id: ReturnType<typeof setTimeout>): void;
}

export interface AudioDirectorDeps {
  sequencer?: BgmController;
  scheduler?: TimeoutScheduler;
}

const START_JINGLE_MS = 900;

export class AudioDirector {
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
    deps: AudioDirectorDeps = {},
  ) {
    this.sequencer = deps.sequencer ?? new BgmSequencer();
    this.scheduler = deps.scheduler ?? {
      setTimeout: (handler, timeoutMs) => setTimeout(handler, timeoutMs),
      clearTimeout: (id) => clearTimeout(id),
    };
  }

  async unlock(): Promise<void> {
    await this.sfx.resumeIfNeeded();
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

  playItemPickup(itemType: ItemType): void {
    const itemSoundMap = {
      paddle_plus: "item_paddle_plus",
      slow_ball: "item_slow_ball",
      multiball: "item_multiball",
      shield: "item_shield",
      pierce: "item_pierce",
      bomb: "item_bomb",
    } as const;
    void this.sfx.play(itemSoundMap[itemType]);
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
        void this.sfx.play("jingle_start", { force: true });
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
      void this.sfx.play("jingle_stage_clear", { force: true });
      return;
    }
    if (scene === "clear") {
      void this.sfx.play("jingle_game_clear", { force: true });
      return;
    }
    if (scene === "gameover") {
      void this.sfx.play("jingle_game_over", { force: true });
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
}
