/**
 * The pattern object model: plain frozen data, three levels deep. A
 * `Pattern` is a leaf pattern (a dCBOR pattern applied to the subject), a
 * structure pattern (an envelope element) or a meta pattern (a combinator).
 */
import type { Cbor } from "@blockchaincommons/dcbor";
import type { Digest } from "@blockchaincommons/components";
import type {
  Interval,
  Pattern as DcborPattern,
  PatternRegex,
  Quantifier,
} from "@blockchaincommons/dcbor-pattern";
import type {
  ArrayPattern as DcborArrayPattern,
  BoolPattern as DcborBoolPattern,
  ByteStringPattern as DcborByteStringPattern,
  DatePattern as DcborDatePattern,
  KnownValuePattern as DcborKnownValuePattern,
  MapPattern as DcborMapPattern,
  NullPattern as DcborNullPattern,
  NumberPattern as DcborNumberPattern,
  TaggedPattern as DcborTaggedPattern,
  TextPattern as DcborTextPattern,
} from "@blockchaincommons/dcbor-pattern/patterns";

/** `cbor`, `cbor(value)` or `cbor(/pattern/)`: the subject's CBOR. */
export type CborPattern =
  | {
      /** The discriminant. */
      readonly variant: "Any";
    }
  | {
      /** The discriminant. */
      readonly variant: "Value";
      /** The CBOR the subject must equal. */
      readonly cbor: Cbor;
    }
  | {
      /** The discriminant. */
      readonly variant: "Pattern";
      /** The dCBOR pattern the subject's CBOR must match; its paths extend the envelope path. */
      readonly pattern: DcborPattern;
    };

/** A leaf pattern: a dCBOR pattern applied to the subject's CBOR. */
export type LeafPattern =
  | {
      /** The discriminant. */
      readonly type: "Cbor";
      /** The pattern. */
      readonly pattern: CborPattern;
    }
  | {
      /** The discriminant. */
      readonly type: "Number";
      /** The pattern. */
      readonly pattern: DcborNumberPattern;
    }
  | {
      /** The discriminant. */
      readonly type: "Text";
      /** The pattern. */
      readonly pattern: DcborTextPattern;
    }
  | {
      /** The discriminant. */
      readonly type: "ByteString";
      /** The pattern. */
      readonly pattern: DcborByteStringPattern;
    }
  | {
      /** The discriminant. */
      readonly type: "Tagged";
      /** The pattern; its paths and captures collapse to the envelope. */
      readonly pattern: DcborTaggedPattern;
    }
  | {
      /** The discriminant. */
      readonly type: "Array";
      /** The pattern. */
      readonly pattern: DcborArrayPattern;
    }
  | {
      /** The discriminant. */
      readonly type: "Map";
      /** The pattern. */
      readonly pattern: DcborMapPattern;
    }
  | {
      /** The discriminant. */
      readonly type: "Bool";
      /** The pattern. */
      readonly pattern: DcborBoolPattern;
    }
  | {
      /** The discriminant. */
      readonly type: "Null";
      /** The pattern. */
      readonly pattern: DcborNullPattern;
    }
  | {
      /** The discriminant. */
      readonly type: "Date";
      /** The pattern. */
      readonly pattern: DcborDatePattern;
    }
  | {
      /** The discriminant. */
      readonly type: "KnownValue";
      /** The pattern. */
      readonly pattern: DcborKnownValuePattern;
    };

/** `assert`, `assertpred(p)`, `assertobj(p)`: the assertions of a node. */
export type AssertionsPattern =
  | {
      /** The discriminant. */
      readonly variant: "Any";
    }
  | {
      /** The discriminant. */
      readonly variant: "WithPredicate";
      /** The pattern the predicate must match. */
      readonly pattern: Pattern;
    }
  | {
      /** The discriminant. */
      readonly variant: "WithObject";
      /** The pattern the object must match. */
      readonly pattern: Pattern;
    };

/** `digest(hex)`, `digest(ur:digest/…)`, `digest(/regex/)`: the envelope's digest. */
export type DigestPattern =
  | {
      /** The discriminant. */
      readonly variant: "Digest";
      /** The digest the envelope must have. */
      readonly digest: Digest;
    }
  | {
      /** The discriminant. */
      readonly variant: "Prefix";
      /** The bytes the digest must start with. */
      readonly prefix: Uint8Array;
    }
  | {
      /** The discriminant. */
      readonly variant: "BinaryRegex";
      /** The byte regex the digest must match. */
      readonly regex: PatternRegex;
    };

/** `node`, `node({n,m})`: an envelope with assertions. */
export type NodePattern =
  | {
      /** The discriminant. */
      readonly variant: "Any";
    }
  | {
      /** The discriminant. */
      readonly variant: "AssertionsInterval";
      /** The interval the number of assertions must lie in. */
      readonly interval: Interval;
    };

/** `obj`, `obj(p)`: the object of an assertion. */
export type ObjectPattern =
  | {
      /** The discriminant. */
      readonly variant: "Any";
    }
  | {
      /** The discriminant. */
      readonly variant: "Pattern";
      /** The pattern the object must match. */
      readonly pattern: Pattern;
    };

