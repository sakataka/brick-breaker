import { AudioDirector } from "../../audio/audioDirector";
import { SfxManager } from "../../audio/sfx";
import { CoreEngine } from "../../core/engine";
import type { AudioPort, RenderPort, UiPort } from "../../core/ports";
import { GameHost } from "../../phaser/GameHost";
import { readAccessibility } from "../a11y";
import { GAME_CONFIG } from "../config";
import { LifecycleController } from "../lifecycle";
import type { MetaProgress } from "../metaProgress";
import { defaultRandomSource } from "../random";
import type { HudViewModel, OverlayViewModel, RenderViewState } from "../renderTypes";
import { type SceneEvent, SceneMachine } from "../sceneMachine";
import type { StartSettingsSelection } from "../startSettingsSchema";
import { createInitialGameState } from "../stateFactory";
import type { ShopUiView } from "../shopUi";
import type { GameAudioSettings, GameConfig, GameState, RandomSource } from "../types";
import { SessionActionDispatcher } from "./sessionActionDispatcher";
import { SessionPorts } from "./SessionPorts";
import { SessionProgressStore } from "./sessionProgressStore";
import type { SessionTransitionResult } from "./sessionFlow";
import { SessionViewportController } from "./sessionViewportController";

export interface RuntimeControllerDeps {
  config?: Partial<GameConfig>;
  random?: RandomSource;
  documentRef?: Document;
  windowRef?: Window;
  host?: GameHost;
  renderPort?: RenderPort<RenderViewState>;
  uiPort: UiPort<OverlayViewModel, HudViewModel, ShopUiView>;
  getStartSettings: () => StartSettingsSelection;
  setUiHandlers: (handlers: {
    primaryAction: () => void;
    shopOption: (index: 0 | 1) => void;
  }) => void;
  setMetaProgress: (metaProgress: MetaProgress) => void;
}

export interface RuntimeMutableRefs {
  config: GameConfig;
  random: RandomSource;
  audioSettings: GameAudioSettings;
  pendingStartStageIndex: number;
}

export interface RuntimeCompositionCallbacks {
  transition: (event: SceneEvent) => SessionTransitionResult;
  syncAudioForTransition: (result: SessionTransitionResult) => void;
  publishState: () => void;
}

export interface RuntimeCompositionResult {
  refs: RuntimeMutableRefs;
  baseConfig: GameConfig;
  baseRandom: RandomSource;
  windowRef: Window;
  host: GameHost;
  audioPort: AudioPort;
  ports: SessionPorts;
  sfx: SfxManager;
  sceneMachine: SceneMachine;
  lifecycle: LifecycleController;
  actionDispatcher: SessionActionDispatcher;
  viewportController: SessionViewportController;
  state: GameState;
  engine: CoreEngine;
}

export function createRuntimeComposition(
  canvas: HTMLCanvasElement,
  deps: RuntimeControllerDeps,
  callbacks: RuntimeCompositionCallbacks,
): RuntimeCompositionResult {
  const baseConfig = { ...GAME_CONFIG, ...deps.config };
  const baseRandom = deps.random ?? defaultRandomSource;
  const refs: RuntimeMutableRefs = {
    config: { ...baseConfig },
    random: baseRandom,
    audioSettings: {
      bgmEnabled: true,
      sfxEnabled: true,
    },
    pendingStartStageIndex: 0,
  };
  const documentRef = deps.documentRef ?? document;
  const windowRef = deps.windowRef ?? window;
  const sfx = new SfxManager();
  const audioPort: AudioPort = new AudioDirector(sfx);
  const host =
    deps.host ??
    new GameHost({
      canvas,
      width: baseConfig.width,
      height: baseConfig.height,
      zoom: Math.max(1, Math.min(2, windowRef.devicePixelRatio || 1)),
    });
  const renderPort =
    deps.renderPort ??
    ({
      render: (view) => host.render(view),
    } satisfies RenderPort<RenderViewState>);
  const ports = new SessionPorts({
    renderPort,
    uiPort: deps.uiPort,
    audioPort,
    setMetaProgress: deps.setMetaProgress,
  });
  const sceneMachine = new SceneMachine();
  const a11y = readAccessibility(windowRef);
  const state = createInitialGameState(
    refs.config,
    a11y.reducedMotion,
    sceneMachine.value,
    a11y.highContrast,
  );
  const progressStore = new SessionProgressStore({
    storage: windowRef.localStorage,
    setMetaProgress: (metaProgress) => ports.setMetaProgress(metaProgress),
  });
  progressStore.hydrateRecords(state);
  const engine = new CoreEngine(
    state,
    () => refs.config,
    () => refs.random,
  );
  const actionDispatcher = new SessionActionDispatcher({
    state,
    engine,
    audioPort,
    progressStore,
    transition: callbacks.transition,
    syncAudioForTransition: callbacks.syncAudioForTransition,
    publishState: callbacks.publishState,
  });
  const viewportController = new SessionViewportController({
    canvas,
    state,
    windowRef,
    reducedMotionQuery: windowRef.matchMedia("(prefers-reduced-motion: reduce)"),
    highContrastQuery: windowRef.matchMedia("(prefers-contrast: more)"),
    getConfig: () => refs.config,
    publishState: callbacks.publishState,
  });
  const lifecycle = new LifecycleController(
    documentRef,
    canvas.parentElement,
    () => state.scene === "playing" && actionDispatcher.togglePause(),
    () => viewportController.adjustCanvasScale(),
  );

  return {
    refs,
    baseConfig,
    baseRandom,
    windowRef,
    host,
    audioPort,
    ports,
    sfx,
    sceneMachine,
    lifecycle,
    actionDispatcher,
    viewportController,
    state,
    engine,
  };
}
