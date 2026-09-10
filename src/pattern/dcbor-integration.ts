/**
 * The whole-input fallback: a text the envelope grammar rejects but the
 * dCBOR pattern grammar accepts becomes an envelope pattern over the
 * subject. Value and structure patterns become leaf patterns; `and`, `or`
 * and `not` keep their shape over converted operands; every other meta
 * pattern is applied whole through `cbor(/…/)`.
 */
import type { Pattern as DcborPattern } from "@blockchaincommons/dcbor-pattern";
import { type Pattern, leafPattern } from "./types";
import { and, any, cborPattern, not, or } from "./constructors";

/** The envelope pattern a dCBOR pattern parses to when the envelope grammar rejects the text. */
export const convertDcborPatternToEnvelopePattern = (pattern: DcborPattern): Pattern => {
  switch (pattern.kind) {
    case "Value": {
      const v = pattern.pattern;
      switch (v.type) {
        case "Bool":
          return leafPattern({ type: "Bool", pattern: v.pattern });
        case "Number":
          return leafPattern({ type: "Number", pattern: v.pattern });
        case "Text":
          return leafPattern({ type: "Text", pattern: v.pattern });
        case "ByteString":
          return leafPattern({ type: "ByteString", pattern: v.pattern });
        case "Date":
          return leafPattern({ type: "Date", pattern: v.pattern });
        case "KnownValue":
          return leafPattern({ type: "KnownValue", pattern: v.pattern });
        case "Null":
          return leafPattern({ type: "Null", pattern: v.pattern });
        case "Digest":
          return cborPattern(pattern);
      }
    }
    // eslint-disable-next-line no-fallthrough -- every type above returns
    case "Structure": {
      const s = pattern.pattern;
      switch (s.type) {
        case "Array":
          return leafPattern({ type: "Array", pattern: s.pattern });
        case "Map":
          return leafPattern({ type: "Map", pattern: s.pattern });
        case "Tagged":
          return leafPattern({ type: "Tagged", pattern: s.pattern });
      }
    }
    // eslint-disable-next-line no-fallthrough -- every type above returns
    case "Meta": {
      const m = pattern.pattern;
      switch (m.type) {
        case "Any":
          return any();
        case "And":
          return and(...m.pattern.patterns.map(convertDcborPatternToEnvelopePattern));
        case "Or":
          return or(...m.pattern.patterns.map(convertDcborPatternToEnvelopePattern));
        case "Not":
          return not(convertDcborPatternToEnvelopePattern(m.pattern.pattern));
        case "Capture":
        case "Repeat":
        case "Search":
        case "Sequence":
          return cborPattern(pattern);
      }
    }
  }
};
