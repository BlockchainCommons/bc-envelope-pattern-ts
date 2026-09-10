import { n as Path, t as MatchResult } from "./path-CyiQSXnM.mjs";
import { Interval, Interval as Interval$1, Pattern as Pattern$1, PatternRegex, PatternRegex as PatternRegex$1, Quantifier, Quantifier as Quantifier$1, RegexInput, RegexInput as RegexInput$1, Reluctance } from "@blockchaincommons/dcbor-pattern";
import { Envelope } from "@blockchaincommons/envelope";
import { Cbor, CborDate, CborInput, Tag } from "@blockchaincommons/dcbor";
import { ArrayPattern, BoolPattern, ByteStringPattern, DatePattern, KnownValuePattern, MapPattern, NullPattern, NumberPattern, TaggedPattern, TextPattern } from "@blockchaincommons/dcbor-pattern/patterns";
import { Digest } from "@blockchaincommons/components";
import { KnownValue } from "@blockchaincommons/known-values";
//#region src/error.d.ts
/**
 * Errors: `EnvelopePatternError` for text that does not parse. Spans are
 * UTF-16 code-unit offsets into the source, always absolute.
 *
 * @module error
 */
/** A non-throwing outcome: the value, or the error. */
type DcborResult<T, E> = {
  /** `true`: `value` is present. */
  readonly ok: true;
  /** The outcome. */
  readonly value: T;
} | {
  /** `false`: `error` is present. */
  readonly ok: false;
  /** Why there is no value. */
  readonly error: E;
};
/** A half-open range of UTF-16 code units in the source string. */
interface Span {
  /** The offset of the first code unit. */
  readonly start: number;
  /** The offset after the last code unit. */
  readonly end: number;
}
/** Builds a frozen span. */
export declare function span(start: number, end: number): Span;
/** The kind of a token, as `UnexpectedToken` reports it. */
type TokenKind = "And" | "Or" | "Not" | "Traverse" | "RepeatZeroOrMore" | "RepeatZeroOrMoreLazy" | "RepeatZeroOrMorePossessive" | "RepeatOneOrMore" | "RepeatOneOrMoreLazy" | "RepeatOneOrMorePossessive" | "RepeatZeroOrOne" | "RepeatZeroOrOneLazy" | "RepeatZeroOrOnePossessive" | "Assertion" | "AssertionPred" | "AssertionObj" | "Digest" | "Node" | "Obj" | "Obscured" | "Elided" | "Encrypted" | "Compressed" | "Pred" | "Subject" | "Wrapped" | "Unwrap" | "Search" | "ByteString" | "Leaf" | "Cbor" | "DateKeyword" | "Known" | "Null" | "NumberKeyword" | "Tagged" | "BoolKeyword" | "BoolTrue" | "BoolFalse" | "TextKeyword" | "NaN" | "StringLiteral" | "ParenOpen" | "ParenClose" | "BracketOpen" | "BracketClose" | "Comma" | "Ellipsis" | "GreaterThanOrEqual" | "LessThanOrEqual" | "GreaterThan" | "LessThan" | "Integer" | "Float" | "Infinity" | "NegativeInfinity" | "GroupName" | "Regex" | "HexPattern" | "HexBinaryRegex" | "DatePattern" | "Range" | "SingleQuotedPattern" | "SingleQuotedRegex";
/** Why a pattern text was rejected. */
export declare const EnvelopePatternErrorCode: {
  /** The source is empty. */
  readonly EmptyInput: "EmptyInput";
  /** The source ended inside a pattern. */
  readonly UnexpectedEndOfInput: "UnexpectedEndOfInput";
  /** Text follows the pattern. */
  readonly ExtraData: "ExtraData";
  /** A token that cannot start or continue a pattern here. */
  readonly UnexpectedToken: "UnexpectedToken";
  /** Text no token matches. */
  readonly UnrecognizedToken: "UnrecognizedToken";
  /** A regex the pattern language's dialect does not accept. */
  readonly InvalidRegex: "InvalidRegex";
  /** A regex or quoted literal without its closing delimiter. */
  readonly UnterminatedRegex: "UnterminatedRegex";
  /** A `{n,m}` range that is not one, or with `n` above `m`. */
  readonly InvalidRange: "InvalidRange";
  /** An `h'…'` or `digest(…)` body that is not even-length hex of at most 32 bytes. */
  readonly InvalidHexString: "InvalidHexString";
  /** A `date'…'` body that is not a date, a range of dates, or a regex. */
  readonly InvalidDateFormat: "InvalidDateFormat";
  /** A number literal outside the 64-bit integer range. */
  readonly InvalidNumberFormat: "InvalidNumberFormat";
  /** A `digest(ur:…)` body the UR decoder rejects. */
  readonly InvalidUr: "InvalidUr";
  /** An opening parenthesis was required. */
  readonly ExpectedOpenParen: "ExpectedOpenParen";
  /** A closing parenthesis was required. */
  readonly ExpectedCloseParen: "ExpectedCloseParen";
  /** An opening bracket was required. */
  readonly ExpectedOpenBracket: "ExpectedOpenBracket";
  /** A closing bracket was required. */
  readonly ExpectedCloseBracket: "ExpectedCloseBracket";
  /** A pattern was required after an operator. */
  readonly ExpectedPattern: "ExpectedPattern";
  /** Parentheses that do not pair. */
  readonly UnmatchedParentheses: "UnmatchedParentheses";
  /** Braces that do not pair. */
  readonly UnmatchedBraces: "UnmatchedBraces";
  /** A capture name that is not an identifier. */
  readonly InvalidCaptureGroupName: "InvalidCaptureGroupName";
  /** A `cbor(…)` body that is neither a value, a UR nor a dCBOR pattern. */
  readonly InvalidPattern: "InvalidPattern";
  /** Nesting deeper than `ParseOptions.maxDepth`; this package's own limit. */
  readonly NestingTooDeep: "NestingTooDeep";
};
/** One of the `EnvelopePatternErrorCode` values. */
export type EnvelopePatternErrorCode = (typeof EnvelopePatternErrorCode)[keyof typeof EnvelopePatternErrorCode];
/**
 * The structured payload of an {@link EnvelopePatternError}, discriminated
 * by `code`: `e.details.code === "UnexpectedToken"` narrows to `{ span,
 * kind, text }`. Every code but `EmptyInput` and `UnexpectedEndOfInput`
 * carries the span of the offending text.
 */
