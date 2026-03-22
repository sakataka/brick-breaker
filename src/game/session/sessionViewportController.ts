import type { GameConfig, GameState } from "../types";
import { applySessionViewport } from "./sessionViewport";

export interface SessionViewportControllerDeps {
  canvas: HTMLCanvasElement;
  state: GameState;
  windowRef: Window;
  reducedMotionQuery: MediaQueryList;
  highContrastQuery: MediaQueryList;
  getConfig: () => Pick<GameConfig, "width" | "height">;
  publishState: () => void;
}

export class SessionViewportController {
  private lastDevicePixelRatio = 1;

  constructor(private readonly deps: SessionViewportControllerDeps) {}

  bindA11yListeners(): void {
    addMediaListener(this.deps.reducedMotionQuery, this.handleAccessibilityChange);
    addMediaListener(this.deps.highContrastQuery, this.handleAccessibilityChange);
  }

  unbindA11yListeners(): void {
    removeMediaListener(this.deps.reducedMotionQuery, this.handleAccessibilityChange);
    removeMediaListener(this.deps.highContrastQuery, this.handleAccessibilityChange);
  }

  adjustCanvasScale(): void {
    const wrapper = this.deps.canvas.parentElement;
    if (!wrapper) {
      return;
    }
    const config = this.deps.getConfig();
    const currentDpr = applySessionViewport(
      this.deps.canvas,
      wrapper,
      config.width,
      config.height,
      this.deps.windowRef.devicePixelRatio || 1,
    );
    this.lastDevicePixelRatio = currentDpr;
    this.deps.publishState();
  }

  syncViewportForDpi(): void {
    const currentDpr = Math.max(1, Math.min(4, this.deps.windowRef.devicePixelRatio || 1));
    if (Math.abs(currentDpr - this.lastDevicePixelRatio) < 0.01) {
      return;
    }
    this.adjustCanvasScale();
  }

  applyAccessibilitySnapshot(): void {
    this.deps.state.ui.a11y.reducedMotion = this.deps.state.run.options.reducedMotionEnabled;
    this.deps.state.ui.a11y.highContrast = this.deps.state.run.options.highContrastEnabled;
    this.deps.state.ui.vfx.reducedMotion = this.deps.state.run.options.reducedMotionEnabled;
  }

  private readonly handleAccessibilityChange = (): void => {
    this.applyAccessibilitySnapshot();
    this.deps.publishState();
  };
}

function addMediaListener(query: MediaQueryList, handler: () => void): void {
  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", handler);
    return;
  }
  query.addListener(handler);
}

function removeMediaListener(query: MediaQueryList, handler: () => void): void {
  if (typeof query.removeEventListener === "function") {
    query.removeEventListener("change", handler);
    return;
  }
  query.removeListener(handler);
}
