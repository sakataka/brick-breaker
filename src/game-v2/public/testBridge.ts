import type { Scene } from "./types";

export interface BrickBreakerTestBridge {
  forceScene: (scene: Scene) => void;
  setGameOverScore: (score: number, lives?: number) => void;
  unlockThreatTier2: () => void;
}
