import { AudioDirector } from "../../audio/audioDirector";
import { SfxManager } from "../../audio/sfx";
import { GameHost } from "../../phaser/GameHost";
import { createHiddenShopView } from "../public/shopView";
import { readAccessibility } from "../public/a11y";
import {
  DEFAULT_META_PROGRESS,
  readMetaProgress,
  writeMetaProgress,
  type MetaProgress,
} from "../public/metaProgress";
import type {
  GameConfig,
  HudViewModel,
  OverlayViewModel,
  RandomSource,
  Scene,
  ShopUiView,
} from "../public";
import type { StartSettingsSelection } from "../public/startSettings";
import { castActiveSkill } from "../engine/activeSkill";
import { buildGameConfig, DEFAULT_GAME_CONFIG } from "../engine/config";
import { applyShopSelection } from "../engine/shop";
import { createInitialGameState } from "../engine/stateFactory";
import {
  finalizeRun,
  prepareEncounter,
  advanceEncounter,
  completeStage,
} from "../engine/transitions";
import { tickGame } from "../engine/tick";
import {
  projectHudView,
  projectOverlayView,
  projectRenderView,
  projectShopView,
} from "../presenter/projectors";

export interface RuntimeControllerDeps {
  config?: Partial<GameConfig>;
  random?: RandomSource;
  documentRef?: Document;
  windowRef?: Window;
  host?: GameHost;
  uiPort: {
    syncOverlay: (view: OverlayViewModel) => void;
    syncHud: (view: HudViewModel) => void;
    syncShop: (view: ShopUiView) => void;
  };
  getStartSettings: () => StartSettingsSelection;
  setUiHandlers: (handlers: {
    primaryAction: () => void;
    shopOption: (index: 0 | 1) => void;
  }) => void;
  setMetaProgress: (metaProgress: MetaProgress) => void;
}

export interface RuntimeControllerPort {
  start: () => void;
  destroy: () => void;
  forceSceneForTest: (scene: Scene) => void;
  setGameOverScoreForTest: (score: number, lives?: number) => void;
  unlockThreatTier2ForTest: () => void;
}

export type RuntimeControllerFactory = (
  canvas: HTMLCanvasElement,
  deps: RuntimeControllerDeps,
) => RuntimeControllerPort;