/** `obscured`, `elided`, `encrypted`, `compressed`. */
export interface ObscuredPattern {
  /** Which obscured form, or any. */
  readonly variant: "Any" | "Elided" | "Encrypted" | "Compressed";
}

/** `pred`, `pred(p)`: the predicate of an assertion. */
export type PredicatePattern =
  | {
      /** The discriminant. */
      readonly variant: "Any";
    }
  | {
      /** The discriminant. */
      readonly variant: "Pattern";
      /** The pattern the predicate must match. */
      readonly pattern: Pattern;
    };

/** `subj`, `subj(p)`: the subject of an envelope. */
export type SubjectPattern =
  | {
      /** The discriminant. */
      readonly variant: "Any";
    }
  | {
      /** The discriminant. */
      readonly variant: "Pattern";
      /** The pattern the subject must match. */
      readonly pattern: Pattern;
    };

/** `wrapped`, `unwrap`, `unwrap(p)`: a wrapped envelope and its content. */
export type WrappedPattern =
  | {
      /** The discriminant. */
      readonly variant: "Any";
    }
  | {
      /** The discriminant. */
      readonly variant: "Unwrap";
      /** The pattern the content must match. */
      readonly pattern: Pattern;
    };

/** A structure pattern: an element of the envelope tree. */
export type StructurePattern =
  | {
      /** The discriminant. */
      readonly type: "Leaf";
    }
  | {
      /** The discriminant. */
      readonly type: "Assertions";
      /** The pattern. */
      readonly pattern: AssertionsPattern;
    }
  | {
      /** The discriminant. */
      readonly type: "Digest";
      /** The pattern. */
      readonly pattern: DigestPattern;
    }
  | {
      /** The discriminant. */
      readonly type: "Node";
      /** The pattern. */
      readonly pattern: NodePattern;
    }
  | {
      /** The discriminant. */
      readonly type: "Object";
      /** The pattern. */
      readonly pattern: ObjectPattern;
    }
  | {
      /** The discriminant. */
      readonly type: "Obscured";
      /** The pattern. */
      readonly pattern: ObscuredPattern;
    }
  | {
      /** The discriminant. */
      readonly type: "Predicate";
      /** The pattern. */
      readonly pattern: PredicatePattern;
    }
  | {
      /** The discriminant. */
      readonly type: "Subject";
      /** The pattern. */
      readonly pattern: SubjectPattern;
    }
  | {
      /** The discriminant. */
      readonly type: "Wrapped";
      /** The pattern. */
      readonly pattern: WrappedPattern;
    };

/** A meta pattern: a combinator over patterns. */
export type MetaPattern =
  | {
      /** The discriminant. */
      readonly type: "Any";
    }
  | {
      /** The discriminant. */
      readonly type: "And";
      /** The operands, matched in sequence. */
      readonly patterns: readonly Pattern[];
    }
  | {
      /** The discriminant. */
      readonly type: "Or";
      /** The alternatives, each explored. */
      readonly patterns: readonly Pattern[];
    }
  | {
      /** The discriminant. */
      readonly type: "Not";
      /** The pattern that must not match. */
      readonly pattern: Pattern;
    }
  | {
      /** The discriminant. */
      readonly type: "Search";
      /** The pattern tried at every node of the tree. */
      readonly pattern: Pattern;
    }
  | {
      /** The discriminant. */
      readonly type: "Traverse";
      /** The steps, each matched from where the previous one ended. */
      readonly patterns: readonly Pattern[];
    }
  | {
      /** The discriminant. */
      readonly type: "Group";
      /** The repeated pattern. */
      readonly pattern: Pattern;
      /** How many times, and how eagerly. */
      readonly quantifier: Quantifier;
    }
  | {
      /** The discriminant. */
      readonly type: "Capture";
      /** The capture name. */
      readonly name: string;
      /** The pattern whose matches are recorded under `name`. */
      readonly pattern: Pattern;
    };

/** A pattern: a leaf pattern, a structure pattern or a meta pattern. */
export type Pattern =
  | {
      /** The discriminant. */
      readonly kind: "Leaf";
      /** The leaf pattern. */
      readonly pattern: LeafPattern;
    }
  | {
      /** The discriminant. */
      readonly kind: "Structure";
      /** The structure pattern. */
      readonly pattern: StructurePattern;
    }
  | {
      /** The discriminant. */
      readonly kind: "Meta";
      /** The meta pattern. */
      readonly pattern: MetaPattern;
    };

/** Freezes and wraps a leaf pattern. */
export const leafPattern = (pattern: LeafPattern): Pattern =>
  Object.freeze({ kind: "Leaf", pattern: Object.freeze(pattern) });

/** Freezes and wraps a structure pattern. */
export const structurePattern = (pattern: StructurePattern): Pattern =>
  Object.freeze({ kind: "Structure", pattern: Object.freeze(pattern) });

/** Freezes and wraps a meta pattern. */
export const metaPattern = (pattern: MetaPattern): Pattern =>
  Object.freeze({ kind: "Meta", pattern: Object.freeze(pattern) });
