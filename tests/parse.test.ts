/**
 * @blockchaincommons/envelope-pattern - Parser tests
 *
 * Tests for the pattern parser.
 */

import { describe, it, expect } from "vitest";
import { tryParseEnvelopePattern } from "../src";

describe("Parser", () => {
  describe("Simple Patterns", () => {
    it("parses any pattern (*)", () => {
      const result = tryParseEnvelopePattern("*");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Meta");
      }
    });

    it("parses bool keyword", () => {
      const result = tryParseEnvelopePattern("bool");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Leaf");
      }
    });

    it("parses true literal", () => {
      const result = tryParseEnvelopePattern("true");
      expect(result.ok).toBe(true);
    });

    it("parses false literal", () => {
      const result = tryParseEnvelopePattern("false");
      expect(result.ok).toBe(true);
    });

    it("parses number keyword", () => {
      const result = tryParseEnvelopePattern("number");
      expect(result.ok).toBe(true);
    });

    it("parses text keyword", () => {
      const result = tryParseEnvelopePattern("text");
      expect(result.ok).toBe(true);
    });

    it("parses null keyword", () => {
      const result = tryParseEnvelopePattern("null");
      expect(result.ok).toBe(true);
    });

    it("parses date keyword", () => {
      const result = tryParseEnvelopePattern("date");
      expect(result.ok).toBe(true);
    });

    it("parses bstr keyword", () => {
      const result = tryParseEnvelopePattern("bstr");
      expect(result.ok).toBe(true);
    });

    it("parses known keyword", () => {
      const result = tryParseEnvelopePattern("known");
      expect(result.ok).toBe(true);
    });
  });

  describe("Number Patterns", () => {
    it("parses positive integer", () => {
      const result = tryParseEnvelopePattern("42");
      expect(result.ok).toBe(true);
    });

    it("parses negative integer", () => {
      const result = tryParseEnvelopePattern("-42");
      expect(result.ok).toBe(true);
    });

    it("parses float", () => {
      const result = tryParseEnvelopePattern("3.14");
      expect(result.ok).toBe(true);
    });

    it("parses Infinity", () => {
      const result = tryParseEnvelopePattern("Infinity");
      expect(result.ok).toBe(true);
    });

    it("parses -Infinity", () => {
      const result = tryParseEnvelopePattern("-Infinity");
      expect(result.ok).toBe(true);
    });

    it("parses NaN", () => {
      const result = tryParseEnvelopePattern("NaN");
      expect(result.ok).toBe(true);
    });
  });

  describe("String Patterns", () => {
    it("parses string literal", () => {
      const result = tryParseEnvelopePattern('"hello"');
      expect(result.ok).toBe(true);
    });

    it("parses string with escapes", () => {
      const result = tryParseEnvelopePattern('"hello\\nworld"');
      expect(result.ok).toBe(true);
    });
  });

  describe("Regex Patterns", () => {
    it("parses text regex", () => {
      const result = tryParseEnvelopePattern("/[a-z]+/");
      expect(result.ok).toBe(true);
    });
  });

  describe("Hex Patterns", () => {
    it("parses hex byte pattern", () => {
      const result = tryParseEnvelopePattern("h'deadbeef'");
      expect(result.ok).toBe(true);
    });
  });

  describe("Array Patterns", () => {
    it("parses empty array", () => {
      const result = tryParseEnvelopePattern("[]");
      expect(result.ok).toBe(true);
    });

    it("parses any array", () => {
      const result = tryParseEnvelopePattern("[*]");
      expect(result.ok).toBe(true);
    });
  });

  describe("Structure Patterns", () => {
    it("parses node keyword", () => {
      const result = tryParseEnvelopePattern("node");
      expect(result.ok).toBe(true);
    });

    it("parses subj keyword", () => {
      const result = tryParseEnvelopePattern("subj");
      expect(result.ok).toBe(true);
    });

    it("parses pred keyword", () => {
      const result = tryParseEnvelopePattern("pred");
      expect(result.ok).toBe(true);
    });

    it("parses obj keyword", () => {
      const result = tryParseEnvelopePattern("obj");
      expect(result.ok).toBe(true);
    });

    it("parses assert keyword", () => {
      const result = tryParseEnvelopePattern("assert");
      expect(result.ok).toBe(true);
    });

    it("parses wrapped keyword", () => {
      const result = tryParseEnvelopePattern("wrapped");
      expect(result.ok).toBe(true);
    });

    it("parses unwrap keyword", () => {
      const result = tryParseEnvelopePattern("unwrap");
      expect(result.ok).toBe(true);
    });

    it("parses digest keyword", () => {
      const result = tryParseEnvelopePattern("digest");
      expect(result.ok).toBe(true);
    });

    it("parses obscured keyword", () => {
      const result = tryParseEnvelopePattern("obscured");
      expect(result.ok).toBe(true);
    });

    it("parses elided keyword", () => {
      const result = tryParseEnvelopePattern("elided");
      expect(result.ok).toBe(true);
    });

    it("parses encrypted keyword", () => {
      const result = tryParseEnvelopePattern("encrypted");
      expect(result.ok).toBe(true);
    });

    it("parses compressed keyword", () => {
      const result = tryParseEnvelopePattern("compressed");
      expect(result.ok).toBe(true);
    });
  });

  describe("Meta Patterns", () => {
    it("parses search pattern", () => {
      const result = tryParseEnvelopePattern("search(42)");
      expect(result.ok).toBe(true);
    });

    it("parses or pattern", () => {
      const result = tryParseEnvelopePattern("42 | text");
      expect(result.ok).toBe(true);
    });

    it("parses and pattern", () => {
      const result = tryParseEnvelopePattern("number & 42");
      expect(result.ok).toBe(true);
    });

    it("parses not pattern", () => {
      const result = tryParseEnvelopePattern("!42");
      expect(result.ok).toBe(true);
    });

    it("parses grouped pattern", () => {
      const result = tryParseEnvelopePattern("(42 | text)");
      expect(result.ok).toBe(true);
    });

    it("parses capture pattern", () => {
      // Capture requires explicit parentheses; mirrors Rust grammar.
      const result = tryParseEnvelopePattern("@myCapture(number)");
      expect(result.ok).toBe(true);
    });
  });

  describe("Quantifiers", () => {
    // Quantifier suffixes attach only to parenthesised groups in Rust;
    // bare-primary forms like `number*` are syntax errors. The tests
    // below use the parenthesised form to mirror that grammar.
    it("parses zero or more", () => {
      const result = tryParseEnvelopePattern("(number)*");
      expect(result.ok).toBe(true);
    });

    it("parses one or more", () => {
      const result = tryParseEnvelopePattern("(number)+");
      expect(result.ok).toBe(true);
    });

    it("parses zero or one", () => {
      const result = tryParseEnvelopePattern("(number)?");
      expect(result.ok).toBe(true);
    });

    it("parses exact range", () => {
      const result = tryParseEnvelopePattern("(number){3}");
      expect(result.ok).toBe(true);
    });

    it("parses bounded range", () => {
      const result = tryParseEnvelopePattern("(number){2,5}");
      expect(result.ok).toBe(true);
    });

    it("parses open-ended range", () => {
      const result = tryParseEnvelopePattern("(number){2,}");
      expect(result.ok).toBe(true);
    });
  });

  describe("Traverse Patterns", () => {
    it("parses simple traverse", () => {
      const result = tryParseEnvelopePattern("subj -> number");
      expect(result.ok).toBe(true);
    });

    it("parses multi-step traverse", () => {
      const result = tryParseEnvelopePattern("node -> subj -> number");
      expect(result.ok).toBe(true);
    });
  });
});
