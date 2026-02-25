import { describe, expect, test } from "bun:test";

import { applySessionViewport } from "./sessionViewport";

function createCanvasStub() {
  return {
    width: 777,
    height: 333,
    style: {
      width: "",
      height: "",
    },
  } as unknown as HTMLCanvasElement;
}

function createWrapperStub(width: number, height: number) {
  return {
    clientWidth: width,
    clientHeight: height,
  } as unknown as HTMLElement;
}

describe("applySessionViewport", () => {
  test("keeps canvas buffer size while updating css viewport", () => {
    const canvas = createCanvasStub();
    const wrapper = createWrapperStub(1000, 600);

    const dpr = applySessionViewport(canvas, wrapper, 960, 540, 3);

    expect(dpr).toBe(3);
    expect(canvas.width).toBe(777);
    expect(canvas.height).toBe(333);
    expect(canvas.style.width).toBe("1000px");
    expect(canvas.style.height).toBe("562.5px");
  });

  test("clamps invalid dpr input to supported range", () => {
    const canvas = createCanvasStub();
    const wrapper = createWrapperStub(1000, 600);

    const dprFromZero = applySessionViewport(canvas, wrapper, 960, 540, 0);
    const dprFromLarge = applySessionViewport(canvas, wrapper, 960, 540, 9);

    expect(dprFromZero).toBe(1);
    expect(dprFromLarge).toBe(4);
  });
});
