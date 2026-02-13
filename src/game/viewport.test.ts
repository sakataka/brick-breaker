import { describe, expect, test } from "bun:test";

import { computeCanvasFit, computeRenderScale } from "./viewport";

describe("computeCanvasFit", () => {
  test("falls back to minimum size when wrapper is zero", () => {
    const fit = computeCanvasFit(0, 0, 16 / 9);
    expect(fit.cssWidth).toBe(320);
    expect(fit.cssHeight).toBe(180);
  });

  test("keeps aspect ratio in regular layout", () => {
    const fit = computeCanvasFit(1000, 600, 16 / 9);
    expect(Math.round(fit.cssWidth)).toBe(1000);
    expect(Math.round(fit.cssHeight)).toBe(563);
  });
});

describe("computeRenderScale", () => {
  test("uses higher backing scale for large displays and clamps to max", () => {
    const scaleRegular = computeRenderScale(960, 540, 960, 540, 1);
    expect(scaleRegular).toBe(1);

    const scale4k = computeRenderScale(3840, 2160, 960, 540, 2);
    expect(scale4k).toBe(4);
  });

  test("stays at least 1 for tiny layouts", () => {
    const scale = computeRenderScale(320, 180, 960, 540, 1);
    expect(scale).toBe(1);
  });
});
