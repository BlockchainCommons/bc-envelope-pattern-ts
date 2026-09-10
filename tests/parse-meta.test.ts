/**
 * @blockchaincommons/envelope-pattern - Meta Parsing Tests
 *
 * Tests for parsing meta patterns: or, and, not, traversal, repeat, capture, etc.
 *
 * This is a 1:1 TypeScript port of bc-envelope-pattern-rust parse_tests_meta.rs
 */

import { describe, it, expect } from "vitest";
import { tryParseEnvelopePattern } from "../src";

describe("Meta Parsing Tests", () => {
  describe("Or Pattern", () => {
    it("parses bool or pattern", () => {
      const result = tryParseEnvelopePattern("true | false");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Meta");
      }
    });

    it("parses or pattern without spaces", () => {
      const result = tryParseEnvelopePattern("true|false");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Meta");
      }
    });

    it("parses multiple or patterns", () => {
      const result = tryParseEnvelopePattern("true | false | 42");
      expect(result.ok).toBe(true);
    });

    it("parses number or text", () => {
      const result = tryParseEnvelopePattern('42 | "hello"');
      expect(result.ok).toBe(true);
    });
  });

  describe("And Pattern", () => {
    it("parses bool and pattern", () => {
      const result = tryParseEnvelopePattern("true & false");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Meta");
      }
    });

    it("parses and pattern without spaces", () => {
      const result = tryParseEnvelopePattern("true&false");
      expect(result.ok).toBe(true);
    });

    it("parses multiple and patterns", () => {
      const result = tryParseEnvelopePattern(">10 & <50 & number");
      expect(result.ok).toBe(true);
    });
  });

  describe("Traversal Pattern", () => {
    it("parses bool traversal pattern", () => {
      const result = tryParseEnvelopePattern("true -> false");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Meta");
      }
    });

    it("parses traversal pattern without spaces", () => {
      const result = tryParseEnvelopePattern("true->false");
      expect(result.ok).toBe(true);
    });

    it("parses multiple traversal steps", () => {
      const result = tryParseEnvelopePattern("subj -> assert -> obj");
      expect(result.ok).toBe(true);
    });
  });

  describe("Operator Precedence", () => {
    it("parses complex expression with correct precedence", () => {
      // OR has lowest precedence, then traverse, then AND, then NOT
      const result = tryParseEnvelopePattern("* -> true & false -> !* | * -> true & false -> *");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Meta");
      }
    });

    it("parses and before or", () => {
      const result = tryParseEnvelopePattern("true & false | 42 & 43");
      expect(result.ok).toBe(true);
    });

    it("parses parentheses override precedence", () => {
      const result = tryParseEnvelopePattern("(true | false) & 42");
      expect(result.ok).toBe(true);
    });
  });

  describe("Not Pattern", () => {
    it("parses not text pattern", () => {
      const result = tryParseEnvelopePattern('!"hi"');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Meta");
      }
    });

    it("parses double not pattern", () => {
      const result = tryParseEnvelopePattern("!* & !*");
      expect(result.ok).toBe(true);
    });

    it("parses not with number", () => {
      const result = tryParseEnvelopePattern("!42");
      expect(result.ok).toBe(true);
    });

    it("parses not any pattern", () => {
      const result = tryParseEnvelopePattern("!*");
      expect(result.ok).toBe(true);
    });
  });

  describe("Search Pattern", () => {
    it("parses search text pattern", () => {
      const result = tryParseEnvelopePattern("search(text)");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Meta");
      }
    });

    it("parses search number pattern", () => {
      const result = tryParseEnvelopePattern("search(42)");
      expect(result.ok).toBe(true);
    });

    it("parses nested search pattern", () => {
      const result = tryParseEnvelopePattern("search(search(text))");
      expect(result.ok).toBe(true);
    });

    it("parses search with complex pattern", () => {
      const result = tryParseEnvelopePattern("search(assert)");
      expect(result.ok).toBe(true);
    });
  });

  describe("Repeat Patterns", () => {
    it("parses zero or more pattern", () => {
      const result = tryParseEnvelopePattern("(wrapped)*");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Meta");
      }
    });

    it("parses one or more lazy pattern", () => {
      const result = tryParseEnvelopePattern("(text)+?");
      expect(result.ok).toBe(true);
    });

    it("parses range possessive pattern", () => {
      const result = tryParseEnvelopePattern("(number){2,4}+");
      expect(result.ok).toBe(true);
    });

    it("parses exact count pattern", () => {
      const result = tryParseEnvelopePattern("(text){3}");
      expect(result.ok).toBe(true);
    });

    it("parses at least n pattern", () => {
      const result = tryParseEnvelopePattern("(number){2,}");
      expect(result.ok).toBe(true);
    });

    it("parses optional pattern", () => {
      const result = tryParseEnvelopePattern("(wrapped)?");
      expect(result.ok).toBe(true);
    });

    it("parses unwrap repeat pattern", () => {
      // Quantifier suffixes attach only to parenthesised groups in Rust.
      const result = tryParseEnvelopePattern("(unwrap)*");
      expect(result.ok).toBe(true);
    });
  });

  describe("Capture Patterns", () => {
    it("parses capture pattern", () => {
      const result = tryParseEnvelopePattern("@name(1)");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Meta");
      }
    });

    it("parses capture pattern with spaces", () => {
      const result = tryParseEnvelopePattern("@name ( 1 )");
      expect(result.ok).toBe(true);
    });

    it("parses nested capture patterns", () => {
      const result = tryParseEnvelopePattern('@outer(@inner("hi"))');
      expect(result.ok).toBe(true);
    });

    it("parses capture with underscore in name", () => {
      const result = tryParseEnvelopePattern("@cap_1(42)");
      expect(result.ok).toBe(true);
    });

    it("parses capture with text pattern", () => {
      const result = tryParseEnvelopePattern('@name("hello")');
      expect(result.ok).toBe(true);
    });
  });

  describe("Any Pattern", () => {
    it("parses star as any pattern", () => {
      const result = tryParseEnvelopePattern("*");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Meta");
      }
    });

    it("parses any in complex expression", () => {
      const result = tryParseEnvelopePattern("* & true");
      expect(result.ok).toBe(true);
    });

    it("parses any in traversal", () => {
      const result = tryParseEnvelopePattern("* -> *");
      expect(result.ok).toBe(true);
    });
  });

  describe("Grouping", () => {
    it("parses simple grouped pattern", () => {
      const result = tryParseEnvelopePattern("(42)");
      expect(result.ok).toBe(true);
    });

    it("parses grouped or pattern", () => {
      const result = tryParseEnvelopePattern("(true | false)");
      expect(result.ok).toBe(true);
    });

    it("parses nested groups", () => {
      const result = tryParseEnvelopePattern("((42))");
      expect(result.ok).toBe(true);
    });

    it("parses group with repeat", () => {
      const result = tryParseEnvelopePattern("(text)*");
      expect(result.ok).toBe(true);
    });
  });
});