type EnvelopePatternErrorDetails = {
  /** The discriminant. */
  readonly code: "EmptyInput";
} | {
  /** The discriminant. */
  readonly code: "UnexpectedEndOfInput";
} | {
  /** The discriminant. */
  readonly code: "ExtraData";
  /** The text after the pattern. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "UnexpectedToken";
  /** The token. */
  readonly span: Span;
  /** The kind of the token found. */
  readonly kind: TokenKind;
  /** The token's source text. */
  readonly text: string;
} | {
  /** The discriminant. */
  readonly code: "UnrecognizedToken";
  /** The unrecognised text. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "InvalidRegex";
  /** The regex literal. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "UnterminatedRegex";
  /** The opening delimiter. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "InvalidRange";
  /** The range text. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "InvalidHexString";
  /** The literal. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "InvalidDateFormat";
  /** The literal. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "InvalidNumberFormat";
  /** The literal. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "InvalidUr";
  /** The literal. */
  readonly span: Span;
  /** The UR decoder's reason. */
  readonly cause: string;
} | {
  /** The discriminant. */
  readonly code: "ExpectedOpenParen";
  /** Where the parenthesis was required. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "ExpectedCloseParen";
  /** The token found instead, or the end of the source. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "ExpectedOpenBracket";
  /** Where the bracket was required. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "ExpectedCloseBracket";
  /** The token found instead, or the end of the source. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "ExpectedPattern";
  /** Where the pattern was required. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "UnmatchedParentheses";
  /** The parenthesis without a pair. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "UnmatchedBraces";
  /** The brace without a pair. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "InvalidCaptureGroupName";
  /** The `@` and the name. */
  readonly span: Span;
  /** The name as written. */
  readonly name: string;
} | {
  /** The discriminant. */
  readonly code: "InvalidPattern";
  /** The body. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "NestingTooDeep";
  /** The token that opened the level too many. */
  readonly span: Span;
  /** The limit in force. */
  readonly maxDepth: number;
};
/** The details payload of each `EnvelopePatternErrorCode`. */
type EnvelopePatternErrorDetailsByCode = { [D in EnvelopePatternErrorDetails as D["code"]]: D; };
/**
 * An {@link EnvelopePatternError} narrowed to one code: `code` is `C` and
 * `details` is the payload of `C`. With the default type argument it is the
 * union over every code, so narrowing on `error.code` narrows `error.details`.
 */
