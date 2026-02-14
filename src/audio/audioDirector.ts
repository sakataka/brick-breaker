import type { GameAudioSettings, ItemType, Scene } from "../game/types";
import type { SfxManager } from "./sfx";
import { ToneDirector, type ToneDirectorDeps } from "./toneDirector";

interface AudioRuntime {
  unlock(): Promise<void>;
  setSettings(settings: GameAudioSettings): void;
  syncScene(scene: Scene, previousScene: Scene): void;
  notifyStageChanged(stageIndex: number): void;
  playItemSfx(itemType: ItemType): void;
  playComboFill(): void;
  playMagicCast(): void;
  destroy(): void;
}

export interface AudioDirectorDeps extends ToneDirectorDeps {
  runtime?: AudioRuntime;
}

export class AudioDirector {
  private readonly runtime: AudioRuntime;

  constructor(sfx: SfxManager, deps: AudioDirectorDeps = {}) {
    this.runtime = deps.runtime ?? new ToneDirector(sfx, deps);
  }

  unlock(): Promise<void> {
    return this.runtime.unlock();
  }

  setSettings(settings: GameAudioSettings): void {
    this.runtime.setSettings(settings);
  }

  syncScene(scene: Scene, previousScene: Scene): void {
    this.runtime.syncScene(scene, previousScene);
  }

  notifyStageChanged(stageIndex: number): void {
    this.runtime.notifyStageChanged(stageIndex);
  }

  playItemPickup(itemType: ItemType): void {
    this.runtime.playItemSfx(itemType);
  }

  playComboFill(): void {
    this.runtime.playComboFill();
  }

  playMagicCast(): void {
    this.runtime.playMagicCast();
  }

  destroy(): void {
    this.runtime.destroy();
  }
}
