import type { Scene } from "./types";

export interface BrickBreakerTestBridge {
  forceScene: (scene: Scene) => void;
  setGameOverScore: (score: number, lives?: number) => void;
  unlockThreatTier2: () => void;
}

export function shouldExposeTestBridge(env: { VITE_BRICK_BREAKER_TEST_BRIDGE?: string }): boolean {
  return env.VITE_BRICK_BREAKER_TEST_BRIDGE === "1";
}
