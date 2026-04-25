import { describe, expect, test } from "vite-plus/test";
import type Phaser from "phaser";
import { getFallbackThemeTokens } from "../../../game-v2/public/uiTheme";
import type { RenderViewState } from "../../../game-v2/public/renderTypes";
import { drawBackdropLayer } from "./backdrop";

interface GraphicsCall {
  name: string;
  args: unknown[];
}

function createGraphicsMock() {
  const calls: GraphicsCall[] = [];
  const graphics = {
    fillStyle: (...args: unknown[]) => {
      calls.push({ name: "fillStyle", args });
      return graphics;
    },
    fillRect: (...args: unknown[]) => {
      calls.push({ name: "fillRect", args });
      return graphics;
    },
    fillCircle: (...args: unknown[]) => {
      calls.push({ name: "fillCircle", args });
      return graphics;
    },
    lineStyle: (...args: unknown[]) => {
      calls.push({ name: "lineStyle", args });
      return graphics;
    },
    strokeRect: (...args: unknown[]) => {
      calls.push({ name: "strokeRect", args });
      return graphics;
    },
    strokeCircle: (...args: unknown[]) => {
      calls.push({ name: "strokeCircle", args });
      return graphics;
    },
    beginPath: (...args: unknown[]) => {
      calls.push({ name: "beginPath", args });
      return graphics;
    },
    moveTo: (...args: unknown[]) => {
      calls.push({ name: "moveTo", args });
      return graphics;
    },
    lineTo: (...args: unknown[]) => {
      calls.push({ name: "lineTo", args });
      return graphics;
    },
    strokePath: (...args: unknown[]) => {
      calls.push({ name: "strokePath", args });
      return graphics;
    },
  };
  return {
    calls,
    graphics: graphics as unknown as Phaser.GameObjects.Graphics,
  };
}

function createRenderView(): RenderViewState {
  const tokens = getFallbackThemeTokens();
  return {
    scene: "playing",
    elapsedSec: 1,
    bricks: [],
    paddle: {
      x: 420,
      y: 490,
      width: 120,
      height: 14,
      glowActive: false,
    },
    balls: [],
    trail: [],
    particles: [],
    impactRings: [],
    floatingTexts: [],
    flashMs: 0,
    flashColor: tokens.danger,
    reducedMotion: false,
    highContrast: false,
    shake: {
      active: false,
      offset: { x: 0, y: 0 },
    },
    fallingItems: [],
    progressRatio: 0,
    themeBandId: "chapter1",
    visual: {
      themeId: "chapter1",
      assetProfileId: "chapter1",
      chapterLabel: "Chapter 1",
      warningLevel: "calm",
      encounterEmphasis: "chapter",
      motionProfile: "full",
      tokens,
      backdropDepth: "stellar",
      arenaFrame: "clean",
      blockMaterial: "glass",
      particleDensity: 1,
      cameraIntensity: "steady",
      bossTone: "hunter",
    },
    arena: {
      depth: "stellar",
      frame: "clean",
      blockMaterial: "glass",
      particleDensity: 1,
      cameraIntensity: "steady",
      threatLevel: "low",
    },
    slowBallActive: false,
    multiballActive: false,
    shieldCharges: 0,
    showSceneOverlayTint: false,
    enemies: [],
    laserProjectiles: [],
    bossProjectiles: [],
    activeCues: [],
    fluxFieldActive: false,
  };
}

describe("drawBackdropLayer", () => {
  test("does not draw large circular ambient glows behind cleared bricks", () => {
    const { calls, graphics } = createGraphicsMock();

    drawBackdropLayer(graphics, createRenderView(), 960, 540, "#40f4ff", 1, 1);

    const fillCircleRadii = calls
      .filter((call) => call.name === "fillCircle")
      .map((call) => Number(call.args[2]));
    expect(Math.max(...fillCircleRadii)).toBeLessThanOrEqual(2);
  });
});