type EnvelopePatternErrorTyped<C extends EnvelopePatternErrorCode = EnvelopePatternErrorCode> = C extends EnvelopePatternErrorCode ? EnvelopePatternError & {
  /** The discriminant. */
  readonly code: C;
  /** The payload of `code`. */
  readonly details: EnvelopePatternErrorDetailsByCode[C];
} : never;
/**
 * Thrown by `parseEnvelopePattern` (and carried by `tryParseEnvelopePattern`)
 * for text that does not parse. `code` says why; `details` carries the span
 * and the code-specific fields; `fullMessage(source)` renders the message
 * with the source line and a caret. Instances come from the static
 * factories only.
 *
 * @example
 * ```ts
 * try {
 *   parseEnvelopePattern("subj(text");
 * } catch (e) {
 *   if (EnvelopePatternError.isEnvelopePatternError(e) && e.code === "ExpectedCloseParen") {
 *     e.details.span; // where the parenthesis was required
 *   }
 * }
 * ```
 */
export declare class EnvelopePatternError extends Error {
  /** Always `"EnvelopePatternError"`; the cross-copy identity {@link EnvelopePatternError.isEnvelopePatternError} checks. */
  override readonly name = "EnvelopePatternError";
  /** The discriminant; equals `details.code`. */
  readonly code: EnvelopePatternErrorCode;
  /** The structured payload, discriminated by `code`. */
  readonly details: EnvelopePatternErrorDetails;
  private constructor();
  /** Type guard for an `EnvelopePatternError`, including one from another copy of this package. */
  static isEnvelopePatternError(value: unknown): value is EnvelopePatternErrorTyped;
  /** `true` when `code` is this error's code. */
  is(code: EnvelopePatternErrorCode): boolean;
  /** The span, if the error has one. */
  get span(): Span | undefined;
  /** The message with the source line and a caret under the span. */
  fullMessage(source: string): string;
  /** @internal The same error with its span moved by `offset`. */
  shifted(offset: number): EnvelopePatternError;
  private static make;
  /** The source is empty. */
  static emptyInput(): EnvelopePatternErrorTyped<"EmptyInput">;
  /** The source ended inside a pattern. */
  static unexpectedEndOfInput(): EnvelopePatternErrorTyped<"UnexpectedEndOfInput">;
  /** Text follows the pattern. */
  static extraData(range: Span): EnvelopePatternErrorTyped<"ExtraData">;
  /** A token that cannot start or continue a pattern here. */
  static unexpectedToken(kind: TokenKind, text: string, range: Span): EnvelopePatternErrorTyped<"UnexpectedToken">;
  /** Text no token matches. */
  static unrecognizedToken(range: Span): EnvelopePatternErrorTyped<"UnrecognizedToken">;
  /** A regex the dialect does not accept. */
  static invalidRegex(range: Span): EnvelopePatternErrorTyped<"InvalidRegex">;
  /** A regex or quoted literal without its closing delimiter. */
  static unterminatedRegex(range: Span): EnvelopePatternErrorTyped<"UnterminatedRegex">;
  /** A `{n,m}` range that is not one, or with `n` above `m`. */
  static invalidRange(range: Span): EnvelopePatternErrorTyped<"InvalidRange">;
  /** A hex literal that is not even-length hex of at most 32 bytes. */
  static invalidHexString(range: Span): EnvelopePatternErrorTyped<"InvalidHexString">;
  /** A `date'…'` body that is not a date, a range of dates, or a regex. */
  static invalidDateFormat(range: Span): EnvelopePatternErrorTyped<"InvalidDateFormat">;
  /** A number literal outside the 64-bit integer range. */
  static invalidNumberFormat(range: Span): EnvelopePatternErrorTyped<"InvalidNumberFormat">;
  /** A `digest(ur:…)` body the UR decoder rejects. */
  static invalidUr(cause: string, range: Span): EnvelopePatternErrorTyped<"InvalidUr">;
  /** An opening parenthesis was required. */
  static expectedOpenParen(range: Span): EnvelopePatternErrorTyped<"ExpectedOpenParen">;
  /** A closing parenthesis was required. */
  static expectedCloseParen(range: Span): EnvelopePatternErrorTyped<"ExpectedCloseParen">;
  /** An opening bracket was required. */
  static expectedOpenBracket(range: Span): EnvelopePatternErrorTyped<"ExpectedOpenBracket">;
  /** A closing bracket was required. */
  static expectedCloseBracket(range: Span): EnvelopePatternErrorTyped<"ExpectedCloseBracket">;
  /** A pattern was required after an operator. */
  static expectedPattern(range: Span): EnvelopePatternErrorTyped<"ExpectedPattern">;
  /** Parentheses that do not pair. */
  static unmatchedParentheses(range: Span): EnvelopePatternErrorTyped<"UnmatchedParentheses">;
  /** Braces that do not pair. */
  static unmatchedBraces(range: Span): EnvelopePatternErrorTyped<"UnmatchedBraces">;
  /** A capture name that is not an identifier. */
  static invalidCaptureGroupName(name: string, range: Span): EnvelopePatternErrorTyped<"InvalidCaptureGroupName">;
  /** A `cbor(…)` body that is neither a value, a UR nor a dCBOR pattern. */
  static invalidPattern(range: Span): EnvelopePatternErrorTyped<"InvalidPattern">;
  /** A pattern nested deeper than `maxDepth`. */
  static nestingTooDeep(maxDepth: number, range: Span): EnvelopePatternErrorTyped<"NestingTooDeep">;
}
//#endregion
//#region src/pattern/types.d.ts
/** `cbor`, `cbor(value)` or `cbor(/pattern/)`: the subject's CBOR. */
type CborPattern = {
  /** The discriminant. */
  readonly variant: "Any";
} | {
  /** The discriminant. */
  readonly variant: "Value";
  /** The CBOR the subject must equal. */
  readonly cbor: Cbor;
} | {
  /** The discriminant. */
  readonly variant: "Pattern";
  /** The dCBOR pattern the subject's CBOR must match; its paths extend the envelope path. */
  readonly pattern: Pattern$1;
};
/** A leaf pattern: a dCBOR pattern applied to the subject's CBOR. */
type LeafPattern = {
  /** The discriminant. */
  readonly type: "Cbor";
  /** The pattern. */
  readonly pattern: CborPattern;
} | {
  /** The discriminant. */
  readonly type: "Number";
  /** The pattern. */
  readonly pattern: NumberPattern;
} | {
  /** The discriminant. */
  readonly type: "Text";
  /** The pattern. */
  readonly pattern: TextPattern;
} | {
  /** The discriminant. */
  readonly type: "ByteString";
  /** The pattern. */
  readonly pattern: ByteStringPattern;
} | {
  /** The discriminant. */
  readonly type: "Tagged";
  /** The pattern; its paths and captures collapse to the envelope. */
  readonly pattern: TaggedPattern;
} | {
  /** The discriminant. */
  readonly type: "Array";
  /** The pattern. */
  readonly pattern: ArrayPattern;
} | {
  /** The discriminant. */
  readonly type: "Map";
  /** The pattern. */
  readonly pattern: MapPattern;
} | {
  /** The discriminant. */
  readonly type: "Bool";
  /** The pattern. */
  readonly pattern: BoolPattern;
} | {
  /** The discriminant. */
  readonly type: "Null";
  /** The pattern. */
  readonly pattern: NullPattern;
} | {
  /** The discriminant. */
  readonly type: "Date";
  /** The pattern. */
  readonly pattern: DatePattern;
} | {
  /** The discriminant. */
  readonly type: "KnownValue";
  /** The pattern. */
  readonly pattern: KnownValuePattern;
};
/** `assert`, `assertpred(p)`, `assertobj(p)`: the assertions of a node. */
type AssertionsPattern = {
  /** The discriminant. */
  readonly variant: "Any";
} | {
  /** The discriminant. */
  readonly variant: "WithPredicate";
  /** The pattern the predicate must match. */
  readonly pattern: Pattern;
} | {
  /** The discriminant. */
  readonly variant: "WithObject";
  /** The pattern the object must match. */
  readonly pattern: Pattern;
};
/** `digest(hex)`, `digest(ur:digest/…)`, `digest(/regex/)`: the envelope's digest. */
type DigestPattern = {
  /** The discriminant. */
  readonly variant: "Digest";
  /** The digest the envelope must have. */
  readonly digest: Digest;
} | {
  /** The discriminant. */
  readonly variant: "Prefix";
  /** The bytes the digest must start with. */
  readonly prefix: Uint8Array;
} | {
  /** The discriminant. */
  readonly variant: "BinaryRegex";
  /** The byte regex the digest must match. */
  readonly regex: PatternRegex$1;
};
/** `node`, `node({n,m})`: an envelope with assertions. */
type NodePattern = {
  /** The discriminant. */
  readonly variant: "Any";
} | {
  /** The discriminant. */
  readonly variant: "AssertionsInterval";
  /** The interval the number of assertions must lie in. */
  readonly interval: Interval$1;
};
/** `obj`, `obj(p)`: the object of an assertion. */
type ObjectPattern = {
  /** The discriminant. */
  readonly variant: "Any";
} | {
  /** The discriminant. */
  readonly variant: "Pattern";
  /** The pattern the object must match. */
  readonly pattern: Pattern;
};
/** `obscured`, `elided`, `encrypted`, `compressed`. */
interface ObscuredPattern {
  /** Which obscured form, or any. */
  readonly variant: "Any" | "Elided" | "Encrypted" | "Compressed";
}
/** `pred`, `pred(p)`: the predicate of an assertion. */
type PredicatePattern = {
  /** The discriminant. */
  readonly variant: "Any";
} | {
  /** The discriminant. */
  readonly variant: "Pattern";
  /** The pattern the predicate must match. */
  readonly pattern: Pattern;
};
/** `subj`, `subj(p)`: the subject of an envelope. */
type SubjectPattern = {
  /** The discriminant. */
  readonly variant: "Any";
} | {
  /** The discriminant. */
  readonly variant: "Pattern";
  /** The pattern the subject must match. */
  readonly pattern: Pattern;
};
/** `wrapped`, `unwrap`, `unwrap(p)`: a wrapped envelope and its content. */
type WrappedPattern = {
  /** The discriminant. */
  readonly variant: "Any";
} | {
  /** The discriminant. */
  readonly variant: "Unwrap";
  /** The pattern the content must match. */
  readonly pattern: Pattern;
};
/** A structure pattern: an element of the envelope tree. */
type StructurePattern = {
  /** The discriminant. */
  readonly type: "Leaf";
} | {
  /** The discriminant. */
  readonly type: "Assertions";
  /** The pattern. */
  readonly pattern: AssertionsPattern;
} | {
  /** The discriminant. */
  readonly type: "Digest";
  /** The pattern. */
  readonly pattern: DigestPattern;
} | {
  /** The discriminant. */
  readonly type: "Node";
  /** The pattern. */
  readonly pattern: NodePattern;
} | {
  /** The discriminant. */
  readonly type: "Object";
  /** The pattern. */
  readonly pattern: ObjectPattern;
} | {
  /** The discriminant. */
  readonly type: "Obscured";
  /** The pattern. */
  readonly pattern: ObscuredPattern;
} | {
  /** The discriminant. */
  readonly type: "Predicate";
  /** The pattern. */
  readonly pattern: PredicatePattern;
} | {
  /** The discriminant. */
  readonly type: "Subject";
  /** The pattern. */
  readonly pattern: SubjectPattern;
} | {
  /** The discriminant. */
  readonly type: "Wrapped";
  /** The pattern. */
  readonly pattern: WrappedPattern;
};
/** A meta pattern: a combinator over patterns. */
type MetaPattern = {
  /** The discriminant. */
  readonly type: "Any";
} | {
  /** The discriminant. */
  readonly type: "And";
  /** The operands, matched in sequence. */
  readonly patterns: readonly Pattern[];
} | {
  /** The discriminant. */
  readonly type: "Or";
  /** The alternatives, each explored. */
  readonly patterns: readonly Pattern[];
} | {
  /** The discriminant. */
  readonly type: "Not";
  /** The pattern that must not match. */
  readonly pattern: Pattern;
} | {
  /** The discriminant. */
  readonly type: "Search";
  /** The pattern tried at every node of the tree. */
  readonly pattern: Pattern;
} | {
  /** The discriminant. */
  readonly type: "Traverse";
  /** The steps, each matched from where the previous one ended. */
  readonly patterns: readonly Pattern[];
} | {
  /** The discriminant. */
  readonly type: "Group";
  /** The repeated pattern. */
  readonly pattern: Pattern;
  /** How many times, and how eagerly. */
  readonly quantifier: Quantifier$1;
} | {
  /** The discriminant. */
  readonly type: "Capture";
  /** The capture name. */
  readonly name: string;
  /** The pattern whose matches are recorded under `name`. */
  readonly pattern: Pattern;
};
/** A pattern: a leaf pattern, a structure pattern or a meta pattern. */
type Pattern = {
  /** The discriminant. */
  readonly kind: "Leaf";
  /** The leaf pattern. */
  readonly pattern: LeafPattern;
} | {
  /** The discriminant. */
  readonly kind: "Structure";
  /** The structure pattern. */
  readonly pattern: StructurePattern;
} | {
  /** The discriminant. */
  readonly kind: "Meta";
  /** The meta pattern. */
  readonly pattern: MetaPattern;
};
//#endregion
//#region src/pattern/index.d.ts
/**
 * Every path in `haystack` the pattern matches.
 *
 * @throws {TypeError} If `pattern` is not a `Pattern` or `haystack` is not an `Envelope`
 */
