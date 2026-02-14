import type { SfxManager } from "../audio/sfx";
import type { GameConfig, GameState, RandomSource } from "./types";

export interface GameContext {
  config: GameConfig;
  random: RandomSource;
  sfx: SfxManager;
  state: GameState;
}
