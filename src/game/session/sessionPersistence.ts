import { normalizeGhostSamples } from "../ghostSystem";
import type { GameState } from "../types";

const MAX_GHOST_RECORDS = 3000;

export function prepareGhostPlayback(state: GameState, storage: Storage, storageKey: string): void {
  state.ghost.playbackEnabled = state.options.ghostReplayEnabled;
  state.ghost.recording = [];
  state.ghost.recordAccumulatorSec = 0;
  if (!state.options.ghostReplayEnabled) {
    state.ghost.playback = [];
    return;
  }
  try {
    const raw = storage.getItem(storageKey);
    if (!raw) {
      state.ghost.playback = [];
      return;
    }
    const parsed = JSON.parse(raw);
    state.ghost.playback = normalizeGhostSamples(parsed);
  } catch {
    state.ghost.playback = [];
  }
}

export function saveGhostRecording(state: GameState, storage: Storage, storageKey: string): void {
  if (!state.options.ghostReplayEnabled || state.ghost.recording.length <= 0) {
    return;
  }
  try {
    const trimmed = state.ghost.recording.slice(-MAX_GHOST_RECORDS);
    storage.setItem(storageKey, JSON.stringify(trimmed));
  } catch {}
}
