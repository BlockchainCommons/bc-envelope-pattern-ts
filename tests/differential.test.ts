/**
 * Differential harness: every corpus recipe is run with the frozen baseline
 * bundle AND the working tree; displays, paths (as digests), captures,
 * `matches` and formatted output must be identical outside the enumerated
 * tombstones. Each tombstone names a deliberate behaviour change; once it
 * has landed it pins how many rows it covers, so a change can neither hide
 * behind a tombstone nor grow past it unnoticed.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import * as baselineMod from "./baseline/envelope-pattern-baseline.mjs";
import * as srcRoot from "../src";
import * as srcFormat from "../src/format";
const src = { ...srcRoot, ...srcFormat };
import {
  materialize,
  baselineAdapterFor,
  adapterFor,
  recipeName,
  type Recipe,
} from "./vectors/recipes";
import { currentDeps } from "./vectors/deps";
import { categories } from "./corpus/corpus";

const here = dirname(fileURLToPath(import.meta.url));
const BASELINE_SHA256 = readFileSync(join(here, "baseline/README.md"), "utf8").match(
  /Baseline sha256: ([0-9a-f]{64})/,
)?.[1];

const pattern = (r: Recipe): string =>
  r.k === "parse" ? r.src : r.k === "domain" ? "" : r.pattern;
const isMatch = (r: Recipe): boolean => r.k === "match" || r.k === "matches" || r.k === "format";
const bothAccept = (a: string, b: string): boolean =>
  !a.startsWith("throw") && !b.startsWith("throw");
/**
 * The working tree rejects text only with a coded `EnvelopePatternError`
 * (`throw:Code@start-end`). Any other throw, such as a `RangeError` from the
 * engine, reads as its message and fails the row, even when the baseline
 * threw the same.
 */
const coded = (outcome: string): boolean => !outcome.startsWith("throw:") || !/\s/.test(outcome);

/**
 * Tombstones: the only allowed differences. `landed: false` marks a change
 * the plan has not made yet (it must cover 0 rows); `landed: true` pins the
 * number of rows it covers today.
 */
