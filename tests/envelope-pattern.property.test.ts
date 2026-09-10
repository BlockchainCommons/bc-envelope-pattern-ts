/**
 * Properties: the display of a parsed pattern re-parses to the same
 * display; every match path is a walk of the haystack; `matches` is `paths`
 * non-empty; a capture-free pattern yields the same paths through
 * `pathsWithCaptures`; every capture path starts at the root; obscuring a
 * matched element removes every path through it. Properties the reference
 * itself violates snapshot their violations instead of failing.
 */
import { describe, it, expect } from "vitest";
import { Envelope } from "@blockchaincommons/envelope";
import * as src from "../src";
import { PATTERNS } from "./corpus/patterns";
import { HAYSTACKS } from "./corpus/corpus";
import { unhex } from "./vectors/recipes";

const parseOk = (s: string): src.Pattern | undefined => {
  const r = src.tryParseEnvelopePattern(s);
  return r.ok ? r.value : undefined;
};
const parsed = PATTERNS.map(parseOk).filter((p): p is src.Pattern => p !== undefined);
const haystacks = HAYSTACKS.map((h) => Envelope.fromBytes(unhex(h)));

/** The elements one traversal step can reach: children, and `unwrap`'s content of a wrapped subject. */
const isChild = (parent: Envelope, child: Envelope): boolean => {
  const c = parent.case;
  const d = child.digest();
  const eq = (e: Envelope): boolean => e.digest().equals(d);
  const subject = parent.subject();
  if (subject.isWrapped() && eq(subject.unwrap())) return true;
  switch (c.type) {
    case "node":
      return eq(c.subject) || c.assertions.some(eq);
    case "wrapped":
      return eq(c.envelope);
    case "assertion":
      return eq(c.assertion.predicate()) || eq(c.assertion.object());
    default:
      return false;
  }
};

