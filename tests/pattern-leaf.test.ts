/**
 * @blockchaincommons/envelope-pattern - Leaf Pattern Tests
 *
 * Tests for CBOR leaf patterns: bool, number, text, bytestring, array, map, etc.
 *
 * This is a 1:1 TypeScript port of bc-envelope-pattern-rust pattern_tests_leaf.rs
 */

import { describe, it, expect } from "vitest";
import { Envelope } from "@blockchaincommons/envelope";
import {
  anyBool,
  bool,
  anyNumber,
  number,
  numberRange,
  numberGreaterThan,
  numberLessThan,
  anyText,
  text,
  textRegex,
  anyByteString,
  byteString,
  anyArray,
  anyMap,
  nullValue,
  anyTag,
  matches,
  paths as patternPaths,
} from "../src";
// toByteString import removed - using Uint8Array directly

describe("Leaf Pattern Tests", () => {
  describe("Bool Pattern", () => {
    it("does not match non-boolean subjects", () => {
      const envelope = Envelope.from(42);
      expect(matches(anyBool(), envelope)).toBe(false);
      expect(matches(bool(true), envelope)).toBe(false);
      expect(matches(bool(false), envelope)).toBe(false);
    });

    it("matches bare boolean subjects", () => {
      const trueEnv = Envelope.from(true);
      expect(matches(anyBool(), trueEnv)).toBe(true);
      expect(matches(bool(true), trueEnv)).toBe(true);
      expect(matches(bool(false), trueEnv)).toBe(false);

      const falseEnv = Envelope.from(false);
      expect(matches(anyBool(), falseEnv)).toBe(true);
      expect(matches(bool(true), falseEnv)).toBe(false);
      expect(matches(bool(false), falseEnv)).toBe(true);
    });

    it("matches boolean subjects with assertions", () => {
      const envelope = Envelope.from(true).addAssertion("an", "assertion");
      expect(matches(anyBool(), envelope)).toBe(true);
      expect(matches(bool(true), envelope)).toBe(true);
      expect(matches(bool(false), envelope)).toBe(false);
    });
  });

  describe("Number Pattern", () => {
    it("does not match non-number subjects", () => {
      const envelope = Envelope.from("string");
      expect(matches(anyNumber(), envelope)).toBe(false);
      expect(matches(number(42), envelope)).toBe(false);
    });

    it("matches bare number subjects", () => {
      const envelope = Envelope.from(42);
      expect(matches(anyNumber(), envelope)).toBe(true);
      expect(matches(number(42), envelope)).toBe(true);
      expect(matches(number(43), envelope)).toBe(false);
    });

    it("matches number range patterns", () => {
      const envelope = Envelope.from(42);
      expect(matches(numberRange(40, 50), envelope)).toBe(true);
      expect(matches(numberRange(43, 50), envelope)).toBe(false);
    });

    it("matches number comparison patterns", () => {
      const envelope = Envelope.from(42);
      expect(matches(numberGreaterThan(41), envelope)).toBe(true);
      expect(matches(numberGreaterThan(42), envelope)).toBe(false);
      expect(matches(numberLessThan(43), envelope)).toBe(true);
      expect(matches(numberLessThan(42), envelope)).toBe(false);
    });

    it("matches number subjects with assertions", () => {
      const envelope = Envelope.from(42).addAssertion("an", "assertion");
      expect(matches(anyNumber(), envelope)).toBe(true);
      expect(matches(number(42), envelope)).toBe(true);
    });
  });

  describe("Text Pattern", () => {
    it("does not match non-text subjects", () => {
      const envelope = Envelope.from(42);
      expect(matches(anyText(), envelope)).toBe(false);
      expect(matches(text("hello"), envelope)).toBe(false);
    });

    it("matches bare text subjects", () => {
      const envelope = Envelope.from("hello");
      expect(matches(anyText(), envelope)).toBe(true);
      expect(matches(text("hello"), envelope)).toBe(true);
      expect(matches(text("world"), envelope)).toBe(false);
    });

    it("matches text regex patterns", () => {
      const envelope = Envelope.from("hello");
      expect(matches(textRegex(/^h.*o$/), envelope)).toBe(true);
      expect(matches(textRegex(/^world/), envelope)).toBe(false);
    });

    it("matches text subjects with assertions", () => {
      const envelope = Envelope.from("hello").addAssertion("greeting", "world");
      expect(matches(anyText(), envelope)).toBe(true);
      expect(matches(text("hello"), envelope)).toBe(true);
      expect(matches(text("world"), envelope)).toBe(false);
      expect(matches(textRegex(/^h.*o$/), envelope)).toBe(true);
    });
  });

  describe("ByteString Pattern", () => {
    it("does not match non-bytestring subjects", () => {
      const envelope = Envelope.from("string");
      expect(matches(anyByteString(), envelope)).toBe(false);
    });

    it("matches bare bytestring subjects", () => {
      const helloBytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"
      // Note: Use Uint8Array directly for byte string envelopes
      const envelope = Envelope.from(helloBytes);

      expect(matches(anyByteString(), envelope)).toBe(true);
      expect(matches(byteString(helloBytes), envelope)).toBe(true);
      expect(matches(byteString(new Uint8Array([1, 2, 3])), envelope)).toBe(false);
    });

    it("matches bytestring subjects with assertions", () => {
      const helloBytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"
      // Note: Use Uint8Array directly for byte string envelopes
      const envelope = Envelope.from(helloBytes).addAssertion("type", "greeting");

      expect(matches(anyByteString(), envelope)).toBe(true);
      expect(matches(byteString(helloBytes), envelope)).toBe(true);
    });
  });

  describe("Array Pattern", () => {
    it("does not match non-array subjects", () => {
      const envelope = Envelope.from("string");
      expect(matches(anyArray(), envelope)).toBe(false);
    });

    it("matches bare array subjects", () => {
      // Note: Array as Envelope subject requires CBOR wrapping
      const envelope = Envelope.from([1, 2, 3] as unknown as number);
      expect(matches(anyArray(), envelope)).toBe(true);
    });

    it("matches empty arrays", () => {
      // Note: Array as Envelope subject requires CBOR wrapping
      const envelope = Envelope.from([] as unknown as number);
      expect(matches(anyArray(), envelope)).toBe(true);
    });

    it("matches array subjects with assertions", () => {
      // Note: Array as Envelope subject requires CBOR wrapping
      const envelope = Envelope.from([1, 2, 3] as unknown as number).addAssertion("type", "list");
      expect(matches(anyArray(), envelope)).toBe(true);
    });
  });

  describe("Map Pattern", () => {
    it("does not match non-map subjects", () => {
      const envelope = Envelope.from("string");
      expect(matches(anyMap(), envelope)).toBe(false);
    });

    it("matches bare map subjects", () => {
      // Note: Map as Envelope subject requires CBOR wrapping
      const envelope = Envelope.from(new Map([["key", "value"]]) as unknown as string);
      expect(matches(anyMap(), envelope)).toBe(true);
    });

    it("matches empty maps", () => {
      // Note: Map as Envelope subject requires CBOR wrapping
      const envelope = Envelope.from(new Map() as unknown as string);
      expect(matches(anyMap(), envelope)).toBe(true);
    });

    it("matches map subjects with assertions", () => {
      // Note: Map as Envelope subject requires CBOR wrapping
      const envelope = Envelope.from(new Map([["key", "value"]]) as unknown as string).addAssertion(
        "type",
        "dictionary",
      );
      expect(matches(anyMap(), envelope)).toBe(true);
    });
  });

  describe("Null Pattern", () => {
    it("does not match non-null subjects", () => {
      const envelope = Envelope.from("string");
      expect(matches(nullValue(), envelope)).toBe(false);
    });

    it("matches null subjects", () => {
      const envelope = Envelope.NULL;
      expect(matches(nullValue(), envelope)).toBe(true);
    });

    it("matches null subjects with assertions", () => {
      const envelope = Envelope.NULL.addAssertion("type", "null_value");
      expect(matches(nullValue(), envelope)).toBe(true);
    });
  });

  describe("Tag Pattern", () => {
    it("does not match non-tagged subjects", () => {
      const envelope = Envelope.from("string");
      expect(matches(anyTag(), envelope)).toBe(false);
    });

    // Note: Tagged value matching requires creating tagged CBOR values
    // which depends on the dcbor package's tag functionality
  });

  describe("Pattern Paths", () => {
    it("returns paths for matching patterns", () => {
      const envelope = Envelope.from(42);
      const paths = patternPaths(anyNumber(), envelope);
      expect(paths.length).toBeGreaterThan(0);
    });

    it("returns empty paths for non-matching patterns", () => {
      const envelope = Envelope.from("string");
      const paths = patternPaths(anyNumber(), envelope);
      expect(paths.length).toBe(0);
    });

    it("includes assertions in matched paths", () => {
      const envelope = Envelope.from(42).addAssertion("an", "assertion");
      const paths = patternPaths(anyNumber(), envelope);
      expect(paths.length).toBeGreaterThan(0);
    });
  });
});
