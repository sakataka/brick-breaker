import { describe, expect, test } from "bun:test";

import {
  applyBrickDamage,
  applyDirectBrickDamage,
  destroyBrickImmediately,
  getDefaultBrickHp,
} from "./brickDamage";
import type { Brick } from "./types";

describe("brickDamage", () => {
  test("resolves default hp by brick kind", () => {
    expect(getDefaultBrickHp({ id: 1, x: 0, y: 0, width: 1, height: 1, alive: true })).toBe(1);
    expect(getDefaultBrickHp({ id: 2, x: 0, y: 0, width: 1, height: 1, alive: true, kind: "durable" })).toBe(
      2,
    );
    expect(getDefaultBrickHp({ id: 3, x: 0, y: 0, width: 1, height: 1, alive: true, kind: "boss" })).toBe(12);
  });

  test("armored brick survives explosion at 1 hp", () => {
    const brick: Brick = {
      id: 1,
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      alive: true,
      kind: "armored",
      hp: 2,
    };

    const first = applyBrickDamage(brick, "explosion");
    expect(first.destroyed).toBe(false);
    expect(brick.hp).toBe(1);

    const second = applyBrickDamage(brick, "explosion");
    expect(second.destroyed).toBe(false);
    expect(brick.alive).toBe(true);
    expect(brick.hp).toBe(1);
  });

  test("regen brick restores hp once on direct hit", () => {
    const brick: Brick = {
      id: 1,
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      alive: true,
      kind: "regen",
      hp: 2,
      regenCharges: 1,
    };

    expect(applyDirectBrickDamage(brick)).toBe(false);
    expect(brick.hp).toBe(2);
    expect(brick.regenCharges).toBe(0);

    expect(applyDirectBrickDamage(brick)).toBe(false);
    expect(brick.hp).toBe(1);

    expect(applyDirectBrickDamage(brick)).toBe(true);
    expect(brick.alive).toBe(false);
  });

  test("destroyBrickImmediately enforces magic instant destroy behavior", () => {
    const brick: Brick = {
      id: 1,
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      alive: true,
      kind: "boss",
      hp: 12,
    };

    expect(destroyBrickImmediately(brick)).toBe(true);
    expect(brick.alive).toBe(false);
    expect(brick.hp).toBe(0);
    expect(destroyBrickImmediately(brick)).toBe(false);
  });
});
