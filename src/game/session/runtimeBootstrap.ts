import type { LifecycleController } from "../lifecycle";
import { resolveStageMetadataFromState } from "../stageContext";
import { createHostHandlers, createUiHandlers } from "./sessionBindings";
import type { GameState, RuntimeErrorKey } from "../types";
import type { GameHost } from "../../phaser/GameHost";
import type { SessionPorts } from "./SessionPorts";

export interface RuntimeBootstrapDeps {
  setUiHandlers: (handlers: {
    primaryAction: () => void;
    shopOption: (index: 0 | 1) => void;
  }) => void;
}

export interface RuntimeBootstrapContext {
  deps: RuntimeBootstrapDeps;
  host: GameHost;
  lifecycle: LifecycleController;
  windowRef: Window;
  destroyed: boolean;
  ports: SessionPorts;
  state: GameState;
  audioSettings: {
    bgmEnabled: boolean;
    sfxEnabled: boolean;
  };
  bindA11yListeners: () => void;
  adjustCanvasScale: () => void;
  publishState: () => void;
  backToStart: () => void;
  startOrResume: () => void;
  purchaseShopOption: (index: 0 | 1) => void;
  runSafely: (action: () => void, fallbackMessage: RuntimeErrorKey) => void;
  togglePause: () => void;
  castMagic: () => void;
  onFrame: (timeMs: number) => void;
  onMove: (clientX: number) => void;
}

export function initializeRuntimeSession(context: RuntimeBootstrapContext): void {
  context.deps.setUiHandlers(
    createUiHandlers({
      onErrorReload: () => context.windowRef.location.reload(),
      onBackToStart: () => context.backToStart(),
      onStartOrResume: () => context.startOrResume(),
      onShopOption: (index) => context.purchaseShopOption(index),
      runSafely: (action, key) => context.runSafely(action, key),
      unlockAudio: () => {
        void context.ports.audio.unlock().catch(() => {});
      },
      getScene: () => context.state.scene,
    }),
  );
  context.host.setHandlers(
    createHostHandlers({
      onFrame: (timeMs) => context.onFrame(timeMs),
      onMove: (clientX) => context.onMove(clientX),
      onPauseToggle: () => context.togglePause(),
      onStartOrRestart: () => context.startOrResume(),
      onCastMagic: () => context.castMagic(),
    }),
  );
  context.bindA11yListeners();
  context.lifecycle.bind();
  context.adjustCanvasScale();
  context.windowRef.requestAnimationFrame(() => {
    if (!context.destroyed) {
      context.adjustCanvasScale();
    }
  });
  context.ports.setAudioSettings(context.audioSettings);
  context.ports.audio.notifyStageChanged(resolveStageMetadataFromState(context.state).musicCue);
  context.ports.audio.syncScene(context.state.scene, context.state.scene);
  context.publishState();
}
