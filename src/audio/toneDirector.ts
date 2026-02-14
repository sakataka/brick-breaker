import type { GameAudioSettings, ItemType, Scene } from "../game/types";
import type { BgmController } from "./bgmSequencer";
import type { SfxManager } from "./sfx";
import { ToneBgm } from "./toneBgm";
import { ToneSfx } from "./toneSfx";

interface TimeoutScheduler {
  setTimeout(handler: () => void, timeoutMs: number): ReturnType<typeof setTimeout>;
  clearTimeout(id: ReturnType<typeof setTimeout>): void;
}

export interface ToneDirectorDeps {
  sequencer?: BgmController;
  scheduler?: TimeoutScheduler;
}

const START_JINGLE_MS = 900;

export class ToneDirector {
  private readonly bgm: ToneBgm;
  private readonly toneSfx: ToneSfx;
  private readonly scheduler: TimeoutScheduler;
  private readonly settings: GameAudioSettings = {
    bgmEnabled: true,
    sfxEnabled: true,
  };
  private scene: Scene = "start";
  private stageIndex = 0;
  private delayedStageStartId: ReturnType<typeof setTimeout> | null = null;

  constructor(sfx: SfxManager, deps: ToneDirectorDeps = {}) {
    this.bgm = new ToneBgm({ sequencer: deps.sequencer });
    this.toneSfx = new ToneSfx(sfx);
    this.scheduler = deps.scheduler ?? {
      setTimeout: (handler, timeoutMs) => setTimeout(handler, timeoutMs),
      clearTimeout: (id) => clearTimeout(id),
    };
    this.sfx = sfx;
  }
  private readonly sfx: SfxManager;

  async unlock(): Promise<void> {
    await this.sfx.resumeIfNeeded();
    await this.resumeToneTransportIfAvailable();
    const context = await this.sfx.getContext();
    if (context) {
      this.bgm.attachContext(context);
    }
    this.applySceneAudio(this.scene, this.scene);
  }

  setSettings(settings: GameAudioSettings): void {
    this.settings.bgmEnabled = settings.bgmEnabled;
    this.settings.sfxEnabled = settings.sfxEnabled;
    this.toneSfx.setEnabled(settings.sfxEnabled);
    this.bgm.setEnabled(settings.bgmEnabled);

    this.clearDelayedStageStart();
    if (!this.settings.bgmEnabled) {
      this.bgm.stop(120);
      return;
    }

    if (this.scene === "start") {
      this.bgm.playTitle(120);
      return;
    }

    if (this.scene === "playing") {
      this.playCurrentStageBgm(120);
      return;
    }

    this.bgm.stop(120);
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

  playItemSfx(itemType: ItemType): void {
    this.toneSfx.playItem(itemType);
  }

  playComboFill(): void {
    this.toneSfx.playComboFill();
  }

  playMagicCast(): void {
    this.toneSfx.playMagicCast();
  }

  destroy(): void {
    this.clearDelayedStageStart();
    this.bgm.destroy();
  }

  private applySceneAudio(scene: Scene, previousScene: Scene): void {
    this.clearDelayedStageStart();

    if (!this.settings.bgmEnabled) {
      this.bgm.stop(80);
      return;
    }

    if (scene === "start") {
      this.bgm.playTitle();
      return;
    }

    if (scene === "playing") {
      if (previousScene === "start") {
        this.bgm.stop(120);
        this.toneSfx.playStartJingle();
        this.delayedStageStartId = this.scheduler.setTimeout(() => {
          this.delayedStageStartId = null;
          if (this.scene === "playing" && this.settings.bgmEnabled) {
            this.playCurrentStageBgm();
          }
        }, START_JINGLE_MS);
        return;
      }

      if (previousScene === "paused") {
        this.bgm.resume();
        return;
      }

      this.playCurrentStageBgm();
      return;
    }

    if (scene === "paused") {
      this.bgm.pause();
      return;
    }

    this.bgm.stop();
    if (scene === "stageclear") {
      this.toneSfx.playStageClearJingle();
      return;
    }
    if (scene === "clear") {
      this.toneSfx.playGameClearJingle();
      return;
    }
    if (scene === "gameover") {
      this.toneSfx.playGameOverJingle();
      return;
    }
  }

  private playCurrentStageBgm(fadeMs = 220): void {
    this.bgm.playStage(this.stageIndex + 1, fadeMs);
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