export declare const paths: (pattern: Pattern, haystack: Envelope) => Path[];
/**
 * Whether the pattern matches `haystack`.
 *
 * @throws {TypeError} If `pattern` is not a `Pattern` or `haystack` is not an `Envelope`
 */
export declare const matches: (pattern: Pattern, haystack: Envelope) => boolean;
/**
 * The canonical text of the pattern.
 *
 * @throws {TypeError} If `pattern` is not a `Pattern`
 */
export declare const display: (pattern: Pattern) => string;
/**
 * Every path the pattern matches in `haystack`, with the paths each capture
 * name matched; the result and its arrays are frozen.
 *
 * @throws {TypeError} If `pattern` is not a `Pattern` or `haystack` is not an `Envelope`
 */
export declare const pathsWithCaptures: (pattern: Pattern, haystack: Envelope) => MatchResult;
/**
 * Whether two patterns are the same pattern: the same kinds, values, regex
 * sources and sub-patterns.
 *
 * @throws {TypeError} If either argument is not a `Pattern`
 */
export declare const patternEquals: (a: Pattern, b: Pattern) => boolean;
//#endregion
//#region src/pattern/constructors.d.ts
/** `cbor`: matches any subject CBOR. */
export declare const anyCbor: () => Pattern;
/**
 * A subject equal to `value`, or a subject whose CBOR matches an embedded
 * dCBOR `pattern`.
 */
