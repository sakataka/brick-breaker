import type { GameState, GhostSample } from "./types";

const GHOST_SAMPLE_INTERVAL_SEC = 0.08;
const MAX_GHOST_SAMPLES = 6000;

export function updateGhostRecording(state: GameState, deltaSec: number): void {
  if (!state.options.ghostReplayEnabled) {
    return;
  }
  const leader = state.balls[0];
  if (!leader) {
    return;
  }
  state.ghost.recordAccumulatorSec += deltaSec;
  if (state.ghost.recordAccumulatorSec < GHOST_SAMPLE_INTERVAL_SEC) {
    return;
  }
  state.ghost.recordAccumulatorSec = 0;
  state.ghost.recording.push({
    t: state.elapsedSec,
    paddleX: state.paddle.x,
    ballX: leader.pos.x,
    ballY: leader.pos.y,
  });
  if (state.ghost.recording.length > MAX_GHOST_SAMPLES) {
    state.ghost.recording.shift();
  }
}

export function getGhostPlaybackSample(playback: GhostSample[], elapsedSec: number): GhostSample | null {
  if (playback.length <= 0) {
    return null;
  }
  const target = Math.max(0, elapsedSec);
  let left = 0;
  let right = playback.length - 1;
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if ((playback[mid]?.t ?? 0) < target) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  const upper = playback[left];
  const lower = playback[Math.max(0, left - 1)] ?? upper;
  if (!upper) {
    return playback[playback.length - 1] ?? null;
  }
  if (upper.t <= lower.t || target <= lower.t) {
    return lower;
  }
  if (target >= upper.t) {
    return upper;
  }
  const ratio = (target - lower.t) / Math.max(0.0001, upper.t - lower.t);
  return {
    t: target,
    paddleX: lower.paddleX + (upper.paddleX - lower.paddleX) * ratio,
    ballX: lower.ballX + (upper.ballX - lower.ballX) * ratio,
    ballY: lower.ballY + (upper.ballY - lower.ballY) * ratio,
  };
}

export function normalizeGhostSamples(raw: unknown): GhostSample[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const samples: GhostSample[] = [];
  for (const item of raw) {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof (item as GhostSample).t !== "number" ||
      typeof (item as GhostSample).paddleX !== "number" ||
      typeof (item as GhostSample).ballX !== "number" ||
      typeof (item as GhostSample).ballY !== "number"
    ) {
      continue;
    }
    samples.push({
      t: (item as GhostSample).t,
      paddleX: (item as GhostSample).paddleX,
      ballX: (item as GhostSample).ballX,
      ballY: (item as GhostSample).ballY,
    });
  }
  return samples.slice(0, MAX_GHOST_SAMPLES).sort((a, b) => a.t - b.t);
}
