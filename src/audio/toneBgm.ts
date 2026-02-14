import { getStageBgmTrack, getTitleBgmTrack } from "./bgmCatalog";
import type { BgmController } from "./bgmSequencer";
import { BgmSequencer } from "./bgmSequencer";

export interface ToneBgmDeps {
  sequencer?: BgmController;
}

export class ToneBgm {
  private readonly sequencer: BgmController;

  constructor(deps: ToneBgmDeps = {}) {
    this.sequencer = deps.sequencer ?? new BgmSequencer();
  }

  attachContext(context: AudioContext): void {
    this.sequencer.attachContext(context);
  }

  setEnabled(enabled: boolean): void {
    this.sequencer.setEnabled(enabled);
  }

  playTitle(fadeMs = 220): void {
    this.sequencer.play(getTitleBgmTrack(), { fadeMs });
  }

  playStage(stageNumber: number, fadeMs = 220): void {
    this.sequencer.play(getStageBgmTrack(stageNumber), { fadeMs });
  }

  pause(): void {
    this.sequencer.pause();
  }

  resume(): void {
    this.sequencer.resume();
  }

  stop(fadeMs = 220): void {
    this.sequencer.stop(fadeMs);
  }

  destroy(): void {
    this.sequencer.destroy();
  }
}
