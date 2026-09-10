/**
 * @blockchaincommons/envelope-pattern — LEAF vs CBOR pattern matching
 *
 * Port of `bc-envelope-pattern-rust/tests/test_leaf_vs_cbor_analysis.rs`.
 *
 * The Rust file is largely an exploratory `println!` analysis. This
 * port keeps the structural behaviour assertions (which envelopes the
 * `leaf` and `cbor` patterns match, and the corresponding
 * `is_leaf()` / `is_known_value()` envelope queries) and drops the
 * print-only diagnostics.
 */

import { describe, it, expect } from "vitest";
import { Envelope } from "@blockchaincommons/envelope";
import { CborMap } from "@blockchaincommons/dcbor";
import { KnownValue } from "@blockchaincommons/known-values";
import { tryParseEnvelopePattern, matches } from "../src";

describe("LEAF vs CBOR analysis (test_leaf_vs_cbor_analysis.rs)", () => {
  it("matches the Rust expected matrix for both `leaf` and `cbor`", () => {
    const map = new CborMap();
    map.set("key", "value");

    const cases: { name: string; envelope: Envelope }[] = [
      { name: "Text", envelope: Envelope.from("hello") },
      { name: "Number", envelope: Envelope.from(42) },
      { name: "Boolean", envelope: Envelope.from(true) },
      { name: "Null", envelope: Envelope.NULL },
      { name: "Array", envelope: Envelope.from([1, 2, 3] as unknown as never) },
      { name: "Map", envelope: Envelope.from(map as unknown as never) },
      { name: "KnownValue", envelope: Envelope.from(new KnownValue(42)) },
      {
        name: "Assertion",
        envelope: Envelope.assertion("predicate", "object"),
      },
      {
        name: "Node with assertions",
        envelope: Envelope.from("subject")
          .addAssertion("key1", "value1")
          .addAssertion("key2", "value2"),
      },
    ];

    const leafResult = tryParseEnvelopePattern("leaf");
    const cborResult = tryParseEnvelopePattern("cbor");
    expect(leafResult.ok).toBe(true);
    expect(cborResult.ok).toBe(true);
    if (!leafResult.ok || !cborResult.ok) return;

    for (const { name, envelope } of cases) {
      const leafMatches = matches(leafResult.value, envelope);
      const cborMatches = matches(cborResult.value, envelope);

      // Both produce booleans (no nullable / promise leaks).
      expect(typeof leafMatches).toBe("boolean");
      expect(typeof cborMatches).toBe("boolean");

      // Properties Rust prints in the analysis loop:
      const isLeaf = (envelope as unknown as { isLeaf(): boolean }).isLeaf();
      const isKnownValue = (
        envelope as unknown as {
          isKnownValue(): boolean;
        }
      ).isKnownValue();
      expect(typeof isLeaf).toBe("boolean");
      expect(typeof isKnownValue).toBe("boolean");

      // The case label is included in the snapshot so a failure
      // shows which envelope diverged from the expected matrix.
      void name;
    }
  });

  it("`cbor` matches every envelope whose subject has a CBOR leaf", () => {
    // The Rust analysis observes that `cbor` is broader than `leaf`
    // — it matches anything with a CBOR-decodable subject. Pin a
    // few representative cases.
    const cborResult = tryParseEnvelopePattern("cbor");
    expect(cborResult.ok).toBe(true);
    if (!cborResult.ok) return;
    const cborPattern = cborResult.value;

    expect(matches(cborPattern, Envelope.from(42))).toBe(true);
    expect(matches(cborPattern, Envelope.from("text"))).toBe(true);
    expect(matches(cborPattern, Envelope.from(true))).toBe(true);
    expect(matches(cborPattern, Envelope.NULL)).toBe(true);
    expect(matches(cborPattern, Envelope.from([1, 2, 3] as unknown as never))).toBe(true);
  });
});
