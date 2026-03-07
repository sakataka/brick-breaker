import type { MusicCue } from "../game/types";
import { getCueBgmTrack, getTitleBgmTrack } from "./bgmCatalog";
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

  playCue(cue: MusicCue, fadeMs = 220): void {
    this.sequencer.play(getCueBgmTrack(cue), { fadeMs });
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
