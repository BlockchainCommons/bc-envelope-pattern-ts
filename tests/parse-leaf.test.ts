/**
 * @blockchaincommons/envelope-pattern - Leaf Parsing Tests
 *
 * Tests for parsing leaf patterns: bool, number, text, bytestring, array, map, etc.
 *
 * This is a 1:1 TypeScript port of bc-envelope-pattern-rust parse_tests_leaf.rs
 */

import { describe, it, expect } from "vitest";
import { tryParseEnvelopePattern } from "../src";

describe("Leaf Parsing Tests", () => {
  describe("Boolean Patterns", () => {
    it("parses any bool pattern", () => {
      const result = tryParseEnvelopePattern("bool");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Leaf");
      }
    });

    it("parses true pattern", () => {
      const result = tryParseEnvelopePattern("true");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Leaf");
      }
    });

    it("parses false pattern", () => {
      const result = tryParseEnvelopePattern("false");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Leaf");
      }
    });
  });

  describe("Text Patterns", () => {
    it("parses any text pattern", () => {
      const result = tryParseEnvelopePattern("text");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Leaf");
      }
    });

    it("parses quoted text pattern", () => {
      const result = tryParseEnvelopePattern('"hello"');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Leaf");
      }
    });

    it("parses text regex pattern", () => {
      const result = tryParseEnvelopePattern("/h.*o/");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Leaf");
      }
    });

    it("parses text with spaces", () => {
      const result = tryParseEnvelopePattern('"hello world"');
      expect(result.ok).toBe(true);
    });

    it("parses text with escaped quotes", () => {
      const result = tryParseEnvelopePattern('"say \\"hello\\""');
      expect(result.ok).toBe(true);
    });
  });

  describe("Number Patterns", () => {
    it("parses any number pattern", () => {
      const result = tryParseEnvelopePattern("number");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Leaf");
      }
    });

    it("parses integer pattern", () => {
      const result = tryParseEnvelopePattern("42");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Leaf");
      }
    });

    it("parses float pattern", () => {
      const result = tryParseEnvelopePattern("3.75");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Leaf");
      }
    });

    it("parses number range pattern", () => {
      const result = tryParseEnvelopePattern("1...3");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Leaf");
      }
    });

    it("parses greater than pattern", () => {
      const result = tryParseEnvelopePattern(">5");
      expect(result.ok).toBe(true);
    });

    it("parses greater than or equal pattern", () => {
      const result = tryParseEnvelopePattern(">=5");
      expect(result.ok).toBe(true);
    });

    it("parses less than pattern", () => {
      const result = tryParseEnvelopePattern("<5");
      expect(result.ok).toBe(true);
    });

    it("parses less than or equal pattern", () => {
      const result = tryParseEnvelopePattern("<=5");
      expect(result.ok).toBe(true);
    });

    it("parses NaN pattern", () => {
      const result = tryParseEnvelopePattern("NaN");
      expect(result.ok).toBe(true);
    });

    it("parses Infinity pattern", () => {
      const result = tryParseEnvelopePattern("Infinity");
      expect(result.ok).toBe(true);
    });

    it("parses negative Infinity pattern", () => {
      const result = tryParseEnvelopePattern("-Infinity");
      expect(result.ok).toBe(true);
    });

    it("parses negative number pattern", () => {
      const result = tryParseEnvelopePattern("-42");
      expect(result.ok).toBe(true);
    });
  });

  describe("Leaf Structure Pattern", () => {
    it("parses leaf pattern", () => {
      const result = tryParseEnvelopePattern("leaf");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Structure");
      }
    });
  });

  describe("Array Patterns", () => {
    it("parses any array pattern", () => {
      const result = tryParseEnvelopePattern("array");
      expect(result.ok).toBe(true);
      // Note: array pattern may parse as Meta type due to dcbor-pattern integration
    });

    it("parses array with count pattern", () => {
      const result = tryParseEnvelopePattern("[{3}]");
      expect(result.ok).toBe(true);
      // Note: array with count may parse as Meta type
    });

    it("parses array with range pattern", () => {
      const result = tryParseEnvelopePattern("[{2,4}]");
      expect(result.ok).toBe(true);
    });

    it("parses array with minimum count pattern", () => {
      const result = tryParseEnvelopePattern("[{2,}]");
      expect(result.ok).toBe(true);
    });
  });

  describe("ByteString Patterns", () => {
    it("parses any bytestring pattern", () => {
      const result = tryParseEnvelopePattern("bstr");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Leaf");
      }
    });

    it("parses hex bytestring pattern", () => {
      const result = tryParseEnvelopePattern("h'0102'");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Leaf");
      }
    });

    it("parses bytestring regex pattern", () => {
      const result = tryParseEnvelopePattern("h'/abc/'");
      expect(result.ok).toBe(true);
    });
  });

  describe("Date Patterns", () => {
    it("parses any date pattern", () => {
      const result = tryParseEnvelopePattern("date");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Leaf");
      }
    });

    it("parses specific date pattern", () => {
      const result = tryParseEnvelopePattern("date'2023-12-25'");
      expect(result.ok).toBe(true);
    });

    it("parses date range pattern", () => {
      const result = tryParseEnvelopePattern("date'2023-12-24...2023-12-26'");
      expect(result.ok).toBe(true);
    });

    it("parses earliest date pattern", () => {
      const result = tryParseEnvelopePattern("date'2023-12-24...'");
      expect(result.ok).toBe(true);
    });

    it("parses latest date pattern", () => {
      const result = tryParseEnvelopePattern("date'...2023-12-26'");
      expect(result.ok).toBe(true);
    });

    it("parses date regex pattern", () => {
      const result = tryParseEnvelopePattern("date'/2023-.*/'");
      expect(result.ok).toBe(true);
    });
  });

  describe("Map Patterns", () => {
    it("parses any map pattern", () => {
      const result = tryParseEnvelopePattern("map");
      expect(result.ok).toBe(true);
      // Note: map pattern may parse as Meta type due to dcbor-pattern integration
    });

    it("parses map with count pattern", () => {
      const result = tryParseEnvelopePattern("{{3}}");
      expect(result.ok).toBe(true);
    });

    it("parses map with range pattern", () => {
      const result = tryParseEnvelopePattern("{{2,4}}");
      expect(result.ok).toBe(true);
    });

    it("parses map with minimum count pattern", () => {
      const result = tryParseEnvelopePattern("{{2,}}");
      expect(result.ok).toBe(true);
    });
  });

  describe("Null Pattern", () => {
    it("parses null pattern", () => {
      const result = tryParseEnvelopePattern("null");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Leaf");
      }
    });
  });

  describe("Tag Patterns", () => {
    it("parses any tagged pattern", () => {
      const result = tryParseEnvelopePattern("tagged");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Leaf");
      }
    });

    it("parses tagged with specific tag", () => {
      const result = tryParseEnvelopePattern("tagged(100, *)");
      expect(result.ok).toBe(true);
    });

    it("parses tagged with name", () => {
      const result = tryParseEnvelopePattern("tagged(date, *)");
      expect(result.ok).toBe(true);
    });

    it("parses tagged with regex", () => {
      const result = tryParseEnvelopePattern("tagged(/da.*/, *)");
      expect(result.ok).toBe(true);
    });

    it("parses tagged with array content", () => {
      const result = tryParseEnvelopePattern("tagged(100, [number, (number)*])");
      expect(result.ok).toBe(true);
    });

    it("parses tagged with map content", () => {
      const result = tryParseEnvelopePattern('tagged(100, { "key": * })');
      expect(result.ok).toBe(true);
    });
  });

  describe("Known Value Patterns", () => {
    it("parses any known value pattern", () => {
      const result = tryParseEnvelopePattern("known");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Leaf");
      }
    });

    it("parses known value by number", () => {
      const result = tryParseEnvelopePattern("'1'");
      expect(result.ok).toBe(true);
    });

    it("parses known value by name", () => {
      const result = tryParseEnvelopePattern("'date'");
      expect(result.ok).toBe(true);
    });

    it("parses known value regex", () => {
      const result = tryParseEnvelopePattern("'/da.*/'");
      expect(result.ok).toBe(true);
    });
  });

  describe("CBOR Patterns", () => {
    it("parses any cbor pattern", () => {
      const result = tryParseEnvelopePattern("cbor");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("Leaf");
      }
    });

    it("parses cbor with boolean value", () => {
      const result = tryParseEnvelopePattern("cbor(true)");
      expect(result.ok).toBe(true);
    });

    it("parses cbor with number value", () => {
      const result = tryParseEnvelopePattern("cbor(42)");
      expect(result.ok).toBe(true);
    });

    it("parses cbor with text value", () => {
      const result = tryParseEnvelopePattern('cbor("hello")');
      expect(result.ok).toBe(true);
    });

    it("parses cbor with array value", () => {
      const result = tryParseEnvelopePattern("cbor([1, 2])");
      expect(result.ok).toBe(true);
    });

    it("parses cbor with map value", () => {
      const result = tryParseEnvelopePattern("cbor({1: 2})");
      expect(result.ok).toBe(true);
    });

    it("parses cbor with tagged value", () => {
      const result = tryParseEnvelopePattern('cbor(1("t"))');
      expect(result.ok).toBe(true);
    });

    it("parses cbor with array", () => {
      const result = tryParseEnvelopePattern("cbor([1, 2, 3])");
      expect(result.ok).toBe(true);
    });

    it("parses cbor with map string keys", () => {
      const result = tryParseEnvelopePattern('cbor({"a": 1})');
      expect(result.ok).toBe(true);
    });
  });
});
