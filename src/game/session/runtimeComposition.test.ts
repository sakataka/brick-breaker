import type { RenderPort, UiPort } from "../../core/ports";
import { describe, expect, test, vi } from "vite-plus/test";
import { GAME_CONFIG } from "../config";
import type { MetaProgress } from "../metaProgress";
import { writeMetaProgress } from "../metaProgress";
import type { HudViewModel, OverlayViewModel, RenderViewState } from "../renderTypes";
import type { ShopUiView } from "../shopUi";
import type { RuntimeControllerDeps } from "./runtimeComposition";

vi.mock("../../phaser/GameHost", () => ({
  GameHost: class MockGameHost {
    setHandlers(): void {}
    render(_view: RenderViewState): void {}
    destroy(): void {}
  },
}));

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function createUiPortStub(): UiPort<OverlayViewModel, HudViewModel, ShopUiView> {
  return {
    syncOverlay() {},
    syncHud() {},
    syncShop() {},
  };
}

function createWindowStub(storage = new MemoryStorage()): Window {
  return {
    devicePixelRatio: 2,
    localStorage: storage,
    matchMedia: () =>
      ({
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        matches: false,
        media: "",
        onchange: null,
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
    requestAnimationFrame: () => 1,
    location: { reload() {} } as unknown as Location,
  } as unknown as Window;
}

function createDocumentStub(): Document {
  return {
    addEventListener() {},
    removeEventListener() {},
    visibilityState: "visible",
  } as unknown as Document;
}

function createCanvasStub(): HTMLCanvasElement {
  return {
    parentElement: {
      clientWidth: GAME_CONFIG.width,
      clientHeight: GAME_CONFIG.height,
    },
  } as unknown as HTMLCanvasElement;
}

function createHostStub() {
  return {
    setHandlers() {},
    render() {},
    destroy() {},
  } as unknown as RuntimeControllerDeps["host"];
}

function createDeps(overrides: Partial<RuntimeControllerDeps> = {}): RuntimeControllerDeps {
  return {
    uiPort: createUiPortStub(),
    getStartSettings: () => ({
      difficulty: "standard",
      reducedMotionEnabled: false,
      highContrastEnabled: false,
      bgmEnabled: true,
      sfxEnabled: true,
    }),
    setUiHandlers() {},
    setMetaProgress() {},
    documentRef: createDocumentStub(),
    windowRef: createWindowStub(),
    ...overrides,
  };
}

describe("session/runtimeComposition", () => {
  test("hydrates stored records into the initial runtime state and preserves injected host", async () => {
    const { createRuntimeComposition } = await import("./runtimeComposition");
    const storage = new MemoryStorage();
    const meta: MetaProgress = {
      progression: { threatTier2Unlocked: true },
      records: {
        overallBestScore: 1500,
        tier1BestScore: 1200,
        tier2BestScore: 1400,
        latestRunScore: 900,
      },
    };
    writeMetaProgress(storage, meta);
    const host = createHostStub();

    const composition = createRuntimeComposition(
      createCanvasStub(),
      createDeps({
        config: { initialLives: 5 },
        host,
        windowRef: createWindowStub(storage),
      }),
      {
        transition: () => ({ previous: "start", next: "start", changed: false }),
        syncAudioForTransition() {},
        publishState() {},
      },
    );

    expect(composition.host).toBe(host);
    expect(composition.baseConfig.initialLives).toBe(5);
    expect(composition.refs.config.initialLives).toBe(5);
    expect(composition.state.run.lives).toBe(5);
    expect(composition.state.run.records.overallBestScore).toBe(1500);
    expect(composition.state.run.records.tier1BestScore).toBe(1200);
    expect(composition.state.run.records.tier2BestScore).toBe(1400);
    expect(composition.actionDispatcher).toBeDefined();
    expect(composition.viewportController).toBeDefined();
  });

  test("uses the injected renderPort through SessionPorts publish", async () => {
    const { createRuntimeComposition } = await import("./runtimeComposition");
    const rendered: RenderViewState[] = [];
    const renderPort: RenderPort<RenderViewState> = {
      render(view) {
        rendered.push(view);
      },
    };

    const composition = createRuntimeComposition(createCanvasStub(), createDeps({ renderPort }), {
      transition: () => ({ previous: "start", next: "start", changed: false }),
      syncAudioForTransition() {},
      publishState() {},
    });

    composition.ports.publish(composition.state);

    expect(rendered).toHaveLength(1);
  });
});
