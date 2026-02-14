import type { ItemType, Scene } from "./model";

export interface RenderPort<TViewState = unknown> {
  render(viewState: TViewState): void;
}

export interface UiPort<TOverlayView = unknown, THudView = unknown, TShopView = unknown> {
  syncOverlay(view: TOverlayView): void;
  syncHud(view: THudView): void;
  syncShop(view: TShopView): void;
}

export interface AudioPort {
  unlock(): Promise<void>;
  setSettings(input: { bgmEnabled: boolean; sfxEnabled: boolean }): void;
  syncScene(scene: Scene, previousScene: Scene): void;
  notifyStageChanged(stageIndex: number): void;
  playItemPickup(itemType: ItemType): void;
  playComboFill(): void;
  playMagicCast(): void;
  destroy(): void;
}

export interface InputPort {
  attach(): void;
  detach(): void;
}

export interface FrameHostPort {
  requestFrame(callback: (timeMs: number) => void): void;
}
