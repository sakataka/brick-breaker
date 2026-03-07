import type { RuntimeSceneHandlers } from "../../phaser/scenes";
import type { Scene } from "../types";

export interface SessionUiBindings {
  onErrorReload: () => void;
  onBackToStart: () => void;
  onStartOrResume: () => void;
  onShopOption: (index: 0 | 1) => void;
  runSafely: (action: () => void, key: "startAction" | "shopPurchase") => void;
  unlockAudio: () => void;
  getScene: () => Scene;
}

export function createUiHandlers(bindings: SessionUiBindings) {
  return {
    primaryAction: () => {
      const scene = bindings.getScene();
      if (scene === "error") {
        bindings.onErrorReload();
        return;
      }
      if (scene === "clear") {
        bindings.onBackToStart();
        return;
      }
      bindings.unlockAudio();
      bindings.runSafely(() => bindings.onStartOrResume(), "startAction");
    },
    shopOption: (index: 0 | 1) => {
      bindings.runSafely(() => bindings.onShopOption(index), "shopPurchase");
    },
  };
}

export interface SessionHostBindings {
  onFrame: (timeMs: number) => void;
  onMove: (clientX: number) => void;
  onPauseToggle: () => void;
  onStartOrRestart: () => void;
  onCastMagic: () => void;
}

export function createHostHandlers(bindings: SessionHostBindings): RuntimeSceneHandlers {
  return {
    onFrame: bindings.onFrame,
    onMove: bindings.onMove,
    onPauseToggle: bindings.onPauseToggle,
    onStartOrRestart: bindings.onStartOrRestart,
    onCastMagic: bindings.onCastMagic,
  };
}
