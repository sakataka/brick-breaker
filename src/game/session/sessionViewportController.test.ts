import { describe, expect, test } from "vite-plus/test";
import { GAME_CONFIG } from "../config";
import { createInitialGameState } from "../stateFactory";
import { SessionViewportController } from "./sessionViewportController";

interface MediaQueryStub extends MediaQueryList {
  emit: () => void;
}

function createCanvasStub(wrapper: HTMLElement): HTMLCanvasElement {
  return {
    width: 777,
    height: 333,
    parentElement: wrapper,
    style: {
      width: "",
      height: "",
    },
  } as unknown as HTMLCanvasElement;
}

function createWrapperStub(width: number, height: number): HTMLElement {
  return {
    clientWidth: width,
    clientHeight: height,
  } as HTMLElement;
}

function createMediaQueryStub(): MediaQueryStub {
  const handlers = new Set<(...args: unknown[]) => void>();
  const toHandler = (handler: EventListenerOrEventListenerObject | null) =>
    typeof handler === "function" ? (handler as unknown as (...args: unknown[]) => void) : null;
  return {
    addEventListener: (_event: string, handler: EventListenerOrEventListenerObject | null) => {
      const normalized = toHandler(handler);
      if (!normalized) {
        return;
      }
      handlers.add(normalized);
    },
    removeEventListener: (_event: string, handler: EventListenerOrEventListenerObject | null) => {
      const normalized = toHandler(handler);
      if (!normalized) {
        return;
      }
      handlers.delete(normalized);
    },
    addListener: (handler: () => void) => {
      handlers.add(handler);
    },
    removeListener: (handler: () => void) => {
      handlers.delete(handler);
    },
    matches: false,
    media: "",
    onchange: null,
    dispatchEvent: () => true,
    emit: () => {
      for (const handler of handlers) {
        handler();
      }
    },
  } as unknown as MediaQueryStub;
}

describe("session/SessionViewportController", () => {
  test("adjustCanvasScale and syncViewportForDpi publish only when dpi changes", () => {
    const wrapper = createWrapperStub(1000, 600);
    const canvas = createCanvasStub(wrapper);
    const state = createInitialGameState(GAME_CONFIG, false, "start");
    const reducedMotionQuery = createMediaQueryStub();
    const highContrastQuery = createMediaQueryStub();
    let devicePixelRatio = 1;
    let publishCount = 0;

    const controller = new SessionViewportController({
      canvas,
      state,
      windowRef: {
        get devicePixelRatio() {
          return devicePixelRatio;
        },
      } as Window,
      reducedMotionQuery,
      highContrastQuery,
      getConfig: () => GAME_CONFIG,
      publishState: () => {
        publishCount += 1;
      },
    });

    controller.adjustCanvasScale();
    controller.syncViewportForDpi();
    devicePixelRatio = 2;
    controller.syncViewportForDpi();

    expect(canvas.style.width).toBe("1000px");
    expect(canvas.style.height).toBe("562.5px");
    expect(publishCount).toBe(2);
  });

  test("a11y listeners reapply shipped a11y state and publish", () => {
    const wrapper = createWrapperStub(1000, 600);
    const canvas = createCanvasStub(wrapper);
    const state = createInitialGameState(GAME_CONFIG, false, "start");
    state.run.options.reducedMotionEnabled = true;
    state.run.options.highContrastEnabled = true;
    state.ui.a11y.reducedMotion = false;
    state.ui.a11y.highContrast = false;
    state.ui.vfx.reducedMotion = false;
    const reducedMotionQuery = createMediaQueryStub();
    const highContrastQuery = createMediaQueryStub();
    let publishCount = 0;

    const controller = new SessionViewportController({
      canvas,
      state,
      windowRef: { devicePixelRatio: 1 } as Window,
      reducedMotionQuery,
      highContrastQuery,
      getConfig: () => GAME_CONFIG,
      publishState: () => {
        publishCount += 1;
      },
    });

    controller.bindA11yListeners();
    reducedMotionQuery.emit();
    controller.unbindA11yListeners();
    highContrastQuery.emit();

    expect(state.ui.a11y.reducedMotion).toBe(true);
    expect(state.ui.a11y.highContrast).toBe(true);
    expect(state.ui.vfx.reducedMotion).toBe(true);
    expect(publishCount).toBe(1);
  });
});
