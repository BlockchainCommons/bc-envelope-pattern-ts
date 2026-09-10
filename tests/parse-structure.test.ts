/**
 * @blockchaincommons/envelope-pattern - Structure Parsing Tests
 *
 * Tests for parsing structure patterns: node, wrapped, subject, assertion, etc.
 *
 * This is a 1:1 TypeScript port of bc-envelope-pattern-rust parse_tests_structure.rs
 */

import { describe, it, expect } from "vitest";
import { tryParseEnvelopePattern } from "../src";

describe("Structure Parsing Tests", () => {
  describe("Node Patterns", () => {
    it("parses any node pattern", () => {
      const result = tryParseEnvelopePattern("node");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Structure");
      }
    });

    it("parses node with assertion range", () => {
      const result = tryParseEnvelopePattern("node({1,3})");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Structure");
      }
    });

    it("parses node with exact assertion count", () => {
      const result = tryParseEnvelopePattern("node({2})");
      expect(result.ok).toBe(true);
    });

    it("parses node with minimum assertion count", () => {
      const result = tryParseEnvelopePattern("node({1,})");
      expect(result.ok).toBe(true);
    });
  });

  describe("Wrapped Patterns", () => {
    it("parses wrapped pattern", () => {
      const result = tryParseEnvelopePattern("wrapped");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Structure");
      }
    });
  });

  describe("Unwrap Patterns", () => {
    it("parses unwrap pattern", () => {
      const result = tryParseEnvelopePattern("unwrap");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Structure");
      }
    });

    it("parses unwrap with inner pattern", () => {
      const result = tryParseEnvelopePattern("unwrap(node)");
      expect(result.ok).toBe(true);
    });

    it("parses unwrap with number pattern", () => {
      const result = tryParseEnvelopePattern("unwrap(42)");
      expect(result.ok).toBe(true);
    });
  });

  describe("Subject Patterns", () => {
    it("parses any subject pattern", () => {
      const result = tryParseEnvelopePattern("subj");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Structure");
      }
    });

    it("parses subject with text pattern", () => {
      const result = tryParseEnvelopePattern('subj("hi")');
      expect(result.ok).toBe(true);
    });

    it("parses subject with number pattern", () => {
      const result = tryParseEnvelopePattern("subj(42)");
      expect(result.ok).toBe(true);
    });
  });

  describe("Assertion Patterns", () => {
    it("parses any assertion pattern", () => {
      const result = tryParseEnvelopePattern("assert");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Structure");
      }
    });

    it("parses assertion with predicate pattern", () => {
      const result = tryParseEnvelopePattern('assertpred("hi")');
      expect(result.ok).toBe(true);
    });

    it("parses assertion with predicate and spaces", () => {
      const result = tryParseEnvelopePattern('assertpred ( "hi" )');
      expect(result.ok).toBe(true);
    });

    it("parses assertion with object pattern", () => {
      const result = tryParseEnvelopePattern("assertobj(1)");
      expect(result.ok).toBe(true);
    });

    it("parses assertion with object and spaces", () => {
      const result = tryParseEnvelopePattern("assertobj ( 1 )");
      expect(result.ok).toBe(true);
    });
  });

  describe("Object Patterns", () => {
    it("parses any object pattern", () => {
      const result = tryParseEnvelopePattern("obj");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Structure");
      }
    });

    it("parses object with text pattern", () => {
      const result = tryParseEnvelopePattern('obj("hi")');
      expect(result.ok).toBe(true);
    });

    it("parses object with spaces", () => {
      const result = tryParseEnvelopePattern('obj ( "hi" )');
      expect(result.ok).toBe(true);
    });

    it("parses object with number pattern", () => {
      const result = tryParseEnvelopePattern("obj(42)");
      expect(result.ok).toBe(true);
    });
  });

  describe("Predicate Patterns", () => {
    it("parses any predicate pattern", () => {
      const result = tryParseEnvelopePattern("pred");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Structure");
      }
    });

    it("parses predicate with number pattern", () => {
      const result = tryParseEnvelopePattern("pred(1)");
      expect(result.ok).toBe(true);
    });

    it("parses predicate with spaces", () => {
      const result = tryParseEnvelopePattern("pred ( 1 )");
      expect(result.ok).toBe(true);
    });

    it("parses predicate with text pattern", () => {
      const result = tryParseEnvelopePattern('pred("knows")');
      expect(result.ok).toBe(true);
    });
  });

  describe("Obscured Patterns", () => {
    it("parses obscured pattern", () => {
      const result = tryParseEnvelopePattern("obscured");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Structure");
      }
    });

    it("parses elided pattern", () => {
      const result = tryParseEnvelopePattern("elided");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Structure");
      }
    });

    it("parses encrypted pattern", () => {
      const result = tryParseEnvelopePattern("encrypted");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Structure");
      }
    });

    it("parses compressed pattern", () => {
      const result = tryParseEnvelopePattern("compressed");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Structure");
      }
    });
  });

  describe("Digest Patterns", () => {
    it("parses digest prefix pattern", () => {
      const result = tryParseEnvelopePattern("digest(a1b2c3)");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Structure");
      }
    });

    it("parses digest with spaces", () => {
      const result = tryParseEnvelopePattern("digest ( a1b2c3 )");
      expect(result.ok).toBe(true);
    });

    it("parses digest with longer hex", () => {
      const result = tryParseEnvelopePattern("digest(a1b2c3d4e5f6)");
      expect(result.ok).toBe(true);
    });
  });

  describe("Complex Structure Patterns", () => {
    it("parses traversal with structure patterns", () => {
      const result = tryParseEnvelopePattern("subj -> assert -> obj");
      expect(result.ok).toBe(true);
    });

    it("parses nested unwrap pattern", () => {
      const result = tryParseEnvelopePattern("unwrap(unwrap(42))");
      expect(result.ok).toBe(true);
    });

    it("parses wrapped with repeat", () => {
      const result = tryParseEnvelopePattern("(wrapped)* -> node");
      expect(result.ok).toBe(true);
    });

    it("parses search with assertion pattern", () => {
      const result = tryParseEnvelopePattern("search(assertpred(text))");
      expect(result.ok).toBe(true);
    });
  });
});
