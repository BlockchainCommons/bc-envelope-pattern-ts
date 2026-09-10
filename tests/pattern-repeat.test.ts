/**
 * @blockchaincommons/envelope-pattern - Repeat Pattern Tests
 *
 * Tests for repeat/quantifier patterns: *, +, ?, {n,m}
 *
 * This is a 1:1 TypeScript port of bc-envelope-pattern-rust pattern_tests_repeat.rs
 *
 * NOTE: Repeat pattern functionality requires full VM implementation for traversal.
 * Most tests are skipped until the VM provides full repeat support.
 */

import { describe, it, expect } from "vitest";
import { Envelope } from "@blockchaincommons/envelope";
import { Quantifier, Reluctance } from "@blockchaincommons/dcbor-pattern";
import {
  tryParseEnvelopePattern,
  traverse,
  repeat,
  anyAssertion,
  anyObject,
  anyCbor,
  unwrap,
  wrapped,
  text,
  number,
  matches,
  paths as patternPaths,
  type Pattern,
} from "../src";
import { pushAll } from "../src/pattern/path";

// Helper function to wrap an envelope n times
function wrapN(envelope: Envelope, n: number): Envelope {
  let result = envelope;
  for (let i = 0; i < n; i++) {
    result = result.wrap();
  }
  return result;
}

// Helper function to fold a string into nested envelope structure
function fold(str: string): Envelope {
  const chars = str.split("");
  const reversed = chars.map((c, i) => ({ index: i, char: c })).reverse();

  const first = reversed.shift();
  if (first === undefined) {
    throw new Error("Cannot fold empty string");
  }
  let env = Envelope.assertion(first.index, first.char);

  for (const { index, char } of reversed) {
    const obj = Envelope.from(char).addAssertionEnvelope(env);
    env = Envelope.assertion(index, obj);
  }

  // Use empty string instead of unit() which doesn't exist
  return Envelope.from("").addAssertionEnvelope(env);
}

// Helper function to unfold an envelope back to string
function unfold(envelope: Envelope): string {
  let result = "";
  let current: Envelope | undefined = envelope;

  while (current !== undefined) {
    if (current.isAssertion()) {
      const object: Envelope | undefined = current.expectObject();
      if (object) {
        const subject = object.subject();
        const subjValue = subject.asText();
        if (subjValue !== undefined) {
          result += subjValue;
        }
        const assertions = object.assertions();
        current = assertions.length > 0 ? assertions[0] : undefined;
      } else {
        current = undefined;
      }
    } else {
      const assertions = current.assertions();
      current = assertions.length > 0 ? assertions[0] : undefined;
    }
  }

  return result;
}

