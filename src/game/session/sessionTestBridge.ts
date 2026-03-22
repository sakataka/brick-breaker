import type { GameTestScenario } from "../testBridge";
import type { GameConfig, GameState, RandomSource, Scene } from "../types";
import type { SessionPorts } from "./SessionPorts";
import type { SceneMachine } from "../sceneMachine";
import type { CoreEngine } from "../../core/engine";
import {
  forceSceneForTest,
  loadScenarioForTest,
  setGameOverScoreForTest,
  unlockThreatTier2ForTest,
} from "./runtimeTestSupport";

export interface SessionTestBridgeDeps {
  state: GameState;
  sceneMachine: SceneMachine;
  windowRef: Window;
  ports: SessionPorts;
  engine: CoreEngine;
  getConfig: () => GameConfig;
  getRandom: () => RandomSource;
  publishState: () => void;
}

export class SessionTestBridge {
  constructor(private readonly deps: SessionTestBridgeDeps) {}

  forceScene(scene: Scene): void {
    forceSceneForTest(scene, this.createContext());
  }

  setGameOverScore(score: number, lives: number): void {
    setGameOverScoreForTest(score, lives, this.createContext());
  }

  unlockThreatTier2(): void {
    unlockThreatTier2ForTest(this.createContext());
  }

  loadScenario(scenario: GameTestScenario): void {
    loadScenarioForTest(scenario, this.createContext());
  }

  private createContext() {
    return {
      state: this.deps.state,
      sceneMachine: this.deps.sceneMachine,
      windowRef: this.deps.windowRef,
      ports: this.deps.ports,
      engine: this.deps.engine,
      config: this.deps.getConfig(),
      random: this.deps.getRandom(),
      publishState: this.deps.publishState,
    };
  }
}