describe("properties", () => {
  it("display re-parses to the same display", () => {
    expect(parsed.length).toBeGreaterThan(150);
    const violations: string[] = [];
    for (const p of parsed) {
      const shown = src.display(p);
      const again = parseOk(shown);
      if (again === undefined) violations.push(`${shown}: does not re-parse`);
      else if (src.display(again) !== shown)
        violations.push(`${shown}: re-parses as ${src.display(again)}`);
    }
    expect(violations).toMatchSnapshot();
  });

  it("every path is a walk from the root, and matches ⇔ paths non-empty", () => {
    let checked = 0;
    const violations: string[] = [];
    // dcbor sub-paths (`cbor(…)`) descend into a leaf's CBOR; the walk check covers envelope steps
    for (const p of parsed.filter((_, i) => i % 3 === 0 && !src.display(_).includes("cbor("))) {
      for (const h of haystacks) {
        const paths = src.paths(p, h);
        expect(src.matches(p, h)).toBe(paths.length > 0);
        for (const path of paths) {
          const shown = `${src.display(p)} on ${h.digest().toHex().slice(0, 8)}`;
          if (path.length === 0) {
            violations.push(`${shown}: empty path`);
            continue;
          }
          // a path starts at the haystack, or at one of its direct elements
          // (`assert` reports the assertions themselves, as the reference does)
          if (!path[0].digest().equals(h.digest()) && !isChild(h, path[0]))
            violations.push(`${shown}: starts at ${path[0].digest().toHex().slice(0, 8)}`);
          for (let i = 1; i < path.length; i++) {
            // dcbor sub-paths continue below a leaf as leaf envelopes; the
            // envelope walk stops at the first leaf
            if (!path[i - 1].isNode() && !path[i - 1].isWrapped() && !path[i - 1].isAssertion())
              break;
            if (!isChild(path[i - 1], path[i])) {
              violations.push(`${shown}: step ${i} is not a child`);
              break;
            }
          }
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(100);
    expect(violations).toMatchSnapshot();
  });

  it("a capture-free pattern yields the same paths with and without captures", () => {
    const violations: string[] = [];
    for (const p of parsed.filter((_, i) => i % 5 === 0 && !src.display(_).includes("@"))) {
      for (const h of haystacks.filter((_, i) => i % 3 === 0)) {
        const a = src
          .paths(p, h)
          .map((path) => path.map((e) => e.digest().toHex().slice(0, 8)).join(","));
        const r = src.pathsWithCaptures(p, h);
        const b = r.paths.map((path) => path.map((e) => e.digest().toHex().slice(0, 8)).join(","));
        if (a.join("|") !== b.join("|") || r.captures.size !== 0)
          violations.push(`${src.display(p)}: ${a.join("|")} vs ${b.join("|")}`);
      }
    }
    expect(violations).toMatchSnapshot();
  });

  it("every capture path starts at the root or one of its elements", () => {
    const violations: string[] = [];
    for (const p of parsed.filter((q) => src.display(q).includes("@"))) {
      for (const h of haystacks.filter((_, i) => i % 4 === 0)) {
        const r = src.pathsWithCaptures(p, h);
        for (const [name, capturePaths] of r.captures) {
          for (const path of capturePaths) {
            const first = path[0];
            if (first === undefined) {
              violations.push(`${src.display(p)}: ${name} empty`);
              continue;
            }
            if (
              !first.digest().equals(h.digest()) &&
              !isChild(h, first) &&
              !h.subject().digest().equals(first.digest())
            )
              violations.push(
                `${src.display(p)}: ${name} starts at ${first.digest().toHex().slice(0, 8)}`,
              );
          }
        }
      }
    }
    expect(violations).toMatchSnapshot();
  });

  it("display is a fixpoint for generated patterns", () => {
    const next = ((seed: number) => {
      let x = seed >>> 0 || 1;
      return () => {
        x ^= x << 13;
        x >>>= 0;
        x ^= x >>> 17;
        x ^= x << 5;
        x >>>= 0;
        return x;
      };
    })(0x2545f491);
    const atoms = [
      '{"a": *}',
      "{{1,2}}",
      "/(?i)abc/",
      "h'/(?-u)\\xff/'",
      "tagged(1)",
      "tagged(date)",
      "cbor([[1, 2]])",
      'cbor({"a": [1, {"b": 2}]})',
      "date'2023-06-15'",
      "'isA'",
      "text",
      "@n(number)",
      "subj(text)",
      "unwrap",
    ];
    const combine = (depth: number): string => {
      const a = atoms[next() % atoms.length];
      if (depth === 0) return a;
      switch (next() % 5) {
        case 0:
          return `${combine(depth - 1)} | ${combine(depth - 1)}`;
        case 1:
          return `${combine(depth - 1)} & ${combine(depth - 1)}`;
        case 2:
          return `search(${combine(depth - 1)})`;
        case 3:
          return `(${combine(depth - 1)})*`;
        default:
          return `${combine(depth - 1)} -> ${combine(depth - 1)}`;
      }
    };
    let checked = 0;
    const violations: string[] = [];
    for (let i = 0; i < 200; i++) {
      const p = parseOk(combine(1 + (next() % 2)));
      if (p === undefined) continue;
      const shown = src.display(p);
      const again = parseOk(shown);
      if (again === undefined) violations.push(`${shown}: does not re-parse`);
      else if (src.display(again) !== shown)
        violations.push(`${shown}: re-parses as ${src.display(again)}`);
      checked++;
    }
    expect(checked).toBeGreaterThan(50);
    expect(violations).toMatchSnapshot();
  });

  it("eliding a matched assertion removes the paths through it", () => {
    const alice = Envelope.from("Alice")
      .addAssertion("knows", "Bob")
      .addAssertion("knows", "Carol");
    const bob = alice.assertions().find((a) => a.expectObject().asText() === "Bob") as Envelope;
    const p = parseOk('search("Bob")');
    expect(p).toBeDefined();
    expect(src.paths(p as src.Pattern, alice).length).toBeGreaterThan(0);
    const elided = alice.elide({ removing: [bob] });
    expect(src.paths(p as src.Pattern, elided).length).toBe(0);
  });
});