const TOMBSTONES: {
  id: string;
  landed: boolean;
  rows: number;
  matches: (r: Recipe, baselineOutcome: string, currentOutcome: string) => boolean;
}[] = [
  {
    // The canonical dcbor registers its standard-tag summarisers, so a tag-1
    // leaf formats as a date where the pre-redesign compat printed `1(…)`.
    id: "date-summary",
    landed: true,
    rows: 62,
    matches: (r, a, b) =>
      r.k === "format" &&
      /\b1\(-?[\d.]+\)/.test(a) &&
      /\d{4}-\d\d-\d\d/.test(b) &&
      a.replace(/\b1\(-?[\d.]+\)/g, "") === b.replace(/\d{4}-\d\d-\d\d[^\s,\]]*/g, ""),
  },
  {
    // `[]` is any array (displayed `[{0,}]`), as in the reference.
    id: "empty-array-is-any-array",
    landed: true,
    rows: 9,
    matches: (r) => pattern(r).includes("[]"),
  },
  {
    // A parenthesised group outside an array matches as its content, as in
    // the reference; the baseline never matched it.
    id: "group-matches",
    landed: true,
    rows: 369,
    matches: (r, a, b) => isMatch(r) && /(?<![\w@])\(/.test(pattern(r)) && bothAccept(a, b),
  },
  {
    // Structure patterns compile to their own VM navigation, as in the
    // reference: `subj` on a node reports `[node, subject]` and a structure's
    // alternatives pop in stack order.
    id: "structure-paths-via-vm",
    landed: true,
    rows: 349,
    matches: (r, a, b) =>
      isMatch(r) &&
      /\b(subj|assert|assertpred|assertobj|pred|obj|wrapped|node|digest|elided|encrypted|compressed|obscured|leaf)\b/.test(
        pattern(r),
      ) &&
      bothAccept(a, b),
  },
  {
    // The pre-redesign dcbor-pattern inlined in the baseline: search
    // duplicates, integers beyond 2^53, the regex dialect, capture depth and
    // number display at `cbor(/…/)` leaves and in dcbor value forms.
    id: "inherited-dcbor-pattern",
    landed: true,
    rows: 2933,
    matches: (r) =>
      /cbor\(\/|\/[^/]*\/|h'|\d{16,}|\[.*\]|date'|'[^']*'|\d[eE][+-]?\d|\.\d{5,}|tagged\(\+\d|^[<>]=?\s*\d|\d\.\.\.\d|\s$|\b(array|map)\b/.test(
        pattern(r),
      ),
  },
  {
    // The formatter resolves known values by name through the format context.
    id: "known-value-names",
    landed: true,
    rows: 12,
    matches: (r, a, b) =>
      r.k === "format" && /KNOWN_VALUE '\d+'/.test(a) && !/KNOWN_VALUE '\d+'/.test(b),
  },
  {
    // `cbor(value)` displays nested containers on one line.
    id: "flat-cbor-display",
    landed: true,
    rows: 1,
    matches: (r, a) => r.k === "parse" && /^cbor\(/.test(pattern(r)) && a.includes("\n"),
  },
  {
    // `tagged(n)`, `tagged(name)` and `tagged(/re/)` parse as `tagged(…, *)`.
    id: "tagged-short-forms",
    landed: true,
    rows: 231,
    matches: (r) => /tagged\([^,()]*\)/.test(pattern(r)),
  },
  {
    // `@(`, `'+5'`, `tagged(+1, …)`, trimmed `date'…'` and `cbor(/…/)` bodies.
    id: "edge-spellings",
    landed: true,
    rows: 265,
    matches: (r) => /@\(|'\+\d|tagged\(\+|date'[^']* '|cbor\(\/ /.test(pattern(r)),
  },
  {
    // Numbers: no exponent form, no leading zeros, `-0`; the reference's
    // number spellings and display.
    id: "numbers",
    landed: true,
    rows: 78,
    matches: (r) => /\d[eE][+-]?\d|\b0\d|-0\.0|\.\d{5,}/.test(pattern(r)),
  },
  {
    // `traverse()` is `!*`; `and()` and `or()` need an operand.
    id: "empty-combinators",
    landed: true,
    rows: 77,
    matches: (r) => /traverse\(\)/.test(pattern(r)),
  },
  {
    // Nesting deeper than `maxDepth` is rejected with `NestingTooDeep`.
    id: "nesting-limit",
    landed: true,
    rows: 0,
    matches: (r) => pattern(r).length > 500,
  },
  {
    // `tagged(tag, p)` collapses paths and captures to the envelope, as the
    // reference does.
    id: "tagged-collapses",
    landed: true,
    rows: 24,
    matches: (r, a, b) => isMatch(r) && /tagged\(/.test(pattern(r)) && bothAccept(a, b),
  },
  {
    // One compiler: captures under structure patterns inside `search`, and a
    // leaf's captures followed by a traversal, are kept.
    id: "one-compiler-captures",
    landed: true,
    rows: 582,
    matches: (r, a, b) => isMatch(r) && /@\w+\(/.test(pattern(r)) && bothAccept(a, b),
  },
  {
    // Map patterns keep their constraints instead of degrading to `map`.
    id: "map-constraints",
    landed: true,
    rows: 225,
    matches: (r) => /\{[^{]/.test(pattern(r)) && !/\{\{/.test(pattern(r)),
  },
  {
    // Every pattern runs on the VM: `and` is sequential composition and keeps
    // captures and extended paths, `or` explores every alternative, an
    // explicit `{1}` group follows the repeat's "must move" rule.
    id: "vm-for-every-pattern",
    landed: true,
    rows: 212,
    matches: (r, a, b) => isMatch(r) && /[&|]|\{1(,1)?\}/.test(pattern(r)) && bothAccept(a, b),
  },
  {
    // The lexer reports an unrecognised character instead of skipping it, and
    // lexes the longest keyword instead of an identifier.
    id: "lexer-errors",
    landed: true,
    rows: 4133,
    matches: (_r, a, b) => a !== b && (a.startsWith("throw") || b.startsWith("throw")),
  },
];

const baseline = baselineAdapterFor(baselineMod);
const current = adapterFor(src, currentDeps);

describe("differential: baseline vs working tree", () => {
  it("baseline bundle integrity", () => {
    const sha = createHash("sha256")
      .update(readFileSync(join(here, "baseline/envelope-pattern-baseline.mjs")))
      .digest("hex");
    expect(sha).toBe(BASELINE_SHA256);
  });
  const covered = new Map<string, number>(TOMBSTONES.map((t) => [t.id, 0]));
  for (const [name, gen] of Object.entries(categories)) {
    it(`category ${name}`, { timeout: 900_000 }, () => {
      let n = 0;
      const diffs: string[] = [];
      for (const recipe of gen()) {
        n++;
        const a = materialize(baseline, recipe);
        const b = materialize(current, recipe);
        if (!coded(b)) {
          diffs.push(`${recipeName(recipe)}: ${b.slice(0, 80)}`);
          continue;
        }
        if (a === b) continue;
        const tomb = TOMBSTONES.find((t) => t.matches(recipe, a, b));
        if (tomb?.landed === true) covered.set(tomb.id, (covered.get(tomb.id) ?? 0) + 1);
        else diffs.push(`${recipeName(recipe)}: ${a.slice(0, 80)} !== ${b.slice(0, 80)}`);
      }
      expect(n).toBeGreaterThan(0);
      expect(diffs).toEqual([]);
    });
  }
  it("every tombstone covers exactly the rows it pins", () => {
    const rows: Record<string, number> = {};
    for (const t of TOMBSTONES) rows[t.id] = covered.get(t.id) ?? 0;
    const pinned: Record<string, number> = {};
    for (const t of TOMBSTONES) pinned[t.id] = t.rows;
    expect(rows).toEqual(pinned);
  });
});
