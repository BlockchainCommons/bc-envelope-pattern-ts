/**
 * Golden vector suite: the committed freeze of every pattern's
 * display, matches and formatted output. Changes only through
 * `bun run vectors:generate`.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import * as srcRoot from "../src";
import * as srcFormat from "../src/format";
const src = { ...srcRoot, ...srcFormat };
import { materialize, adapterFor, type Recipe, type Outcome } from "./vectors/recipes";
import { currentDeps } from "./vectors/deps";

const here = dirname(fileURLToPath(import.meta.url));
const { count, vectors } = JSON.parse(readFileSync(join(here, "vectors/vectors.json"), "utf8")) as {
  count: number;
  vectors: { name: string; recipe: Recipe; expect: Outcome }[];
};
const api = adapterFor(src, currentDeps);

describe("golden vectors (frozen)", () => {
  it("fixture is self-consistent and non-trivial", () => {
    expect(vectors.length).toBe(count);
    expect(vectors.length).toBeGreaterThanOrEqual(1500);
  });
  it("every vector matches", () => {
    const diffs: string[] = [];
    for (const v of vectors) {
      const got = materialize(api, v.recipe);
      if (got !== v.expect)
        diffs.push(`${v.name}: ${got.slice(0, 80)} !== ${v.expect.slice(0, 80)}`);
    }
    expect(diffs).toEqual([]);
  });
});