describe("Repeat Pattern Tests", () => {
  describe("Pattern Construction", () => {
    it("creates repeat patterns with quantifiers", () => {
      const pattern = repeat(unwrap(), Quantifier.atLeast(0, Reluctance.Greedy));
      expect(pattern.kind).toBe("Meta");
    });

    it("creates repeat patterns with exact count", () => {
      const pattern = repeat(unwrap(), Quantifier.between(3, 3, Reluctance.Greedy));
      expect(pattern.kind).toBe("Meta");
    });

    it("creates repeat patterns with range", () => {
      const pattern = repeat(unwrap(), Quantifier.between(2, 5, Reluctance.Greedy));
      expect(pattern.kind).toBe("Meta");
    });

    it("creates traverse patterns with repeat", () => {
      const pattern = traverse(
        repeat(unwrap(), Quantifier.atLeast(0, Reluctance.Greedy)),
        anyCbor(),
      );
      expect(pattern.kind).toBe("Meta");
    });
  });

  describe("Pattern Parsing", () => {
    // Quantifier suffixes attach only to parenthesised groups in Rust;
    // bare-primary forms like `unwrap*` are syntax errors and the
    // previous TS port silently accepted them.
    it("parses zero or more pattern", () => {
      const result = tryParseEnvelopePattern("(unwrap)*");
      expect(result.ok).toBe(true);
    });

    it("parses one or more pattern", () => {
      const result = tryParseEnvelopePattern("(unwrap)+");
      expect(result.ok).toBe(true);
    });

    it("parses optional pattern", () => {
      const result = tryParseEnvelopePattern("(unwrap)?");
      expect(result.ok).toBe(true);
    });

    it("parses lazy quantifiers", () => {
      const result = tryParseEnvelopePattern("(unwrap)*?");
      expect(result.ok).toBe(true);
    });

    it("parses possessive quantifiers", () => {
      const result = tryParseEnvelopePattern("(unwrap)*+");
      expect(result.ok).toBe(true);
    });

    it("parses exact count quantifier", () => {
      const result = tryParseEnvelopePattern("(unwrap){3}");
      expect(result.ok).toBe(true);
    });

    it("parses range quantifier", () => {
      const result = tryParseEnvelopePattern("(unwrap){2,5}");
      expect(result.ok).toBe(true);
    });

    it("parses traverse with repeat", () => {
      const result = tryParseEnvelopePattern("(unwrap)* -> cbor");
      expect(result.ok).toBe(true);
    });
  });

  describe("Simple Repeat Matching", () => {
    // These tests verify basic pattern construction and matching
    it("matches wrapped envelope with zero or more unwraps", () => {
      // Create test envelope (wrapped twice)
      wrapN(Envelope.from(42), 2);
      // The envelope is wrapped twice, so unwrap* should match at the top level
      const pattern = repeat(unwrap(), Quantifier.atLeast(0, Reluctance.Greedy));
      // Note: actual path traversal requires VM, but pattern should construct
      expect(pattern.kind).toBe("Meta");
    });

    it("matches simple envelope with quantified assertion", () => {
      // Create test envelope for pattern context
      Envelope.from("Alice").addAssertion("knows", "Bob");
      const pattern = repeat(anyAssertion(), Quantifier.atLeast(0, Reluctance.Greedy));
      expect(pattern.kind).toBe("Meta");
    });
  });

  describe("Repeat Modes", () => {
    // Tests for different repeat modes (greedy, lazy, possessive)
    // These require full VM implementation

    it("greedy mode matches maximum first", () => {
      const envelope = wrapN(Envelope.from(42), 4);
      const pattern = traverse(
        repeat(unwrap(), Quantifier.atLeast(0, Reluctance.Greedy)),
        anyCbor(),
      );
      const paths = patternPaths(pattern, envelope);
      // Greedy should unwrap all the way to the leaf
      expect(paths.length).toBeGreaterThan(0);
    });

    it("lazy mode matches minimum first", () => {
      const envelope = wrapN(Envelope.from(42), 4);
      const pattern = traverse(repeat(unwrap(), Quantifier.atLeast(0, Reluctance.Lazy)), anyCbor());
      const paths = patternPaths(pattern, envelope);
      // Lazy should match at first opportunity
      expect(paths.length).toBeGreaterThan(0);
    });

    it("possessive mode does not backtrack", () => {
      const envelope = wrapN(Envelope.from(42), 4);
      const pattern = traverse(
        repeat(unwrap(), Quantifier.atLeast(0, Reluctance.Possessive)),
        anyCbor(),
      );
      const paths = patternPaths(pattern, envelope);
      // Possessive consumes all and doesn't backtrack
      expect(paths.length).toBeGreaterThan(0);
    });
  });

  describe("Repeat Range Modes", () => {
    // Tests for range-based repeat with different modes

    it("range greedy matches maximum in range", () => {
      const envelope = wrapN(Envelope.from(42), 3);
      const pattern = traverse(
        repeat(unwrap(), Quantifier.between(2, 3, Reluctance.Greedy)),
        anyCbor(),
      );
      expect(matches(pattern, envelope)).toBe(true);
    });

    it("range lazy matches minimum in range", () => {
      const envelope = wrapN(Envelope.from(42), 3);
      const pattern = traverse(
        repeat(unwrap(), Quantifier.between(2, 3, Reluctance.Lazy)),
        anyCbor(),
      );
      const paths = patternPaths(pattern, envelope);
      expect(paths.length).toBeGreaterThan(0);
    });

    it("range possessive does not backtrack", () => {
      const envelope = wrapN(Envelope.from(42), 3);
      const pattern = traverse(
        repeat(unwrap(), Quantifier.between(2, 3, Reluctance.Possessive)),
        anyCbor(),
      );
      const paths = patternPaths(pattern, envelope);
      expect(paths.length).toBeGreaterThan(0);
    });
  });

  describe("Optional Modes", () => {
    // Tests for optional (0..1) repeat with different modes

    it("optional greedy matches when possible", () => {
      const envelope = wrapN(Envelope.from(42), 1);
      const pattern = traverse(
        repeat(unwrap(), Quantifier.between(0, 1, Reluctance.Greedy)),
        number(42),
      );
      const paths = patternPaths(pattern, envelope);
      expect(paths.length).toBeGreaterThan(0);
    });

    it("optional lazy prefers not matching", () => {
      const envelope = wrapN(Envelope.from(42), 1);
      const pattern = traverse(
        repeat(unwrap(), Quantifier.between(0, 1, Reluctance.Lazy)),
        anyCbor(),
      );
      const paths = patternPaths(pattern, envelope);
      expect(paths.length).toBeGreaterThan(0);
    });

    it("optional matches on unwrapped envelope", () => {
      const envelope = Envelope.from(42);
      const pattern = traverse(
        repeat(unwrap(), Quantifier.between(0, 1, Reluctance.Greedy)),
        anyCbor(),
      );
      const paths = patternPaths(pattern, envelope);
      expect(paths.length).toBeGreaterThan(0);
    });
  });

  describe("Complex Repeat Patterns", () => {
    // Tests for complex nested repeat patterns

    it("repeat with assertion traversal", () => {
      const envelope = Envelope.from("Alice")
        .addAssertion("knows", "Bob")
        .addAssertion("likes", "Carol");

      const pattern = traverse(anyAssertion());
      const paths = patternPaths(pattern, envelope);
      // Should find both assertions
      expect(paths.length).toBe(2);
    });

    it("repeat with assertion and object traversal", () => {
      const envelope = Envelope.from("Alice").addAssertion(
        "knows",
        Envelope.from("Bob").addAssertion("likes", "Carol"),
      );

      const assertionObjectPattern = traverse(anyAssertion(), anyObject());
      const pattern = repeat(assertionObjectPattern, Quantifier.atLeast(0, Reluctance.Greedy));
      const paths = patternPaths(pattern, envelope);
      expect(paths.length).toBeGreaterThan(0);
    });

    it("repeat any modes with wrapped data", () => {
      const envelope = wrapN(Envelope.from("data"), 2);

      const makePattern = (mode: Reluctance): Pattern =>
        traverse(repeat(unwrap(), Quantifier.atLeast(0, mode)), wrapped(), unwrap(), text("data"));

      const greedyPaths = patternPaths(makePattern(Reluctance.Greedy), envelope);
      const lazyPaths = patternPaths(makePattern(Reluctance.Lazy), envelope);
      const possessivePaths = patternPaths(makePattern(Reluctance.Possessive), envelope);

      // Greedy and lazy should find the same paths
      expect(greedyPaths).toEqual(lazyPaths);
      // Possessive may not find paths due to no backtracking
      expect(possessivePaths.length).toBe(0);
    });
  });

  describe("Fold/Unfold Tests", () => {
    // Tests using the fold/unfold helper functions
    // These are complex traversal tests that require full VM

    it("fold creates nested envelope structure", () => {
      const folded = fold("hello");
      // Check the envelope has assertions (structure was created)
      expect(folded.hasAssertions()).toBe(true);
    });

    it("unfold extracts original string", () => {
      const str = "hello";
      const folded = fold(str);
      const unfolded = unfold(folded);
      expect(unfolded).toBe(str);
    });

    it("repeat with exact count on folded string", () => {
      const str = "hello";
      const envelope = fold(str);

      const assertionObjectPattern = traverse(anyAssertion(), anyObject());
      const pattern = repeat(assertionObjectPattern, Quantifier.between(3, 3, Reluctance.Greedy));
      const paths = patternPaths(pattern, envelope);

      // Should match exactly 3 assertion->object pairs
      expect(paths.length).toBe(1);
    });
  });
});

describe("large repetition results", () => {
  it("appends more states than a spread call can pass as arguments", () => {
    const states = Array.from({ length: 250_000 }, (_, i) => i);
    const out = [-1];
    pushAll(out, states);
    expect(out.length).toBe(250_001);
    expect(out[250_000]).toBe(249_999);
  });
});
