/**
 * Golden snapshot: the display of every hand-written pattern and
 * the outcome of every rejection. Reviewable, auto-updatable with -u.
 */
import { describe, it, expect } from "vitest";
import * as srcRoot from "../src";
import * as srcFormat from "../src/format";
const src = { ...srcRoot, ...srcFormat };
import { materialize, adapterFor } from "./vectors/recipes";
import { currentDeps } from "./vectors/deps";
import { PATTERNS } from "./corpus/patterns";

const api = adapterFor(src, currentDeps);

describe("golden: hand patterns", () => {
  it("display or rejection of every pattern", () => {
    const rows = PATTERNS.map(
      (src) => `${JSON.stringify(src)}: ${materialize(api, { k: "parse", src })}`,
    );
    expect(rows.length).toBeGreaterThan(200);
    expect(rows).toMatchSnapshot();
  });
});
