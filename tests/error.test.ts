/**
 * @blockchaincommons/envelope-pattern - Error Tests
 *
 * Tests for parser error handling and error types.
 *
 * This is a 1:1 TypeScript port of bc-envelope-pattern-rust error_tests.rs
 */

import { describe, it, expect } from "vitest";
import { tryParseEnvelopePattern } from "../src";

describe("Error Tests", () => {
  describe("Unrecognized Token Error", () => {
    it("detects error with invalid pattern", () => {
      // Note: The parser handles "invalid" as a valid identifier
      // but @pattern creates an issue
      const result = tryParseEnvelopePattern("@"); // Invalid capture group with no name
      expect(result.ok).toBe(false);
    });

    it("detects error with unrecognized sequence", () => {
      const result = tryParseEnvelopePattern('"hello"@');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        // After "hello" (7 characters), @ at position 7
        // Parser should fail on unrecognized @ token or extra data
        expect(["UnrecognizedToken", "ExtraData", "UnexpectedToken"]).toContain(result.error.code);
      }
    });
  });

  describe("Extra Data Error", () => {
    it("detects extra data after valid pattern", () => {
      const result = tryParseEnvelopePattern('"hello" "world"');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("ExtraData");
        if (result.error.code === "ExtraData") {
          expect(result.error.span?.start).toBe(8);
        }
      }
    });
  });

  describe("Unexpected End Of Input", () => {
    it("detects unexpected end of input", () => {
      const result = tryParseEnvelopePattern('"hello" &');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UnexpectedEndOfInput");
      }
    });

    it("detects unexpected end of input in range", () => {
      const result = tryParseEnvelopePattern("42...");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UnexpectedEndOfInput");
      }
    });
  });

  describe("Valid Patterns", () => {
    it("parses valid text pattern", () => {
      const result = tryParseEnvelopePattern('"hello"');
      expect(result.ok).toBe(true);
    });

    it("parses valid number pattern", () => {
      const result = tryParseEnvelopePattern("42");
      expect(result.ok).toBe(true);
    });

    it("parses valid boolean pattern", () => {
      const result = tryParseEnvelopePattern("true");
      expect(result.ok).toBe(true);
    });

    it("parses valid and pattern", () => {
      const result = tryParseEnvelopePattern("42 & > 10");
      expect(result.ok).toBe(true);
    });

    it("parses valid or pattern", () => {
      const result = tryParseEnvelopePattern("42 | 43");
      expect(result.ok).toBe(true);
    });

    it("parses valid not pattern", () => {
      const result = tryParseEnvelopePattern("!42");
      expect(result.ok).toBe(true);
    });

    it("parses valid grouped pattern", () => {
      const result = tryParseEnvelopePattern("(42 | 43)");
      expect(result.ok).toBe(true);
    });
  });

  describe("Unmatched Parentheses", () => {
    it("detects missing close paren", () => {
      const result = tryParseEnvelopePattern("(42");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("ExpectedCloseParen");
      }
    });

    it("detects extra close paren", () => {
      const result = tryParseEnvelopePattern("42)");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("ExtraData");
      }
    });
  });

  describe("Invalid Patterns", () => {
    it("detects invalid regex pattern", () => {
      // Invalid regex with unescaped special characters
      const result = tryParseEnvelopePattern("/[/");
      expect(result.ok).toBe(false);
    });

    it("detects empty input", () => {
      const result = tryParseEnvelopePattern("");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UnexpectedEndOfInput");
      }
    });
  });
});
