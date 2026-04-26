import { describe, expect, test, vi } from "vitest";
import type { Scene } from "../public/types";
vi.mock("./RuntimeController", () => ({
  createRuntimeController: vi.fn(),
}));
import { GameSession } from "./GameSession";

describe("game-v2 GameSession", () => {
  test("preserves the public session surface while delegating to the runtime controller", () => {
    const start = vi.fn();
    const destroy = vi.fn();
    const forceSceneForTest = vi.fn<(scene: Scene) => void>();
    const setGameOverScoreForTest = vi.fn<(score: number, lives?: number) => void>();
    const unlockThreatTier2ForTest = vi.fn();

    const session = new GameSession({} as HTMLCanvasElement, {
      controllerFactory: () => ({
        start,
        destroy,
        forceSceneForTest,
        setGameOverScoreForTest,
        unlockThreatTier2ForTest,
      }),
    });

    session.start();
    session.debugForceScene("paused");
    session.debugSetGameOverScore(4200, 2);
    session.createTestBridge().unlockThreatTier2();
    session.destroy();

    expect(start).toHaveBeenCalledTimes(1);
    expect(forceSceneForTest).toHaveBeenCalledWith("paused");
    expect(setGameOverScoreForTest).toHaveBeenCalledWith(4200, 2);
    expect(unlockThreatTier2ForTest).toHaveBeenCalledTimes(1);
    expect(destroy).toHaveBeenCalledTimes(1);
  });
});
