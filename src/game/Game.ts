import { GameSession, type GameSessionDeps } from "./GameSession";
import type { Scene } from "./types";

export type GameDeps = GameSessionDeps;

export class Game {
  private readonly session: GameSession;

  constructor(canvas: HTMLCanvasElement, deps: GameDeps = {}) {
    this.session = new GameSession(canvas, deps);
  }

  start(): void {
    this.session.start();
  }

  destroy(): void {
    this.session.destroy();
  }

  debugForceScene(scene: Scene): void {
    this.session.debugForceScene(scene);
  }
}
