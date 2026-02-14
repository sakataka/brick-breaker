import { describe, expect, test } from "bun:test";

import { createSeededRandomSource } from "./random";

describe("random", () => {
  test("seeded generator is deterministic", () => {
    const a = createSeededRandomSource(123456);
    const b = createSeededRandomSource(123456);

    const seqA = [a.next(), a.next(), a.next(), a.next()];
    const seqB = [b.next(), b.next(), b.next(), b.next()];

    expect(seqA).toEqual(seqB);
  });

  test("different seeds create different sequences", () => {
    const a = createSeededRandomSource(1);
    const b = createSeededRandomSource(2);

    const seqA = [a.next(), a.next(), a.next()];
    const seqB = [b.next(), b.next(), b.next()];

    expect(seqA).not.toEqual(seqB);
  });
});
