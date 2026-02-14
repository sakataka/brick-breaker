import type { RandomSource } from "./domainTypes";

export const defaultRandomSource: RandomSource = {
  next: () => Math.random(),
};

export function createSeededRandomSource(seed: number): RandomSource {
  let state = seed >>> 0 || 1;
  return {
    next: () => {
      state = (1664525 * state + 1013904223) >>> 0;
      return state / 0x100000000;
    },
  };
}
