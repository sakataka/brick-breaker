import type { Scene } from "./types";

export type GameTestScenario = "stage11_legends" | "boss_telegraph" | "pickup_toast";

export interface BrickBreakerTestBridge {
  forceScene: (scene: Scene) => void;
  setGameOverScore: (score: number, lives?: number) => void;
  unlockThreatTier2: () => void;
  loadScenario: (scenario: GameTestScenario) => void;
}