class RuntimeController implements RuntimeControllerPort {
  private readonly windowRef: Window;
  private readonly host: GameHost;
  private readonly audio: AudioDirector;
  private readonly baseConfig: GameConfig;
  private readonly sfx = new SfxManager();
  private metaProgress: MetaProgress;
  private state: ReturnType<typeof createInitialGameState>;
  private lastFrameMs: number | null = null;
  private started = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly deps: RuntimeControllerDeps,
  ) {
    this.windowRef = deps.windowRef ?? window;
    this.baseConfig = { ...DEFAULT_GAME_CONFIG, ...deps.config };
    const accessibility = readAccessibility(this.windowRef);
    this.state = createInitialGameState(
      this.baseConfig,
      accessibility.reducedMotion,
      "start",
      accessibility.highContrast,
    );
    this.metaProgress =
      typeof window === "undefined"
        ? DEFAULT_META_PROGRESS
        : readMetaProgress(this.windowRef.localStorage);
    this.host =
      deps.host ??
      new GameHost({
        canvas,
        width: this.baseConfig.width,
        height: this.baseConfig.height,
        zoom: 1,
      });
    this.audio = new AudioDirector(this.sfx);
    this.deps.setUiHandlers({
      primaryAction: () => this.handlePrimaryAction(),
      shopOption: (index) => this.handleShopOption(index),
    });
    this.host.setHandlers({
      onFrame: (timeMs) => this.handleFrame(timeMs),
      onMove: (clientX) => this.handlePointerMove(clientX),
      onPauseToggle: () => this.togglePause(),
      onStartOrRestart: () => this.handlePrimaryAction(),
      onCastMagic: () => this.handleCastMagic(),
    });
    this.publishAll();
  }

  start(): void {
    this.started = true;
    void this.audio.unlock();
    this.audio.setSettings(this.deps.getStartSettings());
    this.audio.syncScene(this.state.scene, this.state.scene);
    this.publishAll();
  }

  destroy(): void {
    this.audio.destroy();
    this.host.destroy();
  }

  forceSceneForTest(scene: Scene): void {
    this.state.scene = scene;
    this.publishAll();
  }

  setGameOverScoreForTest(score: number, lives = 0): void {
    this.state.run.score = Math.max(0, Math.round(score));
    this.state.run.lives = Math.max(0, Math.round(lives));
    this.state.scene = "gameover";
    this.metaProgress = finalizeRun(this.state, this.metaProgress, this.windowRef.localStorage);
    this.deps.setMetaProgress(this.metaProgress);
    this.publishAll();
  }

  unlockThreatTier2ForTest(): void {
    this.metaProgress = {
      ...this.metaProgress,
      progression: {
        threatTier2Unlocked: true,
      },
    };
    writeMetaProgress(this.windowRef.localStorage, this.metaProgress);
    this.deps.setMetaProgress(this.metaProgress);
    this.publishAll();
  }

  private handlePrimaryAction(): void {
    if (!this.started) {
      return;
    }
    if (this.state.scene === "start") {
      this.beginRun();
      return;
    }
    if (this.state.scene === "paused") {
      this.state.scene = "playing";
      this.audio.syncScene("playing", "paused");
      this.publishAll();
      return;
    }
    if (this.state.scene === "stageclear") {
      const previous = this.state.scene;
      if (
        !advanceEncounter(
          this.state,
          buildGameConfig(this.baseConfig, this.deps.getStartSettings()),
        )
      ) {
        this.metaProgress = finalizeRun(this.state, this.metaProgress, this.windowRef.localStorage);
        this.deps.setMetaProgress(this.metaProgress);
        this.audio.syncScene(this.state.scene, previous);
        this.publishAll();
        return;
      }
      this.audio.notifyStageChanged({ id: this.state.encounter.themeId, variant: 1 });
      this.audio.syncScene("playing", previous);
      this.publishAll();
      return;
    }
    if (
      this.state.scene === "gameover" ||
      this.state.scene === "clear" ||
      this.state.scene === "error"
    ) {
      this.resetToTitle();
    }
  }

  private handleShopOption(index: 0 | 1): void {
    if (this.state.scene !== "playing") {
      return;
    }
    const picked = applyShopSelection(this.state, index);
    if (picked) {
      this.audio.playItemPickup(picked);
    }
    this.publishAll();
  }

  private handlePointerMove(clientX: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const relativeX =
      rect.width > 0 ? ((clientX - rect.left) / rect.width) * this.baseConfig.width : clientX;
    this.state.combat.paddle.x = Math.max(
      0,
      Math.min(
        this.baseConfig.width - this.state.combat.paddle.width,
        relativeX - this.state.combat.paddle.width / 2,
      ),
    );
  }

  private togglePause(): void {
    if (this.state.scene === "playing") {
      this.state.scene = "paused";
      this.audio.syncScene("paused", "playing");
      this.publishAll();
      return;
    }
    if (this.state.scene === "paused") {
      this.state.scene = "playing";
      this.audio.syncScene("playing", "paused");
      this.publishAll();
    }
  }

  private handleCastMagic(): void {
    if (this.state.scene !== "playing") {
      return;
    }
    if (castActiveSkill(this.state)) {
      this.audio.playMagicCast();
    }
    this.publishAll();
  }

  private handleFrame(timeMs: number): void {
    if (!this.started || this.state.scene !== "playing") {
      this.lastFrameMs = timeMs;
      return;
    }
    const deltaSec =
      this.lastFrameMs === null
        ? 0
        : Math.min(0.05, Math.max(0, (timeMs - this.lastFrameMs) / 1000));
    this.lastFrameMs = timeMs;
    tickGame(this.state, buildGameConfig(this.baseConfig, this.deps.getStartSettings()), deltaSec);
    const nextScene = this.state.scene as Scene;
    if (nextScene === "stageclear") {
      completeStage(this.state);
      this.audio.syncScene("stageclear", "playing");
    } else if (nextScene === "gameover") {
      this.metaProgress = finalizeRun(this.state, this.metaProgress, this.windowRef.localStorage);
      this.deps.setMetaProgress(this.metaProgress);
      this.audio.syncScene("gameover", "playing");
    }
    this.publishAll();
  }

  private beginRun(): void {
    const settings = this.deps.getStartSettings();
    const config = buildGameConfig(this.baseConfig, settings);
    this.audio.setSettings(settings);
    this.state = createInitialGameState(
      config,
      settings.reducedMotionEnabled,
      "playing",
      settings.highContrastEnabled,
    );
    prepareEncounter(this.state);
    this.audio.notifyStageChanged({ id: this.state.encounter.themeId, variant: 1 });
    this.audio.syncScene("playing", "start");
    this.publishAll();
  }

  private resetToTitle(): void {
    const settings = this.deps.getStartSettings();
    this.state = createInitialGameState(
      buildGameConfig(this.baseConfig, settings),
      settings.reducedMotionEnabled,
      "start",
      settings.highContrastEnabled,
    );
    this.audio.syncScene("start", "clear");
    this.publishAll();
  }

  private publishAll(): void {
    this.deps.uiPort.syncHud(projectHudView(this.state, this.metaProgress));
    this.deps.uiPort.syncOverlay(projectOverlayView(this.state, this.metaProgress));
    this.deps.uiPort.syncShop(
      this.state.scene === "playing" ? projectShopView(this.state) : createHiddenShopView(),
    );
    this.host.render(projectRenderView(this.state));
    this.deps.setMetaProgress(this.metaProgress);
  }
}

export function createRuntimeController(
  canvas: HTMLCanvasElement,
  deps: RuntimeControllerDeps,
): RuntimeControllerPort {
  return new RuntimeController(canvas, deps);
}
