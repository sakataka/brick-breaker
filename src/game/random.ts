import type { RandomSource } from "./domainTypes";

export const defaultRandomSource: RandomSource = {
  next: () => Math.random(),
};