export declare function cbor(valueOrPattern: CborInput | Pattern$1): Pattern;
/** `bool`: matches any boolean subject. */
export declare const anyBool: () => Pattern;
/** `true` / `false`: matches that boolean subject. */
export declare const boolean: (value: boolean) => Pattern;
/** `text`: matches any text subject. */
export declare const anyText: () => Pattern;
/** `"string"`: matches that text subject. */
export declare const text: (value: string) => Pattern;
/** `/regex/`: matches a text subject the regex matches. */
export declare const textRegex: (regex: RegexInput$1) => Pattern;
/** `date`: matches any date subject. */
export declare const anyDate: () => Pattern;
/** `date'iso'`: matches that date subject. */
export declare const date: (value: CborDate) => Pattern;
/** `date'a...b'`: matches a date subject in the inclusive range. */
export declare const dateRange: (min: CborDate, max: CborDate) => Pattern;
/** `date'a...'`: matches a date subject on or after `value`. */
export declare const dateEarliest: (value: CborDate) => Pattern;
/** `date'...b'`: matches a date subject on or before `value`. */
export declare const dateLatest: (value: CborDate) => Pattern;
/** A date subject matched by its ISO-8601 text. */
export declare const dateIso8601: (value: string) => Pattern;
/** `date'/regex/'`: matches a date subject whose ISO-8601 text the regex matches. */
export declare const dateRegex: (regex: RegexInput$1) => Pattern;
/** `number`: matches any number subject. */
export declare const anyNumber: () => Pattern;
/** A bare number: matches that number subject. */
export declare const number: (value: number) => Pattern;
/** `min...max`: matches a number subject in the inclusive range. */
export declare const numberRange: (min: number, max: number) => Pattern;
/** `>value`. */
export declare const numberGreaterThan: (value: number) => Pattern;
/** `>=value`. */
export declare const numberGreaterThanOrEqual: (value: number) => Pattern;
/** `<value`. */
export declare const numberLessThan: (value: number) => Pattern;
/** `<=value`. */
export declare const numberLessThanOrEqual: (value: number) => Pattern;
/** `NaN`: matches a NaN subject. */
export declare const numberNaN: () => Pattern;
/** `bstr`: matches any byte-string subject. */
export declare const anyByteString: () => Pattern;
/** `h'hex'`: matches that byte-string subject. */
export declare const byteString: (value: Uint8Array) => Pattern;
/** `h'/regex/'`: matches a byte-string subject the byte regex matches. */
export declare const byteStringRegex: (regex: RegexInput$1) => Pattern;
/** `known`: matches any known-value subject. */
export declare const anyKnownValue: () => Pattern;
/** `'value'` / `'name'`: matches that known-value subject, given as a `KnownValue`, its number, or its name. */
export declare const knownValue: (value: KnownValue | number | bigint | string) => Pattern;
/** `'name'`: matches the known-value subject registered as `name`. */
export declare const knownValueNamed: (name: string) => Pattern;
/** `'/regex/'`: matches a known-value subject whose name the regex matches. */
export declare const knownValueRegex: (regex: RegexInput$1) => Pattern;
/** The known value `''` (unit). */
export declare const unit: () => Pattern;
/** `array`: matches any array subject. */
export declare const anyArray: () => Pattern;
/** `[{min,max}]`: matches an array subject with that many elements (unbounded without `max`). */
export declare const arrayWithRange: (min: number, max?: number) => Pattern;
/** `[{n}]`: matches an array subject with exactly `count` elements. */
export declare const arrayWithCount: (count: number) => Pattern;
/** `map`: matches any map subject. */
export declare const anyMap: () => Pattern;
/** `{{min,max}}`: matches a map subject with that many entries (unbounded without `max`). */
export declare const mapWithRange: (min: number, max?: number) => Pattern;
/** `{{n}}`: matches a map subject with exactly `count` entries. */
export declare const mapWithCount: (count: number) => Pattern;
/** `null`: matches a null subject. */
export declare const nullValue: () => Pattern;
/** `tagged`: matches any tagged subject. */
export declare const anyTagged: () => Pattern;
/** `tagged(tag, p)`: matches a tagged subject with that tag (a `Tag`, its number, or its registered name) whose content matches the dCBOR pattern. */
export declare const tagged: (tag: Tag | number | bigint | string, pattern: Pattern$1) => Pattern;
/** `tagged(name, p)`: matches a tagged subject whose tag is registered as `name`. */
export declare const taggedName: (name: string, pattern: Pattern$1) => Pattern;
/** `tagged(/regex/, p)`: matches a tagged subject whose registered tag name the regex matches. */
export declare const taggedRegex: (regex: RegexInput$1, pattern: Pattern$1) => Pattern;
/** `leaf`: matches a leaf or known-value envelope. */
export declare const leaf: () => Pattern;
/** `assert`: matches every assertion of a node. */
export declare const anyAssertion: () => Pattern;
/** `assertpred(p)`: matches the assertions whose predicate matches `pattern`. */
export declare const assertionWithPredicate: (pattern: Pattern) => Pattern;
/** `assertobj(p)`: matches the assertions whose object matches `pattern`. */
export declare const assertionWithObject: (pattern: Pattern) => Pattern;
/** `subj`: matches the subject of any envelope. */
export declare const anySubject: () => Pattern;
/** `subj(p)`: matches the subject when it matches `pattern`. */
export declare const subject: (pattern: Pattern) => Pattern;
/** `pred`: matches the predicate of an assertion. */
export declare const anyPredicate: () => Pattern;
/** `pred(p)`: matches the predicate of an assertion when it matches `pattern`. */
export declare const predicate: (pattern: Pattern) => Pattern;
/** `obj`: matches the object of an assertion. */
export declare const anyObject: () => Pattern;
/** `obj(p)`: matches the object of an assertion when it matches `pattern`. */
export declare const object: (pattern: Pattern) => Pattern;
/** `digest(ur:digest/…)`: matches the envelope with that digest. */
export declare const digest: (value: Digest) => Pattern;
/** `digest(hex)`: matches envelopes whose digest starts with `prefix` (at most 32 bytes). */
export declare const digestPrefix: (prefix: Uint8Array) => Pattern;
/** `digest(/regex/)`: matches envelopes whose digest bytes the byte regex matches. */
export declare const digestBinaryRegex: (regex: RegexInput$1) => Pattern;
/** `node`: matches any envelope with assertions. */
export declare const anyNode: () => Pattern;
/** `node({min,max})`: matches a node with that many assertions (unbounded without `max`). */
export declare const nodeWithAssertionsRange: (min: number, max?: number) => Pattern;
/** `node({n})`: matches a node with exactly `count` assertions. */
export declare const nodeWithAssertionsCount: (count: number) => Pattern;
/** `obscured`: matches an elided, encrypted or compressed envelope. */
export declare const obscured: () => Pattern;
/** `elided`. */
export declare const elided: () => Pattern;
/** `encrypted`. */
export declare const encrypted: () => Pattern;
/** `compressed`. */
export declare const compressed: () => Pattern;
/** `wrapped`: matches an envelope whose subject is wrapped, without descending. */
export declare const wrapped: () => Pattern;
/** `unwrap` / `unwrap(p)`: the content of a wrapped envelope, matching `pattern` when given. */
export declare const unwrap: (pattern?: Pattern) => Pattern;
/** `*`: matches any envelope. */
export declare const any: () => Pattern;
/**
 * `a & b & …`: matches when every operand matches, each continuing where the previous one ended.
 *
 * @throws {RangeError} If there is no operand
 */
