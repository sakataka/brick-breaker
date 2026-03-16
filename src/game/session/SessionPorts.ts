import type { AudioPort, RenderPort, UiPort } from "../../core/ports";
import type { MetaProgress } from "../metaProgress";
import type { HudViewModel, OverlayViewModel, RenderViewState } from "../renderTypes";
import type { ShopUiView } from "../shopUi";
import type { GameAudioSettings, GameState, Scene } from "../types";
import { syncAudioScene } from "../audioSync";
import { syncViewPorts } from "./viewSync";

export interface SessionPortsDeps {
  renderPort: RenderPort<RenderViewState>;
  uiPort: UiPort<OverlayViewModel, HudViewModel, ShopUiView>;
  audioPort: AudioPort;
  setMetaProgress: (metaProgress: MetaProgress) => void;
}

export class SessionPorts {
  constructor(private readonly deps: SessionPortsDeps) {}

  publish(state: GameState): void {
    syncViewPorts(state, this.deps.renderPort, this.deps.uiPort);
  }

  syncAudioScene(previous: Scene, next: Scene, state: GameState): void {
    syncAudioScene(this.deps.audioPort, previous, next, state);
  }

  setAudioSettings(settings: GameAudioSettings): void {
    this.deps.audioPort.setSettings(settings);
  }

  setMetaProgress(metaProgress: MetaProgress): void {
    this.deps.setMetaProgress(metaProgress);
  }

  get audio(): AudioPort {
    return this.deps.audioPort;
  }

  destroy(): void {
    this.deps.audioPort.destroy();
  }
}
