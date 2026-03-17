export type Scene =
  | "start"
  | "story"
  | "playing"
  | "paused"
  | "gameover"
  | "stageclear"
  | "clear"
  | "error";

export type Difficulty = "casual" | "standard" | "hard";

export interface GameAudioSettings {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
}
