import { describe, expect, test } from "bun:test";

import { getDailyChallenge } from "./dailyChallenge";

describe("dailyChallenge", () => {
  test("returns deterministic challenge for same day", () => {
    const date = new Date(2026, 1, 14);
    const a = getDailyChallenge(date);
    const b = getDailyChallenge(date);

    expect(a.key).toBe("2026-02-14");
    expect(a.seed).toBe(b.seed);
    expect(a.objective).toBe(b.objective);
  });

  test("changes seed by date", () => {
    const a = getDailyChallenge(new Date(2026, 1, 14));
    const b = getDailyChallenge(new Date(2026, 1, 15));

    expect(a.seed).not.toBe(b.seed);
  });
});
