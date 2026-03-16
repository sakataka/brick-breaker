import { describe, expect, test } from "vite-plus/test";
import {
  ACTIVE_SKILL_CATALOG,
  CORE_MODULE_CATALOG,
  TACTICAL_PICKUP_CATALOG,
  validateModuleCatalog,
} from "./modules";

describe("module catalogs", () => {
  test("split the pickup catalog into core, tactical, and active groups", () => {
    expect(CORE_MODULE_CATALOG.length).toBeGreaterThan(0);
    expect(TACTICAL_PICKUP_CATALOG.length).toBeGreaterThan(0);
    expect(ACTIVE_SKILL_CATALOG.length).toBeGreaterThan(0);
  });

  test("validate module catalog coverage", () => {
    expect(validateModuleCatalog()).toEqual([]);
  });
});