export declare const and: (...patterns: Pattern[]) => Pattern;
/**
 * `a | b | …`: matches when any operand matches; every matching alternative yields its paths.
 *
 * @throws {RangeError} If there is no operand
 */
export declare const or: (...patterns: Pattern[]) => Pattern;
/** `!p`: matches when `pattern` does not. */
export declare const not: (pattern: Pattern) => Pattern;
/** `a -> b -> …`: each pattern matched from where the previous one ended; no pattern is `!*`. */
export declare const traverse: (...patterns: Pattern[]) => Pattern;
/** `search(p)`: matches at every node of the tree where `pattern` matches. */
export declare const search: (pattern: Pattern) => Pattern;
/** `(p){n,m}`: `pattern` repeated according to `quantifier`. */
export declare const repeat: (pattern: Pattern, quantifier: Quantifier$1) => Pattern;
/** `(p){1}`: a group, which is a repeat of exactly one. */
export declare const group: (pattern: Pattern) => Pattern;
/** `@name(p)`: matches as `pattern` and records the paths it matched under `name`. */
export declare const capture: (name: string, pattern: Pattern) => Pattern;
//#endregion
//#region src/parse/index.d.ts
/** How deep a pattern may nest; the field has a default. */
interface ParseOptions {
  /** The deepest nesting of groups, captures, `search`, `!` and the structure forms accepted (a positive integer), 500 by default. */
  readonly maxDepth?: number | undefined;
}
/**
 * Parses a whole pattern string; whitespace may surround the pattern.
 *
 * @throws {EnvelopePatternError} If the string is not a pattern, has trailing input, or nests deeper than `maxDepth`
 * @throws {TypeError} If `input` is not a string
 * @throws {RangeError} If `maxDepth` is not a positive integer
 */
export declare function parseEnvelopePattern(input: string, options?: ParseOptions): Pattern;
/** `parseEnvelopePattern` with the error returned instead of thrown; a `TypeError` or `RangeError` still throws. */
export declare function tryParseEnvelopePattern(input: string, options?: ParseOptions): DcborResult<Pattern, EnvelopePatternError>;
//#endregion
export { type AssertionsPattern, type CborPattern, type DcborResult, type DigestPattern, type EnvelopePatternErrorDetails, type EnvelopePatternErrorDetailsByCode, type EnvelopePatternErrorTyped, Interval, type LeafPattern, type MatchResult, type MetaPattern, type NodePattern, type ObjectPattern, type ObscuredPattern, type ParseOptions, type Path, type Pattern, type PatternRegex, type PredicatePattern, Quantifier, type RegexInput, Reluctance, type Span, type StructurePattern, type SubjectPattern, type TokenKind, type WrappedPattern };
//# sourceMappingURL=index.d.mts.map