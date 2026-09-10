/**
 * @blockchaincommons/envelope-pattern - CBOR Pattern Integration Tests
 *
 * Tests for CBOR pattern integration with dcbor-pattern.
 *
 * This is a 1:1 TypeScript port of bc-envelope-pattern-rust cbor_integration_test.rs
 */

import { describe, it, expect } from "vitest";
import { Envelope } from "@blockchaincommons/envelope";
import { tryParseEnvelopePattern, matches } from "../src";

describe("CBOR Pattern Integration Tests", () => {
  describe("DCBOR Pattern Integration", () => {
    it("parses and matches number pattern", () => {
      const result = tryParseEnvelopePattern("cbor(/number/)");
      expect(result.ok).toBe(true);
      if (result.ok) {
        const envelope = Envelope.from(42);
        expect(matches(result.value, envelope)).toBe(true);
      }
    });

    it("parses and matches array pattern", () => {
      const result = tryParseEnvelopePattern("cbor(/array/)");
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Note: Array as Envelope subject requires CBOR wrapping
        const envelope = Envelope.from([1, 2, 3] as unknown as number);
        expect(matches(result.value, envelope)).toBe(true);
      }
    });

    it("parses and matches text pattern", () => {
      const result = tryParseEnvelopePattern("cbor(/text/)");
      expect(result.ok).toBe(true);
      if (result.ok) {
        const envelope = Envelope.from("hello");
        expect(matches(result.value, envelope)).toBe(true);
      }
    });
  });

  describe("Any CBOR Pattern", () => {
    it("matches any cbor value", () => {
      const envelope = Envelope.from(123);

      const result = tryParseEnvelopePattern("cbor");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(matches(result.value, envelope)).toBe(true);
      }
    });

    it("matches boolean cbor value", () => {
      const envelope = Envelope.from(true);

      const result = tryParseEnvelopePattern("cbor");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(matches(result.value, envelope)).toBe(true);
      }
    });

    it("matches text cbor value", () => {
      const envelope = Envelope.from("hello");

      const result = tryParseEnvelopePattern("cbor");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(matches(result.value, envelope)).toBe(true);
      }
    });
  });

  describe("Exact CBOR Values", () => {
    it("matches exact numeric value", () => {
      const envelope = Envelope.from(42);
      const result = tryParseEnvelopePattern("cbor(42)");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(matches(result.value, envelope)).toBe(true);
      }
    });

    it("does not match different numeric value", () => {
      const envelope = Envelope.from(43);
      const result = tryParseEnvelopePattern("cbor(42)");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(matches(result.value, envelope)).toBe(false);
      }
    });

    it("matches exact text value", () => {
      const envelope = Envelope.from("hello");
      const result = tryParseEnvelopePattern('cbor("hello")');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(matches(result.value, envelope)).toBe(true);
      }
    });

    it("does not match different text value", () => {
      const envelope = Envelope.from("world");
      const result = tryParseEnvelopePattern('cbor("hello")');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(matches(result.value, envelope)).toBe(false);
      }
    });

    it("matches exact array value", () => {
      // Note: Array as Envelope subject requires CBOR wrapping
      const envelope = Envelope.from([1, 2, 3] as unknown as number);
      const result = tryParseEnvelopePattern("cbor([1, 2, 3])");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(matches(result.value, envelope)).toBe(true);
      }
    });
  });

  describe("Complex CBOR Structures", () => {
    it("matches map with string keys", () => {
      // Note: Map as Envelope subject requires CBOR wrapping
      const envelope = Envelope.from(
        new Map<string, unknown>([
          ["name", "Alice"],
          ["age", 42],
        ]) as unknown as string,
      );
      const result = tryParseEnvelopePattern('cbor({"name": "Alice", "age": 42})');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(matches(result.value, envelope)).toBe(true);
      }
    });
  });

  describe("Parser Support", () => {
    it("parses basic cbor pattern", () => {
      expect(tryParseEnvelopePattern("cbor").ok).toBe(true);
    });

    it("parses cbor with number", () => {
      expect(tryParseEnvelopePattern("cbor(42)").ok).toBe(true);
    });

    it("parses cbor with text", () => {
      expect(tryParseEnvelopePattern('cbor("hello")').ok).toBe(true);
    });

    it("parses cbor with array", () => {
      expect(tryParseEnvelopePattern("cbor([1, 2, 3])").ok).toBe(true);
    });

    it("parses dcbor-pattern number syntax", () => {
      const result = tryParseEnvelopePattern("cbor(/number/)");
      expect(result.ok).toBe(true);
    });

    it("parses dcbor-pattern text syntax", () => {
      const result = tryParseEnvelopePattern("cbor(/text/)");
      expect(result.ok).toBe(true);
    });
  });

  describe("Parsing Errors", () => {
    it("rejects invalid dcbor-pattern keyword uint", () => {
      const result = tryParseEnvelopePattern("cbor(/uint/)");
      expect(result.ok).toBe(false);
    });

    it("rejects invalid dcbor-pattern keyword int", () => {
      const result = tryParseEnvelopePattern("cbor(/int/)");
      expect(result.ok).toBe(false);
    });

    it("rejects invalid diagnostic notation", () => {
      const result = tryParseEnvelopePattern("cbor({invalid: syntax)");
      expect(result.ok).toBe(false);
    });
  });

  describe("Direct DCBOR Patterns", () => {
    it("number pattern matches integer", () => {
      const result = tryParseEnvelopePattern("cbor(/number/)");
      expect(result.ok).toBe(true);
      if (result.ok) {
        const envelope = Envelope.from(42);
        expect(matches(result.value, envelope)).toBe(true);
      }
    });

    it("array pattern matches array", () => {
      const result = tryParseEnvelopePattern("cbor(/array/)");
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Note: Array as Envelope subject requires CBOR wrapping
        const envelope = Envelope.from([1, 2, 3] as unknown as number);
        expect(matches(result.value, envelope)).toBe(true);
      }
    });

    it("text pattern matches string", () => {
      const result = tryParseEnvelopePattern("cbor(/text/)");
      expect(result.ok).toBe(true);
      if (result.ok) {
        const envelope = Envelope.from("hello");
        expect(matches(result.value, envelope)).toBe(true);
      }
    });

    it("bool pattern matches boolean", () => {
      const result = tryParseEnvelopePattern("cbor(/bool/)");
      expect(result.ok).toBe(true);
      if (result.ok) {
        const envelope = Envelope.from(true);
        expect(matches(result.value, envelope)).toBe(true);
      }
    });
  });
});
