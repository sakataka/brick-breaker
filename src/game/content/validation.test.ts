import { describe, expect, test } from "vite-plus/test";
import { validateGameContent } from "./validation";

describe("content validation", () => {
  test("all shipped content passes the schema contract", () => {
    expect(validateGameContent()).toEqual([]);
  });
});
