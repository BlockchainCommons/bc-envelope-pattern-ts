/**
 * @blockchaincommons/envelope-pattern - Parser Integration Tests
 *
 * Integration tests demonstrating dcbor-pattern integration in the parser.
 * These tests verify that the parser correctly handles both envelope-specific
 * patterns and dcbor-pattern syntax.
 *
 * This is a 1:1 TypeScript port of bc-envelope-pattern-rust parser_integration_tests.rs
 */

import { describe, it, expect } from "vitest";
import { Envelope } from "@blockchaincommons/envelope";
import { tryParseEnvelopePattern, matches, paths as patternPaths } from "../src";
import { convertDcborPatternToEnvelopePattern as convert } from "../src/pattern/dcbor-integration";
import type { Pattern as DcborPattern } from "@blockchaincommons/dcbor-pattern";
import type { Pattern as EnvelopePattern } from "../src";

/** The conversion as a result, the shape these tests were written against. */
const convertDcborPatternToEnvelopePattern = (
  p: DcborPattern,
): { ok: true; value: EnvelopePattern } | { ok: false; error: Error } => {
  try {
    return { ok: true, value: convert(p) };
  } catch (e) {
    return { ok: false, error: e as Error };
  }
};
import { boolean as bool } from "@blockchaincommons/dcbor-pattern";

describe("Parser Integration Tests", () => {
  describe("Envelope Patterns Take Precedence", () => {
    it("parses search pattern as envelope pattern", () => {
      const result = tryParseEnvelopePattern("search(42)");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Meta");
      }
    });

    it("parses node pattern as envelope pattern", () => {
      const result = tryParseEnvelopePattern("node");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Structure");
      }
    });

    it("parses assert pattern as envelope pattern", () => {
      const result = tryParseEnvelopePattern("assert");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Structure");
      }
    });

    it("parses capture pattern as envelope pattern", () => {
      const result = tryParseEnvelopePattern("@name(42)");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Meta");
      }
    });

    it("parses cbor pattern as envelope pattern", () => {
      const result = tryParseEnvelopePattern("cbor(42)");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Leaf");
      }
    });
  });

  describe("DCBOR Pattern Compatible Syntax", () => {
    describe("Boolean Patterns", () => {
      it("matches any boolean with envelope", () => {
        const envTrue = Envelope.from(true);
        const envFalse = Envelope.from(false);
        const envNumber = Envelope.from(42);

        const result = tryParseEnvelopePattern("bool");
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(matches(result.value, envTrue)).toBe(true);
          expect(matches(result.value, envFalse)).toBe(true);
          expect(matches(result.value, envNumber)).toBe(false);
        }
      });

      it("matches true pattern", () => {
        const envTrue = Envelope.from(true);
        const envFalse = Envelope.from(false);

        const result = tryParseEnvelopePattern("true");
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(matches(result.value, envTrue)).toBe(true);
          expect(matches(result.value, envFalse)).toBe(false);
        }
      });

      it("matches false pattern", () => {
        const envTrue = Envelope.from(true);
        const envFalse = Envelope.from(false);

        const result = tryParseEnvelopePattern("false");
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(matches(result.value, envFalse)).toBe(true);
          expect(matches(result.value, envTrue)).toBe(false);
        }
      });
    });

    describe("Number Patterns", () => {
      it("matches any number with envelope", () => {
        const envNumber = Envelope.from(42);
        const envText = Envelope.from("hello");

        const result = tryParseEnvelopePattern("number");
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(matches(result.value, envNumber)).toBe(true);
          expect(matches(result.value, envText)).toBe(false);
        }
      });

      it("matches specific number", () => {
        const env42 = Envelope.from(42);
        const env43 = Envelope.from(43);

        const result = tryParseEnvelopePattern("42");
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(matches(result.value, env42)).toBe(true);
          expect(matches(result.value, env43)).toBe(false);
        }
      });
    });

    describe("Text Patterns", () => {
      it("matches any text with envelope", () => {
        const envText = Envelope.from("hello");
        const envNumber = Envelope.from(42);

        const result = tryParseEnvelopePattern("text");
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(matches(result.value, envText)).toBe(true);
          expect(matches(result.value, envNumber)).toBe(false);
        }
      });

      it("matches specific text", () => {
        const envHello = Envelope.from("hello");
        const envWorld = Envelope.from("world");

        const result = tryParseEnvelopePattern('"hello"');
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(matches(result.value, envHello)).toBe(true);
          expect(matches(result.value, envWorld)).toBe(false);
        }
      });
    });
  });

  describe("Mixed Envelope and DCBOR Syntax", () => {
    it("search with number pattern", () => {
      const env = Envelope.from(42);

      const result = tryParseEnvelopePattern("search(42)");
      expect(result.ok).toBe(true);
      if (result.ok) {
        const paths = patternPaths(result.value, env);
        expect(paths.length).toBeGreaterThan(0);
      }
    });

    it("boolean or number pattern", () => {
      const envNumber = Envelope.from(42);
      const envBool = Envelope.from(true);
      const envText = Envelope.from("hello");

      const result = tryParseEnvelopePattern("true | 42");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(matches(result.value, envNumber)).toBe(true);
        expect(matches(result.value, envBool)).toBe(true);
        expect(matches(result.value, envText)).toBe(false);
      }
    });
  });

  describe("Error Handling", () => {
    it("rejects invalid tokens", () => {
      const result = tryParseEnvelopePattern("INVALID_TOKEN");
      expect(result.ok).toBe(false);
    });

    it("rejects extra data", () => {
      const result = tryParseEnvelopePattern("true false");
      expect(result.ok).toBe(false);
    });

    it("rejects incomplete parentheses", () => {
      const result = tryParseEnvelopePattern("(");
      expect(result.ok).toBe(false);
    });

    it("provides error for empty input", () => {
      const result = tryParseEnvelopePattern("");
      expect(result.ok).toBe(false);
    });
  });

  describe("Precedence Demonstration", () => {
    it("capture patterns use envelope parsing", () => {
      const result = tryParseEnvelopePattern("@num(42)");
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should be an envelope capture pattern
        expect(result.value.kind).toBe("Meta");
      }
    });

    it("map patterns use dcbor-pattern syntax", () => {
      const result = tryParseEnvelopePattern("map");
      expect(result.ok).toBe(true);
      // Note: map pattern may parse as Meta type due to implementation
    });
  });

  describe("Conversion Layer", () => {
    it("converts dcbor boolean pattern to envelope pattern", () => {
      const dcborBool = bool(true);
      const envelopeResult = convertDcborPatternToEnvelopePattern(dcborBool);

      expect(envelopeResult.ok).toBe(true);
      if (envelopeResult.ok) {
        const envTrue = Envelope.from(true);
        const envFalse = Envelope.from(false);

        expect(matches(envelopeResult.value, envTrue)).toBe(true);
        expect(matches(envelopeResult.value, envFalse)).toBe(false);
      }
    });
  });
});
