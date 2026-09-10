import { ArrayPattern as ArrayPattern$1, BoolPattern as BoolPattern$1, ByteStringPattern as ByteStringPattern$1, DatePattern as DatePattern$1, Interval, Interval as Interval$1, KnownValuePattern as KnownValuePattern$1, NullPattern as NullPattern$1, NumberPattern as NumberPattern$1, Pattern as Pattern$1, Quantifier, Quantifier as Quantifier$1, Reluctance, Reluctance as Reluctance$1, TaggedPattern as TaggedPattern$1, TextPattern as TextPattern$1 } from "@blockchaincommons/dcbor-pattern";
import { KnownValue } from "@blockchaincommons/known-values";
import { Cbor, CborDate, CborInput, Tag } from "@blockchaincommons/dcbor-compat";
import { Digest, Envelope } from "@blockchaincommons/envelope";
//#region src/parse/token.d.ts
/**
 * Token types for the Gordian Envelope pattern syntax.
 *
 * Corresponds to the Rust `Token` enum in token.rs
 */
type Token = {
  readonly type: "And";
} | {
  readonly type: "Or";
} | {
  readonly type: "Not";
} | {
  readonly type: "Traverse";
} | {
  readonly type: "RepeatZeroOrMore";
} | {
  readonly type: "RepeatZeroOrMoreLazy";
} | {
  readonly type: "RepeatZeroOrMorePossessive";
} | {
  readonly type: "RepeatOneOrMore";
} | {
  readonly type: "RepeatOneOrMoreLazy";
} | {
  readonly type: "RepeatOneOrMorePossessive";
} | {
  readonly type: "RepeatZeroOrOne";
} | {
  readonly type: "RepeatZeroOrOneLazy";
} | {
  readonly type: "RepeatZeroOrOnePossessive";
} | {
  readonly type: "Assertion";
} | {
  readonly type: "AssertionPred";
} | {
  readonly type: "AssertionObj";
} | {
  readonly type: "Digest";
} | {
  readonly type: "Node";
} | {
  readonly type: "Obj";
} | {
  readonly type: "Obscured";
} | {
  readonly type: "Elided";
} | {
  readonly type: "Encrypted";
} | {
  readonly type: "Compressed";
} | {
  readonly type: "Pred";
} | {
  readonly type: "Subject";
} | {
  readonly type: "Wrapped";
} | {
  readonly type: "Unwrap";
} | {
  readonly type: "Search";
} | {
  readonly type: "ByteString";
} | {
  readonly type: "Leaf";
} | {
  readonly type: "Cbor";
} | {
  readonly type: "DateKeyword";
} | {
  readonly type: "Known";
} | {
  readonly type: "Null";
} | {
  readonly type: "NumberKeyword";
} | {
  readonly type: "Tagged";
} | {
  readonly type: "BoolKeyword";
} | {
  readonly type: "BoolTrue";
} | {
  readonly type: "BoolFalse";
} | {
  readonly type: "TextKeyword";
} | {
  readonly type: "NaN";
} | {
  readonly type: "StringLiteral";
  readonly value: Result<string>;
} | {
  readonly type: "ParenOpen";
} | {
  readonly type: "ParenClose";
} | {
  readonly type: "BracketOpen";
} | {
  readonly type: "BracketClose";
} | {
  readonly type: "Comma";
} | {
  readonly type: "Ellipsis";
} | {
  readonly type: "GreaterThanOrEqual";
} | {
  readonly type: "LessThanOrEqual";
} | {
  readonly type: "GreaterThan";
} | {
  readonly type: "LessThan";
} | {
  readonly type: "Integer";
  readonly value: Result<number>;
} | {
  readonly type: "UnsignedInteger";
  readonly value: Result<number>;
} | {
  readonly type: "Float";
  readonly value: Result<number>;
} | {
  readonly type: "Infinity";
} | {
  readonly type: "NegativeInfinity";
} | {
  readonly type: "GroupName";
  readonly name: string;
} | {
  readonly type: "Regex";
  readonly value: Result<string>;
} | {
  readonly type: "HexPattern";
  readonly value: Result<Uint8Array>;
} | {
  readonly type: "HexBinaryRegex";
  readonly value: Result<string>;
} | {
  readonly type: "DatePattern";
  readonly value: Result<string>;
} | {
  readonly type: "Range";
  readonly value: Result<Quantifier$1>;
} | {
  readonly type: "SingleQuotedPattern";
  readonly value: Result<string>;
} | {
  readonly type: "SingleQuotedRegex";
  readonly value: Result<string>;
} | {
  readonly type: "Identifier";
  readonly value: string;
};
/**
 * Lexer for Gordian Envelope pattern syntax.
 */
declare class Lexer {
  private readonly _source;
  private _position;
  private _tokenStart;
  private _peekedToken;
  constructor(source: string);
  /**
   * Gets the current position in the source.
   */
  get position(): number;
  /**
   * Peeks at the next token without consuming it.
   */
  peekToken(): {
    token: Token;
    span: Span;
  } | undefined;
  /**
   * Gets the current span (from token start to current position).
   */
  span(): Span;
  /**
   * Gets the remaining source string.
   */
  remainder(): string;
  /**
   * Peeks at the current character without consuming it.
   */
  peek(): string | undefined;
  /**
   * Peeks at the next character without consuming current.
   */
  peekNext(): string | undefined;
  /**
   * Advances the position by n characters.
   */
  bump(n?: number): void;
  /**
   * Skips whitespace.
   */
  private _skipWhitespace;
  /**
   * Parses a string literal (after the opening quote).
   */
  private _parseStringLiteral;
  /**
   * Parses a regex pattern (after the opening slash).
   */
  private _parseRegex;
  /**
   * Parses a hex pattern (after h').
   */
  private _parseHexPattern;
  /**
   * Parses a hex binary regex (after h'/).
   */
  private _parseHexBinaryRegex;
  /**
   * Parses a date pattern (after date').
   */
  private _parseDatePattern;
  /**
   * Parses a range pattern (after {).
   */
  private _parseRange;
  /**
   * Parses a single quoted pattern (after ').
   */
  private _parseSingleQuotedPattern;
  /**
   * Parses a single quoted regex (after '/).
   */
  private _parseSingleQuotedRegex;
  /**
   * Parses a number (integer or float).
   */
  private _parseNumber;
  /**
   * Gets the next token from the input.
   */
  next(): {
    token: Token;
    span: Span;
  } | undefined;
  /**
   * Iterates over all tokens.
   */
  [Symbol.iterator](): Iterator<{
    token: Token;
    span: Span;
  } | {
    error: EnvelopePatternError;
    span: Span;
  }>;
}
//#endregion
//#region src/error.d.ts
/**
 * Span represents a range in the source input.
 */
interface Span {
  readonly start: number;
  readonly end: number;
}
/**
 * Error types that can occur during parsing of Envelope patterns.
 *
 * Corresponds to the Rust `Error` enum in error.rs
 */
type EnvelopePatternError = {
  readonly type: "EmptyInput";
} | {
  readonly type: "UnexpectedEndOfInput";
} | {
  readonly type: "ExtraData";
  readonly span: Span;
} | {
  readonly type: "UnexpectedToken";
  readonly token: Token;
  readonly span: Span;
} | {
  readonly type: "UnrecognizedToken";
  readonly span: Span;
} | {
  readonly type: "InvalidRegex";
  readonly span: Span;
} | {
  readonly type: "UnterminatedRegex";
  readonly span: Span;
} | {
  readonly type: "InvalidRange";
  readonly span: Span;
} | {
  readonly type: "InvalidHexString";
  readonly span: Span;
} | {
  readonly type: "InvalidDateFormat";
  readonly span: Span;
} | {
  readonly type: "InvalidNumberFormat";
  readonly span: Span;
} | {
  readonly type: "InvalidUr";
  readonly message: string;
  readonly span: Span;
} | {
  readonly type: "ExpectedOpenParen";
  readonly span: Span;
} | {
  readonly type: "ExpectedCloseParen";
  readonly span: Span;
} | {
  readonly type: "ExpectedOpenBracket";
  readonly span: Span;
} | {
  readonly type: "ExpectedCloseBracket";
  readonly span: Span;
} | {
  readonly type: "ExpectedPattern";
  readonly span: Span;
} | {
  readonly type: "UnmatchedParentheses";
  readonly span: Span;
} | {
  readonly type: "UnmatchedBraces";
  readonly span: Span;
} | {
  readonly type: "InvalidCaptureGroupName";
  readonly name: string;
  readonly span: Span;
} | {
  readonly type: "InvalidPattern";
  readonly span: Span;
} | {
  readonly type: "Unknown";
} | {
  readonly type: "DCBORPatternError";
  readonly error: unknown;
};
/**
 * Result type specialized for envelope pattern parsing.
 */
type Result<T> = {
  readonly ok: true;
  readonly value: T;
} | {
  readonly ok: false;
  readonly error: EnvelopePatternError;
};
/**
 * Creates a successful result.
 */
declare function ok<T>(value: T): Result<T>;
/**
 * Creates a failed result.
 */
declare function err<T>(error: EnvelopePatternError): Result<T>;
/**
 * Type guard for successful results.
 */
declare function isOk<T>(result: Result<T>): result is {
  readonly ok: true;
  readonly value: T;
};
/**
 * Type guard for failed results.
 */
declare function isErr<T>(result: Result<T>): result is {
  readonly ok: false;
  readonly error: EnvelopePatternError;
};
/**
 * Unwraps a successful result or throws the error.
 */
declare function unwrap<T>(result: Result<T>): T;
/**
 * Unwraps a successful result or returns a default value.
 */
declare function unwrapOr<T>(result: Result<T>, defaultValue: T): T;
/**
 * Maps a successful result value.
 */
declare function map<T, U>(result: Result<T>, fn: (value: T) => U): Result<U>;
/**
 * Formats an error for display.
 */
declare function formatError(error: EnvelopePatternError): string;
declare function emptyInput(): EnvelopePatternError;
declare function unexpectedEndOfInput(): EnvelopePatternError;
declare function extraData(span: Span): EnvelopePatternError;
declare function unexpectedToken(token: Token, span: Span): EnvelopePatternError;
declare function unrecognizedToken(span: Span): EnvelopePatternError;
declare function invalidRegex(span: Span): EnvelopePatternError;
declare function unterminatedRegex(span: Span): EnvelopePatternError;
declare function invalidRange(span: Span): EnvelopePatternError;
declare function invalidHexString(span: Span): EnvelopePatternError;
declare function invalidDateFormat(span: Span): EnvelopePatternError;
declare function invalidNumberFormat(span: Span): EnvelopePatternError;
declare function invalidUr(message: string, span: Span): EnvelopePatternError;
declare function expectedOpenParen(span: Span): EnvelopePatternError;
declare function expectedCloseParen(span: Span): EnvelopePatternError;
declare function expectedOpenBracket(span: Span): EnvelopePatternError;
declare function expectedCloseBracket(span: Span): EnvelopePatternError;
declare function expectedPattern(span: Span): EnvelopePatternError;
declare function unmatchedParentheses(span: Span): EnvelopePatternError;
declare function unmatchedBraces(span: Span): EnvelopePatternError;
declare function invalidCaptureGroupName(name: string, span: Span): EnvelopePatternError;
declare function invalidPattern(span: Span): EnvelopePatternError;
declare function unknown(): EnvelopePatternError;
declare function dcborPatternError(error: unknown): EnvelopePatternError;
//#endregion
//#region src/format.d.ts
/**
 * A path is a sequence of envelopes from root to a matched element.
 */
type Path = Envelope[];
/**
 * Format options for each path element.
 *
 * Corresponds to the Rust `PathElementFormat` enum in format.rs
 */
type PathElementFormat = {
  readonly type: "Summary";
  readonly maxLength?: number;
} | {
  readonly type: "EnvelopeUR";
} | {
  readonly type: "DigestUR";
};
/**
 * Creates a Summary format.
 */
declare function summaryFormat(maxLength?: number): PathElementFormat;
/**
 * Creates an EnvelopeUR format.
 */
declare function envelopeURFormat(): PathElementFormat;
/**
 * Creates a DigestUR format.
 */
declare function digestURFormat(): PathElementFormat;
/**
 * Default path element format.
 */
declare function defaultPathElementFormat(): PathElementFormat;
/**
 * Options for formatting paths.
 *
 * Corresponds to the Rust `FormatPathsOpts` struct in format.rs
 */
interface FormatPathsOpts {
  /**
   * Whether to indent each path element.
   * If true, each element will be indented by 4 spaces per level.
   * Default: true
   */
  readonly indent: boolean;
  /**
   * Format for each path element.
   * Default: Summary(None)
   */
  readonly elementFormat: PathElementFormat;
  /**
   * If true, only the last element of each path will be formatted.
   * This is useful for displaying only the final destination of a path.
   * If false, all elements will be formatted.
   * Default: false
   */
  readonly lastElementOnly: boolean;
}
/**
 * Creates default formatting options.
 */
declare function defaultFormatPathsOpts(): FormatPathsOpts;
/**
 * Builder for FormatPathsOpts.
 */
declare class FormatPathsOptsBuilder {
  private _indent;
  private _elementFormat;
  private _lastElementOnly;
  /**
   * Sets whether to indent each path element.
   */
  indent(indent: boolean): this;
  /**
   * Sets the format for each path element.
   */
  elementFormat(format: PathElementFormat): this;
  /**
   * Sets whether to format only the last element of each path.
   */
  lastElementOnly(lastElementOnly: boolean): this;
  /**
   * Builds the FormatPathsOpts.
   */
  build(): FormatPathsOpts;
}
/**
 * Creates a new FormatPathsOptsBuilder.
 */
declare function formatPathsOpts(): FormatPathsOptsBuilder;
/**
 * Gets a summary of an envelope for display.
 *
 * Mirrors Rust `envelope_summary` in `format.rs`: defers to
 * `Envelope::format_flat()` for nodes / wrapped / assertions and to
 * `cbor.envelope_summary(usize::MAX, ...)` for raw CBOR leaves. The
 * obscured cases (`elided` / `encrypted` / `compressed`) emit just the
 * keyword. KnownValue envelopes look up the canonical name via
 * `KnownValue.name()`, matching the Rust call to
 * `KnownValuesStore::known_value_for_raw_value(value, …)`.
 *
 * @param env - The envelope to summarize
 * @returns A string summary of the envelope
 */
declare function envelopeSummary(env: Envelope): string;
/**
 * Format a single path element on its own line with custom options.
 *
 * @param path - The path to format
 * @param opts - Formatting options
 * @returns The formatted path string
 */
declare function formatPathOpt(path: Path, opts?: FormatPathsOpts): string;
/**
 * Format a single path with default options.
 *
 * @param path - The path to format
 * @returns The formatted path string
 */
declare function formatPath(path: Path): string;
/**
 * Format multiple paths with captures and custom options.
 *
 * Captures come first, sorted lexicographically by name, with their name
 * prefixed by '@'. Regular paths follow after all captures.
 *
 * @param paths - The paths to format
 * @param captures - Map of capture name to captured paths
 * @param opts - Formatting options
 * @returns The formatted string
 */
declare function formatPathsWithCapturesOpt(paths: Path[], captures: Map<string, Path[]>, opts?: FormatPathsOpts): string;
/**
 * Format multiple paths with captures using default options.
 *
 * @param paths - The paths to format
 * @param captures - Map of capture name to captured paths
 * @returns The formatted string
 */
declare function formatPathsWithCaptures(paths: Path[], captures: Map<string, Path[]>): string;
/**
 * Format multiple paths with custom options.
 *
 * @param paths - The paths to format
 * @param opts - Formatting options
 * @returns The formatted string
 */
declare function formatPathsOpt(paths: Path[], opts?: FormatPathsOpts): string;
/**
 * Format multiple paths with default options.
 *
 * @param paths - The paths to format
 * @returns The formatted string
 */
declare function formatPaths(paths: Path[]): string;
//#endregion
//#region src/pattern/vm.d.ts
/**
 * Register the pattern matching functions to resolve circular dependencies.
 */
declare function registerVMPatternFunctions(pathsWithCaptures: (pattern: Pattern, env: Envelope) => [Path[], Map<string, Path[]>], matches: (pattern: Pattern, env: Envelope) => boolean, paths: (pattern: Pattern, env: Envelope) => Path[]): void;
/**
 * Axis for envelope traversal.
 *
 * Corresponds to the Rust `Axis` enum in vm.rs
 */
type Axis = "Subject" | "Assertion" | "Predicate" | "Object" | "Wrapped";
/**
 * Edge type for envelope traversal.
 */
type EdgeType = "Subject" | "Assertion" | "Predicate" | "Object" | "Content";
/**
 * Returns (child, EdgeType) pairs reachable from env via this axis.
 */
declare function axisChildren(axis: Axis, env: Envelope): [Envelope, EdgeType][];
/**
 * VM instructions for pattern matching.
 *
 * Corresponds to the Rust `Instr` enum in vm.rs
 */
type Instr = {
  readonly type: "MatchPredicate";
  readonly literalIndex: number;
} | {
  readonly type: "MatchStructure";
  readonly literalIndex: number;
} | {
  readonly type: "Split";
  readonly a: number;
  readonly b: number;
} | {
  readonly type: "Jump";
  readonly address: number;
} | {
  readonly type: "PushAxis";
  readonly axis: Axis;
} | {
  readonly type: "Pop";
} | {
  readonly type: "Save";
} | {
  readonly type: "Accept";
} | {
  readonly type: "Search";
  readonly patternIndex: number;
  readonly captureMap: [string, number][];
} | {
  readonly type: "ExtendTraversal";
} | {
  readonly type: "CombineTraversal";
} | {
  readonly type: "NavigateSubject";
} | {
  readonly type: "NotMatch";
  readonly patternIndex: number;
} | {
  readonly type: "Repeat";
  readonly patternIndex: number;
  readonly quantifier: Quantifier$1;
} | {
  readonly type: "CaptureStart";
  readonly captureIndex: number;
} | {
  readonly type: "CaptureEnd";
  readonly captureIndex: number;
};
/**
 * Compiled program for the VM.
 */
interface Program {
  readonly code: Instr[];
  readonly literals: Pattern[];
  readonly captureNames: string[];
}
/**
 * Execute prog starting at root.
 * Every time SAVE or ACCEPT executes, the current path is pushed into the result.
 */
declare function run(prog: Program, root: Envelope): [Path, Map<string, Path[]>][];
/**
 * Compile a pattern to bytecode program.
 */
declare function compile(pattern: Pattern): Program;
//#endregion
//#region src/pattern/matcher.d.ts
/**
 * Matcher interface for pattern matching against envelopes.
 *
 * Corresponds to the Rust `Matcher` trait in matcher.rs
 */
interface Matcher {
  /**
   * Return all matching paths along with any named captures.
   */
  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>];
  /**
   * Return only the matching paths, discarding any captures.
   */
  paths(haystack: Envelope): Path[];
  /**
   * Returns true if the pattern matches the haystack.
   */
  matches(haystack: Envelope): boolean;
  /**
   * Compile this pattern to bytecode.
   */
  compile(code: Instr[], literals: Pattern[], captures: string[]): void;
  /**
   * Returns true if the Display of the matcher is complex,
   * i.e. contains nested patterns or other complex structures
   * that require its text rendering to be surrounded by grouping
   * parentheses.
   */
  isComplex(): boolean;
}
/**
 * Default implementations for Matcher methods.
 */
declare const MatcherDefaults: {
  /**
   * Default implementation of paths() - calls pathsWithCaptures and discards captures.
   */
  paths(matcher: Matcher, haystack: Envelope): Path[];
  /**
   * Default implementation of matches() - checks if paths() returns any results.
   */
  matches(matcher: Matcher, haystack: Envelope): boolean;
  /**
   * Default implementation of isComplex() - returns false.
   */
  isComplex(): boolean;
};
/**
 * Helper to compile a pattern as an atomic predicate match.
 * Pushes the pattern into literals and emits a single MatchPredicate instruction.
 */
declare function compileAsAtomic(pat: Pattern, code: Instr[], literals: Pattern[], _captures: string[]): void;
/**
 * Registers the pattern match function.
 * Called from index.ts after all patterns are defined.
 */
declare function registerPatternMatchFn(fn: (pattern: Pattern, haystack: Envelope) => boolean): void;
/**
 * Registers all pattern dispatch functions.
 * Called from index.ts after all patterns are defined.
 */
declare function registerPatternDispatchFns(fns: {
  pathsWithCaptures: (pattern: Pattern, haystack: Envelope) => [Path[], Map<string, Path[]>];
  paths: (pattern: Pattern, haystack: Envelope) => Path[];
  compile: (pattern: Pattern, code: Instr[], literals: Pattern[], captures: string[]) => void;
  isComplex: (pattern: Pattern) => boolean;
  toString: (pattern: Pattern) => string;
}): void;
/**
 * Match a pattern against an envelope using the registered match function.
 * Used by meta patterns to match child patterns.
 */
declare function matchPattern(pattern: Pattern, haystack: Envelope): boolean;
/**
 * Dispatch pathsWithCaptures on a Pattern.
 */
declare function dispatchPathsWithCaptures(pattern: Pattern, haystack: Envelope): [Path[], Map<string, Path[]>];
/**
 * Dispatch paths on a Pattern.
 */
declare function dispatchPaths(pattern: Pattern, haystack: Envelope): Path[];
/**
 * Dispatch compile on a Pattern.
 */
declare function dispatchCompile(pattern: Pattern, code: Instr[], literals: Pattern[], captures: string[]): void;
/**
 * Dispatch isComplex on a Pattern.
 */
declare function dispatchIsComplex(pattern: Pattern): boolean;
/**
 * Dispatch toString on a Pattern.
 */
declare function dispatchPatternToString(pattern: Pattern): string;
//#endregion
//#region src/pattern/leaf/bool-pattern.d.ts
declare function registerBoolPatternFactory(factory: (pattern: BoolPattern) => Pattern): void;
/**
 * Pattern for matching boolean values.
 *
 * This is a wrapper around dcbor_pattern::BoolPattern that provides
 * envelope-specific integration.
 *
 * Corresponds to the Rust `BoolPattern` struct in bool_pattern.rs
 */
declare class BoolPattern implements Matcher {
  private readonly _inner;
  private constructor();
  /**
   * Creates a new BoolPattern that matches any boolean value.
   */
  static any(): BoolPattern;
  /**
   * Creates a new BoolPattern that matches the specific boolean value.
   */
  static value(value: boolean): BoolPattern;
  /**
   * Creates a new BoolPattern from a dcbor-pattern BoolPattern.
   */
  static fromDcborPattern(dcborPattern: BoolPattern$1): BoolPattern;
  /**
   * Gets the underlying dcbor-pattern BoolPattern.
   */
  get inner(): BoolPattern$1;
  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>];
  paths(haystack: Envelope): Path[];
  matches(haystack: Envelope): boolean;
  compile(code: Instr[], literals: Pattern[], captures: string[]): void;
  isComplex(): boolean;
  toString(): string;
  /**
   * Equality comparison.
   */
  equals(other: BoolPattern): boolean;
  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number;
}
//#endregion
//#region src/pattern/leaf/null-pattern.d.ts
declare function registerNullPatternFactory(factory: (pattern: NullPattern) => Pattern): void;
/**
 * Pattern for matching null values.
 *
 * This is a wrapper around dcbor_pattern::NullPattern that provides
 * envelope-specific functionality.
 *
 * Corresponds to the Rust `NullPattern` struct in null_pattern.rs
 */
declare class NullPattern implements Matcher {
  private readonly _inner;
  private static readonly _instance;
  private constructor();
  /**
   * Creates a new NullPattern (returns singleton).
   */
  static new(): NullPattern;
  /**
   * Gets the underlying dcbor-pattern NullPattern.
   */
  get inner(): NullPattern$1;
  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>];
  paths(haystack: Envelope): Path[];
  matches(haystack: Envelope): boolean;
  compile(code: Instr[], literals: Pattern[], captures: string[]): void;
  isComplex(): boolean;
  toString(): string;
  /**
   * Equality comparison.
   */
  equals(other: NullPattern): boolean;
  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number;
}
//#endregion
//#region src/pattern/leaf/number-pattern.d.ts
declare function registerNumberPatternFactory(factory: (pattern: NumberPattern) => Pattern): void;
/**
 * Pattern for matching number values.
 *
 * This is a wrapper around dcbor_pattern::NumberPattern that provides
 * envelope-specific integration.
 *
 * Corresponds to the Rust `NumberPattern` struct in number_pattern.rs
 */
declare class NumberPattern implements Matcher {
  private readonly _inner;
  private constructor();
  /**
   * Creates a new NumberPattern that matches any number.
   */
  static any(): NumberPattern;
  /**
   * Creates a new NumberPattern that matches the exact number.
   */
  static exact(value: number): NumberPattern;
  /**
   * Creates a new NumberPattern that matches numbers within the specified range.
   */
  static range(min: number, max: number): NumberPattern;
  /**
   * Creates a new NumberPattern that matches numbers greater than the specified value.
   */
  static greaterThan(value: number): NumberPattern;
  /**
   * Creates a new NumberPattern that matches numbers greater than or equal to the specified value.
   */
  static greaterThanOrEqual(value: number): NumberPattern;
  /**
   * Creates a new NumberPattern that matches numbers less than the specified value.
   */
  static lessThan(value: number): NumberPattern;
  /**
   * Creates a new NumberPattern that matches numbers less than or equal to the specified value.
   */
  static lessThanOrEqual(value: number): NumberPattern;
  /**
   * Creates a new NumberPattern that matches NaN values.
   */
  static nan(): NumberPattern;
  /**
   * Creates a new NumberPattern that matches positive infinity.
   */
  static infinity(): NumberPattern;
  /**
   * Creates a new NumberPattern that matches negative infinity.
   */
  static negInfinity(): NumberPattern;
  /**
   * Creates a new NumberPattern from a dcbor-pattern NumberPattern.
   */
  static fromDcborPattern(dcborPattern: NumberPattern$1): NumberPattern;
  /**
   * Gets the underlying dcbor-pattern NumberPattern.
   */
  get inner(): NumberPattern$1;
  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>];
  paths(haystack: Envelope): Path[];
  matches(haystack: Envelope): boolean;
  compile(code: Instr[], literals: Pattern[], captures: string[]): void;
  isComplex(): boolean;
  toString(): string;
  /**
   * Equality comparison.
   */
  equals(other: NumberPattern): boolean;
  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number;
}
//#endregion
//#region src/pattern/leaf/text-pattern.d.ts
declare function registerTextPatternFactory(factory: (pattern: TextPattern) => Pattern): void;
/**
 * Pattern for matching text values.
 *
 * This is a wrapper around dcbor_pattern::TextPattern that provides
 * envelope-specific integration.
 *
 * Corresponds to the Rust `TextPattern` struct in text_pattern.rs
 */
declare class TextPattern implements Matcher {
  private readonly _inner;
  private constructor();
  /**
   * Creates a new TextPattern that matches any text.
   */
  static any(): TextPattern;
  /**
   * Creates a new TextPattern that matches the specific text.
   */
  static value(value: string): TextPattern;
  /**
   * Creates a new TextPattern that matches text matching the regex.
   */
  static regex(pattern: RegExp): TextPattern;
  /**
   * Creates a new TextPattern from a dcbor-pattern TextPattern.
   */
  static fromDcborPattern(dcborPattern: TextPattern$1): TextPattern;
  /**
   * Gets the underlying dcbor-pattern TextPattern.
   */
  get inner(): TextPattern$1;
  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>];
  paths(haystack: Envelope): Path[];
  matches(haystack: Envelope): boolean;
  compile(code: Instr[], literals: Pattern[], captures: string[]): void;
  isComplex(): boolean;
  toString(): string;
  /**
   * Equality comparison.
   */
  equals(other: TextPattern): boolean;
  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number;
}
//#endregion
//#region src/pattern/leaf/byte-string-pattern.d.ts
declare function registerByteStringPatternFactory(factory: (pattern: ByteStringPattern) => Pattern): void;
/**
 * Pattern for matching byte string values.
 *
 * This is a wrapper around dcbor_pattern::ByteStringPattern that provides
 * envelope-specific integration.
 *
 * Corresponds to the Rust `ByteStringPattern` struct in byte_string_pattern.rs
 */
declare class ByteStringPattern implements Matcher {
  private readonly _inner;
  private constructor();
  /**
   * Creates a new ByteStringPattern that matches any byte string.
   */
  static any(): ByteStringPattern;
  /**
   * Creates a new ByteStringPattern that matches the specific byte string.
   */
  static value(value: Uint8Array): ByteStringPattern;
  /**
   * Creates a new ByteStringPattern that matches byte strings matching the binary regex.
   */
  static regex(pattern: RegExp): ByteStringPattern;
  /**
   * Creates a new ByteStringPattern from a dcbor-pattern ByteStringPattern.
   */
  static fromDcborPattern(dcborPattern: ByteStringPattern$1): ByteStringPattern;
  /**
   * Gets the underlying dcbor-pattern ByteStringPattern.
   */
  get inner(): ByteStringPattern$1;
  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>];
  paths(haystack: Envelope): Path[];
  matches(haystack: Envelope): boolean;
  compile(code: Instr[], literals: Pattern[], captures: string[]): void;
  isComplex(): boolean;
  toString(): string;
  /**
   * Equality comparison.
   */
  equals(other: ByteStringPattern): boolean;
  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number;
}
//#endregion
//#region src/pattern/leaf/date-pattern.d.ts
declare function registerDatePatternFactory(factory: (pattern: DatePattern) => Pattern): void;
/**
 * Pattern for matching date values.
 *
 * This is a wrapper around dcbor_pattern::DatePattern that provides
 * envelope-specific integration.
 *
 * Corresponds to the Rust `DatePattern` struct in date_pattern.rs
 */
declare class DatePattern implements Matcher {
  private readonly _inner;
  private constructor();
  /**
   * Creates a new DatePattern that matches any date.
   */
  static any(): DatePattern;
  /**
   * Creates a new DatePattern that matches the specific date.
   */
  static value(date: CborDate): DatePattern;
  /**
   * Creates a new DatePattern that matches dates within a range (inclusive).
   */
  static range(start: CborDate, end: CborDate): DatePattern;
  /**
   * Creates a new DatePattern that matches dates on or after the specified date.
   */
  static earliest(date: CborDate): DatePattern;
  /**
   * Creates a new DatePattern that matches dates on or before the specified date.
   */
  static latest(date: CborDate): DatePattern;
  /**
   * Creates a new DatePattern that matches dates by their ISO-8601 string representation.
   */
  static string(isoString: string): DatePattern;
  /**
   * Creates a new DatePattern that matches dates whose ISO-8601 string representation
   * matches the given regular expression.
   */
  static regex(pattern: RegExp): DatePattern;
  /**
   * Creates a new DatePattern from a dcbor-pattern DatePattern.
   */
  static fromDcborPattern(dcborPattern: DatePattern$1): DatePattern;
  /**
   * Gets the underlying dcbor-pattern DatePattern.
   */
  get inner(): DatePattern$1;
  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>];
  paths(haystack: Envelope): Path[];
  matches(haystack: Envelope): boolean;
  compile(code: Instr[], literals: Pattern[], captures: string[]): void;
  isComplex(): boolean;
  toString(): string;
  /**
   * Equality comparison.
   */
  equals(other: DatePattern): boolean;
  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number;
}
//#endregion
//#region src/pattern/leaf/array-pattern.d.ts
declare function registerArrayPatternFactory(factory: (pattern: ArrayPattern) => Pattern): void;
/**
 * Pattern for matching arrays.
 *
 * Mirrors Rust `ArrayPattern(dcbor_pattern::ArrayPattern)` from
 * `bc-envelope-pattern-rust/src/pattern/leaf/array_pattern.rs`. All
 * matching, display, and equality is delegated to dcbor-pattern.
 */
declare class ArrayPattern implements Matcher {
  private readonly _pattern;
  private constructor();
  /**
   * Creates a new ArrayPattern that matches any array.
   */
  static any(): ArrayPattern;
  /**
   * Creates a new ArrayPattern that matches arrays with a specific length.
   */
  static count(count: number): ArrayPattern;
  /**
   * Creates a new ArrayPattern that matches arrays within a length range.
   */
  static interval(min: number, max?: number): ArrayPattern;
  /**
   * Creates a new ArrayPattern from a length Interval.
   */
  static fromInterval(interval: Interval$1): ArrayPattern;
  /**
   * Creates a new ArrayPattern from a top-level dcbor-pattern.
   *
   * Mirrors Rust `ArrayPattern::from_dcbor_pattern`, which constructs an
   * `ArrayPattern::Elements`-style dcbor array pattern.
   */
  static fromDcborPattern(pattern: Pattern$1): ArrayPattern;
  /**
   * Creates a new ArrayPattern from an existing dcbor-pattern ArrayPattern.
   *
   * Mirrors Rust `ArrayPattern::from_dcbor_array_pattern`.
   */
  static fromDcborArrayPattern(arrayPattern: ArrayPattern$1): ArrayPattern;
  /**
   * Returns the underlying dcbor-pattern ArrayPattern.
   */
  inner(): ArrayPattern$1;
  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>];
  paths(haystack: Envelope): Path[];
  matches(haystack: Envelope): boolean;
  compile(code: Instr[], literals: Pattern[], captures: string[]): void;
  isComplex(): boolean;
  toString(): string;
  /**
   * Equality comparison. Delegates to dcbor-pattern's structural equality
   * with a display-string fallback for pattern-equality (mirrors Rust's
   * `Hash` impl that hashes the display, since dcbor `ArrayPattern`
   * itself does not derive `Hash`).
   */
  equals(other: ArrayPattern): boolean;
  /**
   * Hash code for use in Maps/Sets. Mirrors Rust's
   * "hash the string representation" approach.
   */
  hashCode(): number;
}
//#endregion
//#region src/pattern/leaf/map-pattern.d.ts
declare function registerMapPatternFactory(factory: (pattern: MapPattern) => Pattern): void;
/**
 * Pattern for matching map values.
 *
 * Corresponds to the Rust `MapPattern` enum in map_pattern.rs
 */
type MapPatternType = {
  readonly type: "Any";
} | {
  readonly type: "Interval";
  readonly interval: Interval$1;
};
/**
 * Pattern for matching map values in envelope leaf nodes.
 *
 * Corresponds to the Rust `MapPattern` struct in map_pattern.rs
 */
declare class MapPattern implements Matcher {
  private readonly _pattern;
  private constructor();
  /**
   * Creates a new MapPattern that matches any map.
   */
  static any(): MapPattern;
  /**
   * Creates a new MapPattern that matches maps within a size range.
   */
  static interval(min: number, max?: number): MapPattern;
  /**
   * Creates a new MapPattern from a length Interval.
   *
   * Mirrors Rust `MapPattern::from_interval`. Used by the
   * dcbor-pattern → envelope-pattern bridge to preserve `{{n,m}}`
   * length info.
   */
  static fromInterval(interval: Interval$1): MapPattern;
  /**
   * Gets the pattern type.
   */
  get pattern(): MapPatternType;
  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>];
  paths(haystack: Envelope): Path[];
  matches(haystack: Envelope): boolean;
  compile(code: Instr[], literals: Pattern[], captures: string[]): void;
  isComplex(): boolean;
  toString(): string;
  /**
   * Equality comparison.
   */
  equals(other: MapPattern): boolean;
  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number;
}
//#endregion
//#region src/pattern/leaf/known-value-pattern.d.ts
declare function registerKnownValuePatternFactory(factory: (pattern: KnownValuePattern) => Pattern): void;
/**
 * Pattern for matching known values.
 *
 * This is a wrapper around dcbor_pattern::KnownValuePattern that provides
 * envelope-specific integration.
 *
 * Corresponds to the Rust `KnownValuePattern` struct in known_value_pattern.rs
 */
declare class KnownValuePattern implements Matcher {
  private readonly _inner;
  private constructor();
  /**
   * Creates a new KnownValuePattern that matches any known value.
   */
  static any(): KnownValuePattern;
  /**
   * Creates a new KnownValuePattern that matches the specific known value.
   */
  static value(value: KnownValue): KnownValuePattern;
  /**
   * Creates a new KnownValuePattern that matches known values by name.
   */
  static named(name: string): KnownValuePattern;
  /**
   * Creates a new KnownValuePattern that matches known values by regex on their name.
   */
  static regex(regex: RegExp): KnownValuePattern;
  /**
   * Creates a new KnownValuePattern from a dcbor-pattern KnownValuePattern.
   */
  static fromDcborPattern(dcborPattern: KnownValuePattern$1): KnownValuePattern;
  /**
   * Gets the underlying dcbor-pattern KnownValuePattern.
   */
  get inner(): KnownValuePattern$1;
  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>];
  paths(haystack: Envelope): Path[];
  matches(haystack: Envelope): boolean;
  compile(code: Instr[], literals: Pattern[], captures: string[]): void;
  isComplex(): boolean;
  toString(): string;
  /**
   * Equality comparison.
   */
  equals(other: KnownValuePattern): boolean;
  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number;
}
//#endregion
//#region src/pattern/leaf/tagged-pattern.d.ts
declare function registerTaggedPatternFactory(factory: (pattern: TaggedPattern) => Pattern): void;
/**
 * Pattern for matching tagged CBOR values.
 *
 * This is a wrapper around dcbor_pattern::TaggedPattern that provides
 * envelope-specific integration.
 *
 * Corresponds to the Rust `TaggedPattern` struct in tagged_pattern.rs
 */
declare class TaggedPattern implements Matcher {
  private readonly _inner;
  private constructor();
  /**
   * Creates a new TaggedPattern that matches any tagged value.
   */
  static any(): TaggedPattern;
  /**
   * Creates a new TaggedPattern with a specific tag and content pattern.
   */
  static withTag(tag: Tag, pattern: Pattern$1): TaggedPattern;
  /**
   * Creates a new TaggedPattern with a specific tag name and content pattern.
   */
  static withName(name: string, pattern: Pattern$1): TaggedPattern;
  /**
   * Creates a new TaggedPattern with a tag name matching regex and content pattern.
   */
  static withRegex(regex: RegExp, pattern: Pattern$1): TaggedPattern;
  /**
   * Creates a new TaggedPattern from a dcbor-pattern TaggedPattern.
   */
  static fromDcborPattern(dcborPattern: TaggedPattern$1): TaggedPattern;
  /**
   * Gets the underlying dcbor-pattern TaggedPattern.
   */
  get inner(): TaggedPattern$1;
  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>];
  paths(haystack: Envelope): Path[];
  matches(haystack: Envelope): boolean;
  compile(code: Instr[], literals: Pattern[], captures: string[]): void;
  isComplex(): boolean;
  toString(): string;
  /**
   * Equality comparison.
   */
  equals(other: TaggedPattern): boolean;
  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number;
}
//#endregion
//#region src/pattern/leaf/cbor-pattern.d.ts
declare function registerCBORPatternFactory(factory: (pattern: CBORPattern) => Pattern): void;
/**
 * Pattern type for CBOR pattern matching.
 *
 * Corresponds to the Rust `CBORPattern` enum in cbor_pattern.rs
 */
type CBORPatternType = {
  readonly type: "Any";
} | {
  readonly type: "Value";
  readonly cbor: Cbor;
} | {
  readonly type: "Pattern";
  readonly pattern: Pattern$1;
};
/**
 * Pattern for matching CBOR values with support for exact values and advanced pattern matching.
 *
 * Corresponds to the Rust `CBORPattern` enum in cbor_pattern.rs
 */
declare class CBORPattern implements Matcher {
  private readonly _pattern;
  private constructor();
  /**
   * Creates a new CBORPattern that matches any CBOR value.
   */
  static any(): CBORPattern;
  /**
   * Creates a new CBORPattern that matches a specific CBOR value.
   */
  static value(value: CborInput): CBORPattern;
  /**
   * Creates a new CBORPattern that matches CBOR values using dcbor-pattern expressions.
   */
  static pattern(dcborPattern: Pattern$1): CBORPattern;
  /**
   * Creates a new CBORPattern from a dcbor-pattern Pattern.
   */
  static fromDcborPattern(dcborPattern: Pattern$1): CBORPattern;
  /**
   * Gets the pattern type.
   */
  get pattern(): CBORPatternType;
  /**
   * Convert dcbor captures to envelope captures.
   */
  private _convertDcborCapturesToEnvelopeCaptures;
  /**
   * Convert a single dcbor path to an envelope path.
   *
   * Uses canonical CBOR-byte equality (`cborEquals`) for the "skip the
   * dcbor root if it duplicates our base envelope" check, mirroring
   * Rust's `dcbor_path.first().map(|first| first == &base_cbor)`. The
   * earlier port compared diagnostic strings, which collapses values
   * that share a textual representation but differ structurally
   * (e.g. NaN payloads).
   */
  private _convertDcborPathToEnvelopePath;
  /**
   * Collect capture names from a dcbor pattern.
   */
  private _collectDcborCaptureNames;
  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>];
  paths(haystack: Envelope): Path[];
  matches(haystack: Envelope): boolean;
  compile(code: Instr[], literals: Pattern[], captures: string[]): void;
  isComplex(): boolean;
  toString(): string;
  /**
   * Equality comparison. `Value` variants compare by canonical CBOR
   * byte sequence (mirrors Rust `==` on `CBOR`); `Pattern` variants fall
   * back to display-string compare since `DCBORPattern` doesn't expose
   * structural equality outside the crate.
   */
  equals(other: CBORPattern): boolean;
  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number;
}
//#endregion
//#region src/pattern/leaf/index.d.ts
/**
 * Union type for all leaf patterns.
 *
 * Corresponds to the Rust `LeafPattern` enum in pattern/leaf/mod.rs
 */
type LeafPattern = {
  readonly type: "Cbor";
  readonly pattern: CBORPattern;
} | {
  readonly type: "Number";
  readonly pattern: NumberPattern;
} | {
  readonly type: "Text";
  readonly pattern: TextPattern;
} | {
  readonly type: "ByteString";
  readonly pattern: ByteStringPattern;
} | {
  readonly type: "Tag";
  readonly pattern: TaggedPattern;
} | {
  readonly type: "Array";
  readonly pattern: ArrayPattern;
} | {
  readonly type: "Map";
  readonly pattern: MapPattern;
} | {
  readonly type: "Bool";
  readonly pattern: BoolPattern;
} | {
  readonly type: "Null";
  readonly pattern: NullPattern;
} | {
  readonly type: "Date";
  readonly pattern: DatePattern;
} | {
  readonly type: "KnownValue";
  readonly pattern: KnownValuePattern;
};
/**
 * Creates a CBOR leaf pattern.
 */
declare function leafCbor(pattern: CBORPattern): LeafPattern;
/**
 * Creates a Number leaf pattern.
 */
declare function leafNumber(pattern: NumberPattern): LeafPattern;
/**
 * Creates a Text leaf pattern.
 */
declare function leafText(pattern: TextPattern): LeafPattern;
/**
 * Creates a ByteString leaf pattern.
 */
declare function leafByteString(pattern: ByteStringPattern): LeafPattern;
/**
 * Creates a Tag leaf pattern.
 */
declare function leafTag(pattern: TaggedPattern): LeafPattern;
/**
 * Creates an Array leaf pattern.
 */
declare function leafArray(pattern: ArrayPattern): LeafPattern;
/**
 * Creates a Map leaf pattern.
 */
declare function leafMap(pattern: MapPattern): LeafPattern;
/**
 * Creates a Bool leaf pattern.
 */
declare function leafBool(pattern: BoolPattern): LeafPattern;
/**
 * Creates a Null leaf pattern.
 */
declare function leafNull(pattern: NullPattern): LeafPattern;
/**
 * Creates a Date leaf pattern.
 */
declare function leafDate(pattern: DatePattern): LeafPattern;
/**
 * Creates a KnownValue leaf pattern.
 */
declare function leafKnownValue(pattern: KnownValuePattern): LeafPattern;
/**
 * Gets paths with captures for a leaf pattern.
 */
declare function leafPatternPathsWithCaptures(pattern: LeafPattern, haystack: Envelope): [Path[], Map<string, Path[]>];
/**
 * Gets paths for a leaf pattern.
 */
declare function leafPatternPaths(pattern: LeafPattern, haystack: Envelope): Path[];
/**
 * Compiles a leaf pattern to bytecode.
 */
declare function leafPatternCompile(pattern: LeafPattern, code: Instr[], literals: Pattern[], captures: string[]): void;
/**
 * Checks if a leaf pattern is complex.
 */
declare function leafPatternIsComplex(pattern: LeafPattern): boolean;
/**
 * Converts a leaf pattern to string.
 */
declare function leafPatternToString(pattern: LeafPattern): string;
//#endregion
//#region src/pattern/structure/leaf-structure-pattern.d.ts
declare function registerLeafStructurePatternFactory(factory: (pattern: LeafStructurePattern) => Pattern): void;
/**
 * Pattern for matching leaf envelopes (terminal nodes in the envelope tree).
 *
 * Corresponds to the Rust `LeafStructurePattern` struct in leaf_structure_pattern.rs
 */
declare class LeafStructurePattern implements Matcher {
  private constructor();
  /**
   * Creates a new LeafStructurePattern.
   */
  static new(): LeafStructurePattern;
  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>];
  paths(haystack: Envelope): Path[];
  matches(haystack: Envelope): boolean;
  compile(code: Instr[], literals: Pattern[], captures: string[]): void;
  isComplex(): boolean;
  toString(): string;
  /**
   * Equality comparison.
   */
  equals(_other: LeafStructurePattern): boolean;
  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number;
}
//#endregion
//#region src/pattern/structure/subject-pattern.d.ts
declare function registerSubjectPatternFactory(factory: (pattern: SubjectPattern) => Pattern): void;
declare function registerSubjectPatternDispatch(dispatch: {
  compile: (pattern: Pattern, code: Instr[], literals: Pattern[], captures: string[]) => void;
  toString: (pattern: Pattern) => string;
}): void;
/**
 * Pattern type for subject pattern matching.
 *
 * Corresponds to the Rust `SubjectPattern` enum in subject_pattern.rs
 */
type SubjectPatternType = {
  readonly type: "Any";
} | {
  readonly type: "Pattern";
  readonly pattern: Pattern;
};
/**
 * Pattern for matching subjects in envelopes.
 *
 * Corresponds to the Rust `SubjectPattern` enum in subject_pattern.rs
 */
declare class SubjectPattern implements Matcher {
  private readonly _pattern;
  private constructor();
  /**
   * Creates a new SubjectPattern that matches any subject.
   */
  static any(): SubjectPattern;
  /**
   * Creates a new SubjectPattern that matches subjects matching the given pattern.
   */
  static pattern(pattern: Pattern): SubjectPattern;
  /**
   * Gets the pattern type.
   */
  get patternType(): SubjectPatternType;
  /**
   * Gets the inner pattern if this is a Pattern type, undefined otherwise.
   */
  innerPattern(): Pattern | undefined;
  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>];
  paths(haystack: Envelope): Path[];
  matches(haystack: Envelope): boolean;
  compile(code: Instr[], literals: Pattern[], captures: string[]): void;
  isComplex(): boolean;
  toString(): string;
  /**
   * Equality comparison.
   */
  equals(other: SubjectPattern): boolean;
  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number;
}
//#endregion
//#region src/pattern/structure/predicate-pattern.d.ts
declare function registerPredicatePatternFactory(factory: (pattern: PredicatePattern) => Pattern): void;
/**
 * Pattern type for predicate pattern matching.
 *
 * Corresponds to the Rust `PredicatePattern` enum in predicate_pattern.rs
 */
type PredicatePatternType = {
  readonly type: "Any";
} | {
  readonly type: "Pattern";
  readonly pattern: Pattern;
};
/**
 * Pattern for matching predicates in envelopes.
 *
 * Corresponds to the Rust `PredicatePattern` enum in predicate_pattern.rs
 */
declare class PredicatePattern implements Matcher {
  private readonly _pattern;
  private constructor();
  /**
   * Creates a new PredicatePattern that matches any predicate.
   */
  static any(): PredicatePattern;
  /**
   * Creates a new PredicatePattern that matches predicates matching the given pattern.
   */
  static pattern(pattern: Pattern): PredicatePattern;
  /**
   * Gets the pattern type.
   */
  get patternType(): PredicatePatternType;
  /**
   * Gets the inner pattern if this is a Pattern type, undefined otherwise.
   */
  innerPattern(): Pattern | undefined;
  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>];
  paths(haystack: Envelope): Path[];
  matches(haystack: Envelope): boolean;
  compile(code: Instr[], literals: Pattern[], _captures: string[]): void;
  isComplex(): boolean;
  toString(): string;
  /**
   * Equality comparison.
   */
  equals(other: PredicatePattern): boolean;
  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number;
}
//#endregion
//#region src/pattern/structure/object-pattern.d.ts
declare function registerObjectPatternFactory(factory: (pattern: ObjectPattern) => Pattern): void;
/**
 * Pattern type for object pattern matching.
 *
 * Corresponds to the Rust `ObjectPattern` enum in object_pattern.rs
 */
type ObjectPatternType = {
  readonly type: "Any";
} | {
  readonly type: "Pattern";
  readonly pattern: Pattern;
};
/**
 * Pattern for matching objects in envelopes.
 *
 * Corresponds to the Rust `ObjectPattern` enum in object_pattern.rs
 */
declare class ObjectPattern implements Matcher {
  private readonly _pattern;
  private constructor();
  /**
   * Creates a new ObjectPattern that matches any object.
   */
  static any(): ObjectPattern;
  /**
   * Creates a new ObjectPattern that matches objects matching the given pattern.
   */
  static pattern(pattern: Pattern): ObjectPattern;
  /**
   * Gets the pattern type.
   */
  get patternType(): ObjectPatternType;
  /**
   * Gets the inner pattern if this is a Pattern type, undefined otherwise.
   */
  innerPattern(): Pattern | undefined;
  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>];
  paths(haystack: Envelope): Path[];
  matches(haystack: Envelope): boolean;
  compile(code: Instr[], literals: Pattern[], _captures: string[]): void;
  isComplex(): boolean;
  toString(): string;
  /**
   * Equality comparison.
   */
  equals(other: ObjectPattern): boolean;
  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number;
}
//#endregion
//#region src/pattern/structure/assertions-pattern.d.ts
declare function registerAssertionsPatternFactory(factory: (pattern: AssertionsPattern) => Pattern): void;
declare function registerAssertionsPatternToStringDispatch(fn: (pattern: Pattern) => string): void;
/**
 * Pattern type for assertions pattern matching.
 *
 * Corresponds to the Rust `AssertionsPattern` enum in assertions_pattern.rs:
 * - `Any` matches any assertion.
 * - `WithPredicate` matches assertions whose predicate matches a sub-pattern.
 * - `WithObject` matches assertions whose object matches a sub-pattern.
 */
type AssertionsPatternType = {
  readonly type: "Any";
} | {
  readonly type: "WithPredicate";
  readonly pattern: Pattern;
} | {
  readonly type: "WithObject";
  readonly pattern: Pattern;
};
/**
 * Pattern for matching assertions in envelopes.
 *
 * Corresponds to the Rust `AssertionsPattern` enum in assertions_pattern.rs
 */
declare class AssertionsPattern implements Matcher {
  private readonly _pattern;
  private constructor();
  /**
   * Creates a new AssertionsPattern that matches any assertion.
   */
  static any(): AssertionsPattern;
  /**
   * Creates a new AssertionsPattern that matches assertions with predicates
   * that match a specific pattern.
   */
  static withPredicate(pattern: Pattern): AssertionsPattern;
  /**
   * Creates a new AssertionsPattern that matches assertions with objects
   * that match a specific pattern.
   */
  static withObject(pattern: Pattern): AssertionsPattern;
  /**
   * Gets the pattern type.
   */
  get patternType(): AssertionsPatternType;
  /**
   * Gets the predicate pattern if this has one, undefined otherwise.
   */
  predicatePattern(): Pattern | undefined;
  /**
   * Gets the object pattern if this has one, undefined otherwise.
   */
  objectPattern(): Pattern | undefined;
  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>];
  paths(haystack: Envelope): Path[];
  matches(haystack: Envelope): boolean;
  compile(code: Instr[], literals: Pattern[], _captures: string[]): void;
  isComplex(): boolean;
  toString(): string;
  /**
   * Equality comparison.
   */
  equals(other: AssertionsPattern): boolean;
  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number;
}
//#endregion
//#region src/pattern/structure/digest-pattern.d.ts
declare function registerDigestPatternFactory(factory: (pattern: DigestPattern) => Pattern): void;
/**
 * Pattern type for digest pattern matching.
 *
 * Corresponds to the Rust `DigestPattern` enum in digest_pattern.rs.
 * Rust has only `Digest`, `Prefix`, and `BinaryRegex` variants — there is
 * no `Any` here. To match "any digest", use the meta `any()` pattern.
 */
type DigestPatternType = {
  readonly type: "Digest";
  readonly digest: Digest;
} | {
  readonly type: "Prefix";
  readonly prefix: Uint8Array;
} | {
  readonly type: "BinaryRegex";
  readonly regex: RegExp;
};
/**
 * Pattern for matching envelopes by their digest.
 *
 * Corresponds to the Rust `DigestPattern` enum in digest_pattern.rs
 */
declare class DigestPattern implements Matcher {
  private readonly _pattern;
  private constructor();
  /**
   * Creates a new DigestPattern that matches the exact digest.
   */
  static digest(digest: Digest): DigestPattern;
  /**
   * Creates a new DigestPattern that matches the prefix of a digest.
   */
  static prefix(prefix: Uint8Array): DigestPattern;
  /**
   * Creates a new DigestPattern that matches the binary regex for a digest.
   */
  static binaryRegex(regex: RegExp): DigestPattern;
  /**
   * Gets the pattern type.
   */
  get patternType(): DigestPatternType;
  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>];
  paths(haystack: Envelope): Path[];
  matches(haystack: Envelope): boolean;
  compile(code: Instr[], literals: Pattern[], captures: string[]): void;
  isComplex(): boolean;
  toString(): string;
  /**
   * Equality comparison.
   *
   * `Prefix` comparison is case-insensitive on the *hex representation* to
   * mirror Rust's `eq_ignore_ascii_case` (which compares the underlying
   * `Vec<u8>` of hex bytes byte-for-byte modulo ASCII case). For raw byte
   * prefixes that happen to be ASCII, this is an ordinary byte compare.
   */
  equals(other: DigestPattern): boolean;
  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number;
}
//#endregion
//#region src/pattern/structure/node-pattern.d.ts
declare function registerNodePatternFactory(factory: (pattern: NodePattern) => Pattern): void;
/**
 * Pattern type for node pattern matching.
 *
 * Corresponds to the Rust `NodePattern` enum in node_pattern.rs:
 * - `Any` matches any node.
 * - `AssertionsInterval` matches a node whose number of assertions falls in
 *   the given interval (e.g., `node({2,5})`).
 */
type NodePatternType = {
  readonly type: "Any";
} | {
  readonly type: "AssertionsInterval";
  readonly interval: Interval$1;
};
/**
 * Pattern for matching node envelopes.
 *
 * Corresponds to the Rust `NodePattern` enum in node_pattern.rs
 */
declare class NodePattern implements Matcher {
  private readonly _pattern;
  private constructor();
  /**
   * Creates a new NodePattern that matches any node.
   */
  static any(): NodePattern;
  /**
   * Creates a new NodePattern that matches a node with the specified count of assertions.
   */
  static interval(min: number, max?: number): NodePattern;
  /**
   * Creates a new NodePattern from an Interval.
   */
  static fromInterval(interval: Interval$1): NodePattern;
  /**
   * Gets the pattern type.
   */
  get patternType(): NodePatternType;
  /**
   * Returns the subject pattern, if any. Rust's `NodePattern` does not carry
   * subject patterns, so this always returns `undefined`.
   */
  subjectPattern(): Pattern | undefined;
  /**
   * Returns the assertion patterns. Rust's `NodePattern` does not carry
   * assertion sub-patterns, so this always returns an empty array.
   */
  assertionPatterns(): Pattern[];
  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>];
  paths(haystack: Envelope): Path[];
  matches(haystack: Envelope): boolean;
  compile(code: Instr[], literals: Pattern[], captures: string[]): void;
  isComplex(): boolean;
  toString(): string;
  /**
   * Equality comparison.
   */
  equals(other: NodePattern): boolean;
  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number;
}
//#endregion
//#region src/pattern/structure/obscured-pattern.d.ts
declare function registerObscuredPatternFactory(factory: (pattern: ObscuredPattern) => Pattern): void;
/**
 * Pattern type for obscured pattern matching.
 *
 * Corresponds to the Rust `ObscuredPattern` enum in obscured_pattern.rs
 */
type ObscuredPatternType = {
  readonly type: "Any";
} | {
  readonly type: "Elided";
} | {
  readonly type: "Encrypted";
} | {
  readonly type: "Compressed";
};
/**
 * Pattern for matching obscured elements.
 *
 * Corresponds to the Rust `ObscuredPattern` enum in obscured_pattern.rs
 */
declare class ObscuredPattern implements Matcher {
  private readonly _pattern;
  private constructor();
  /**
   * Creates a new ObscuredPattern that matches any obscured element.
   */
  static any(): ObscuredPattern;
  /**
   * Creates a new ObscuredPattern that matches any elided element.
   */
  static elided(): ObscuredPattern;
  /**
   * Creates a new ObscuredPattern that matches any encrypted element.
   */
  static encrypted(): ObscuredPattern;
  /**
   * Creates a new ObscuredPattern that matches any compressed element.
   */
  static compressed(): ObscuredPattern;
  /**
   * Gets the pattern type.
   */
  get patternType(): ObscuredPatternType;
  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>];
  paths(haystack: Envelope): Path[];
  matches(haystack: Envelope): boolean;
  compile(code: Instr[], literals: Pattern[], captures: string[]): void;
  isComplex(): boolean;
  toString(): string;
  /**
   * Equality comparison.
   */
  equals(other: ObscuredPattern): boolean;
  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number;
}
//#endregion
//#region src/pattern/structure/wrapped-pattern.d.ts
declare function registerWrappedPatternFactory(factory: (pattern: WrappedPattern) => Pattern): void;
declare function registerWrappedPatternAny(factory: () => Pattern): void;
declare function registerWrappedPatternDispatch(dispatch: {
  pathsWithCaptures: (pattern: Pattern, haystack: Envelope) => [Path[], Map<string, Path[]>];
  compile: (pattern: Pattern, code: Instr[], literals: Pattern[], captures: string[]) => void;
  toString: (pattern: Pattern) => string;
}): void;
/**
 * Pattern type for wrapped pattern matching.
 *
 * Corresponds to the Rust `WrappedPattern` enum in wrapped_pattern.rs
 */
type WrappedPatternType = {
  readonly type: "Any";
} | {
  readonly type: "Unwrap";
  readonly pattern: Pattern;
};
/**
 * Represents patterns for matching wrapped envelopes.
 *
 * Corresponds to the Rust `WrappedPattern` enum in wrapped_pattern.rs
 */
declare class WrappedPattern implements Matcher {
  private readonly _pattern;
  private constructor();
  /**
   * Creates a new WrappedPattern that matches any wrapped envelope without descending.
   */
  static new(): WrappedPattern;
  /**
   * Creates a new WrappedPattern that matches a wrapped envelope and also matches
   * on its unwrapped content.
   */
  static unwrapMatching(pattern: Pattern): WrappedPattern;
  /**
   * Creates a new WrappedPattern that matches any wrapped envelope and descends into it.
   *
   * Mirrors Rust `WrappedPattern::unwrap()` which delegates to
   * `Self::unwrap_matching(Pattern::any())`. The `any` factory is wired in
   * during module-load registration to break the circular import on the
   * top-level `Pattern` type.
   */
  static unwrap(): WrappedPattern;
  /**
   * Gets the pattern type.
   */
  get patternType(): WrappedPatternType;
  /**
   * Gets the inner pattern if this is an Unwrap type, undefined otherwise.
   */
  innerPattern(): Pattern | undefined;
  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>];
  paths(haystack: Envelope): Path[];
  matches(haystack: Envelope): boolean;
  compile(code: Instr[], literals: Pattern[], captures: string[]): void;
  isComplex(): boolean;
  toString(): string;
  /**
   * Equality comparison.
   */
  equals(other: WrappedPattern): boolean;
  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number;
}
//#endregion
//#region src/pattern/structure/index.d.ts
/**
 * Union type for all structure patterns.
 *
 * Corresponds to the Rust `StructurePattern` enum in pattern/structure/mod.rs
 */
type StructurePattern = {
  readonly type: "Leaf";
  readonly pattern: LeafStructurePattern;
} | {
  readonly type: "Subject";
  readonly pattern: SubjectPattern;
} | {
  readonly type: "Predicate";
  readonly pattern: PredicatePattern;
} | {
  readonly type: "Object";
  readonly pattern: ObjectPattern;
} | {
  readonly type: "Assertions";
  readonly pattern: AssertionsPattern;
} | {
  readonly type: "Digest";
  readonly pattern: DigestPattern;
} | {
  readonly type: "Node";
  readonly pattern: NodePattern;
} | {
  readonly type: "Obscured";
  readonly pattern: ObscuredPattern;
} | {
  readonly type: "Wrapped";
  readonly pattern: WrappedPattern;
};
/**
 * Creates a Leaf structure pattern.
 */
declare function structureLeaf(pattern: LeafStructurePattern): StructurePattern;
/**
 * Creates a Subject structure pattern.
 */
declare function structureSubject(pattern: SubjectPattern): StructurePattern;
/**
 * Creates a Predicate structure pattern.
 */
declare function structurePredicate(pattern: PredicatePattern): StructurePattern;
/**
 * Creates an Object structure pattern.
 */
declare function structureObject(pattern: ObjectPattern): StructurePattern;
/**
 * Creates an Assertions structure pattern.
 */
declare function structureAssertions(pattern: AssertionsPattern): StructurePattern;
/**
 * Creates a Digest structure pattern.
 */
declare function structureDigest(pattern: DigestPattern): StructurePattern;
/**
 * Creates a Node structure pattern.
 */
declare function structureNode(pattern: NodePattern): StructurePattern;
/**
 * Creates an Obscured structure pattern.
 */
declare function structureObscured(pattern: ObscuredPattern): StructurePattern;
/**
 * Creates a Wrapped structure pattern.
 */
declare function structureWrapped(pattern: WrappedPattern): StructurePattern;
/**
 * Gets paths with captures for a structure pattern.
 */
declare function structurePatternPathsWithCaptures(pattern: StructurePattern, haystack: Envelope): [Path[], Map<string, Path[]>];
/**
 * Gets paths for a structure pattern.
 */
declare function structurePatternPaths(pattern: StructurePattern, haystack: Envelope): Path[];
/**
 * Compiles a structure pattern to bytecode.
 */
declare function structurePatternCompile(pattern: StructurePattern, code: Instr[], literals: Pattern[], captures: string[]): void;
/**
 * Checks if a structure pattern is complex.
 */
declare function structurePatternIsComplex(pattern: StructurePattern): boolean;
/**
 * Converts a structure pattern to string.
 */
declare function structurePatternToString(pattern: StructurePattern): string;
//#endregion
//#region src/pattern/meta/any-pattern.d.ts
declare function registerAnyPatternFactory(factory: (pattern: AnyPattern) => Pattern): void;
/**
 * A pattern that matches any element.
 *
 * Corresponds to the Rust `AnyPattern` struct in any_pattern.rs
 */
declare class AnyPattern implements Matcher {
  private constructor();
  /**
   * Creates a new AnyPattern.
   */
  static new(): AnyPattern;
  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>];
  paths(haystack: Envelope): Path[];
  matches(_haystack: Envelope): boolean;
  compile(code: Instr[], literals: Pattern[], captures: string[]): void;
  isComplex(): boolean;
  toString(): string;
  /**
   * Equality comparison.
   */
  equals(_other: AnyPattern): boolean;
  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number;
}
//#endregion
//#region src/pattern/meta/and-pattern.d.ts
declare function registerAndPatternFactory(factory: (pattern: AndPattern) => Pattern): void;
/**
 * A pattern that matches if all contained patterns match.
 *
 * Corresponds to the Rust `AndPattern` struct in and_pattern.rs
 */
declare class AndPattern implements Matcher {
  private readonly _patterns;
  private constructor();
  /**
   * Creates a new AndPattern with the given patterns.
   */
  static new(patterns: Pattern[]): AndPattern;
  /**
   * Gets the patterns.
   */
  patterns(): Pattern[];
  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>];
  paths(haystack: Envelope): Path[];
  matches(haystack: Envelope): boolean;
  compile(code: Instr[], literals: Pattern[], captures: string[]): void;
  isComplex(): boolean;
  toString(): string;
  /**
   * Equality comparison.
   */
  equals(other: AndPattern): boolean;
  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number;
}
//#endregion
//#region src/pattern/meta/or-pattern.d.ts
declare function registerOrPatternFactory(factory: (pattern: OrPattern) => Pattern): void;
/**
 * A pattern that matches if any contained pattern matches.
 *
 * Corresponds to the Rust `OrPattern` struct in or_pattern.rs
 */
declare class OrPattern implements Matcher {
  private readonly _patterns;
  private constructor();
  /**
   * Creates a new OrPattern with the given patterns.
   */
  static new(patterns: Pattern[]): OrPattern;
  /**
   * Gets the patterns.
   */
  patterns(): Pattern[];
  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>];
  paths(haystack: Envelope): Path[];
  matches(haystack: Envelope): boolean;
  compile(code: Instr[], literals: Pattern[], captures: string[]): void;
  isComplex(): boolean;
  toString(): string;
  /**
   * Equality comparison.
   */
  equals(other: OrPattern): boolean;
  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number;
}
//#endregion
//#region src/pattern/meta/not-pattern.d.ts
declare function registerNotPatternFactory(factory: (pattern: NotPattern) => Pattern): void;
/**
 * A pattern that negates another pattern; matches when the inner pattern does not match.
 *
 * Corresponds to the Rust `NotPattern` struct in not_pattern.rs
 */
declare class NotPattern implements Matcher {
  private readonly _pattern;
  private constructor();
  /**
   * Creates a new NotPattern with the given pattern.
   */
  static new(pattern: Pattern): NotPattern;
  /**
   * Gets the inner pattern.
   */
  pattern(): Pattern;
  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>];
  paths(haystack: Envelope): Path[];
  matches(haystack: Envelope): boolean;
  compile(code: Instr[], literals: Pattern[], _captures: string[]): void;
  isComplex(): boolean;
  toString(): string;
  /**
   * Equality comparison.
   */
  equals(other: NotPattern): boolean;
  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number;
}
//#endregion
//#region src/pattern/meta/capture-pattern.d.ts
declare function registerCapturePatternFactory(factory: (pattern: CapturePattern) => Pattern): void;
/**
 * A pattern that captures a match with a name.
 *
 * Corresponds to the Rust `CapturePattern` struct in capture_pattern.rs
 */
declare class CapturePattern implements Matcher {
  private readonly _name;
  private readonly _pattern;
  private constructor();
  /**
   * Creates a new CapturePattern with the given name and pattern.
   */
  static new(name: string, pattern: Pattern): CapturePattern;
  /**
   * Gets the name of the capture.
   */
  name(): string;
  /**
   * Gets the inner pattern.
   */
  pattern(): Pattern;
  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>];
  paths(haystack: Envelope): Path[];
  matches(haystack: Envelope): boolean;
  compile(code: Instr[], literals: Pattern[], captures: string[]): void;
  isComplex(): boolean;
  toString(): string;
  /**
   * Equality comparison.
   */
  equals(other: CapturePattern): boolean;
  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number;
}
//#endregion
//#region src/pattern/meta/search-pattern.d.ts
declare function registerSearchPatternFactory(factory: (pattern: SearchPattern) => Pattern): void;
/**
 * A pattern that searches the entire envelope tree for matches.
 *
 * Corresponds to the Rust `SearchPattern` struct in search_pattern.rs
 */
declare class SearchPattern implements Matcher {
  private readonly _pattern;
  private constructor();
  /**
   * Creates a new SearchPattern with the given pattern.
   */
  static new(pattern: Pattern): SearchPattern;
  /**
   * Gets the inner pattern.
   */
  pattern(): Pattern;
  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>];
  /**
   * Walk the envelope tree using the canonical `Envelope.walk` traversal.
   *
   * Mirrors Rust `bc_envelope::Envelope::walk(false, vec![], visitor)`
   * which is what `SearchPattern::paths_with_captures` uses. The earlier
   * port hand-rolled a recursion that double-recursed assertions and
   * stepped through wrapped subjects manually, producing a different
   * path order (and extra duplicates that the digest-set deduplication
   * would partially mask).
   */
  private _walkEnvelope;
  paths(haystack: Envelope): Path[];
  matches(haystack: Envelope): boolean;
  compile(code: Instr[], literals: Pattern[], captures: string[]): void;
  isComplex(): boolean;
  toString(): string;
  /**
   * Equality comparison.
   */
  equals(other: SearchPattern): boolean;
  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number;
}
//#endregion
//#region src/pattern/meta/traverse-pattern.d.ts
declare function registerTraversePatternFactory(factory: (pattern: TraversePattern) => Pattern): void;
/**
 * A pattern that matches a traversal order of patterns.
 *
 * Corresponds to the Rust `TraversePattern` struct in traverse_pattern.rs
 */
declare class TraversePattern implements Matcher {
  private readonly _first;
  private readonly _rest;
  private constructor();
  /**
   * Creates a new TraversePattern with the given patterns.
   */
  static new(patterns: Pattern[]): TraversePattern;
  /**
   * Gets all patterns in this traversal.
   */
  patterns(): Pattern[];
  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>];
  paths(haystack: Envelope): Path[];
  matches(haystack: Envelope): boolean;
  compile(code: Instr[], literals: Pattern[], captures: string[]): void;
  isComplex(): boolean;
  toString(): string;
  /**
   * Equality comparison.
   */
  equals(other: TraversePattern): boolean;
  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number;
}
//#endregion
//#region src/pattern/meta/group-pattern.d.ts
declare function registerGroupPatternFactory(factory: (pattern: GroupPattern) => Pattern): void;
/**
 * A pattern that matches with repetition.
 *
 * Corresponds to the Rust `GroupPattern` struct in repeat_pattern.rs
 */
declare class GroupPattern implements Matcher {
  private readonly _pattern;
  private readonly _quantifier;
  private constructor();
  /**
   * Creates a new GroupPattern with the specified sub-pattern and quantifier.
   */
  static repeat(pattern: Pattern, quantifier: Quantifier$1): GroupPattern;
  /**
   * Creates a new GroupPattern with a quantifier that matches exactly once.
   */
  static new(pattern: Pattern): GroupPattern;
  /**
   * Gets the sub-pattern of this group pattern.
   */
  pattern(): Pattern;
  /**
   * Gets the quantifier of this group pattern.
   */
  quantifier(): Quantifier$1;
  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>];
  paths(haystack: Envelope): Path[];
  matches(haystack: Envelope): boolean;
  compile(code: Instr[], literals: Pattern[], _captures: string[]): void;
  isComplex(): boolean;
  toString(): string;
  /**
   * Equality comparison.
   */
  equals(other: GroupPattern): boolean;
  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number;
}
//#endregion
//#region src/pattern/meta/index.d.ts
/**
 * Union type for all meta patterns.
 *
 * Corresponds to the Rust `MetaPattern` enum in pattern/meta/mod.rs
 */
type MetaPattern = {
  readonly type: "Any";
  readonly pattern: AnyPattern;
} | {
  readonly type: "And";
  readonly pattern: AndPattern;
} | {
  readonly type: "Or";
  readonly pattern: OrPattern;
} | {
  readonly type: "Not";
  readonly pattern: NotPattern;
} | {
  readonly type: "Capture";
  readonly pattern: CapturePattern;
} | {
  readonly type: "Search";
  readonly pattern: SearchPattern;
} | {
  readonly type: "Traverse";
  readonly pattern: TraversePattern;
} | {
  readonly type: "Group";
  readonly pattern: GroupPattern;
};
/**
 * Creates an Any meta pattern.
 */
declare function metaAny(pattern: AnyPattern): MetaPattern;
/**
 * Creates an And meta pattern.
 */
declare function metaAnd(pattern: AndPattern): MetaPattern;
/**
 * Creates an Or meta pattern.
 */
declare function metaOr(pattern: OrPattern): MetaPattern;
/**
 * Creates a Not meta pattern.
 */
declare function metaNot(pattern: NotPattern): MetaPattern;
/**
 * Creates a Capture meta pattern.
 */
declare function metaCapture(pattern: CapturePattern): MetaPattern;
/**
 * Creates a Search meta pattern.
 */
declare function metaSearch(pattern: SearchPattern): MetaPattern;
/**
 * Creates a Traverse meta pattern.
 */
declare function metaTraverse(pattern: TraversePattern): MetaPattern;
/**
 * Creates a Group meta pattern.
 */
declare function metaGroup(pattern: GroupPattern): MetaPattern;
/**
 * Gets paths with captures for a meta pattern.
 */
declare function metaPatternPathsWithCaptures(pattern: MetaPattern, haystack: Envelope): [Path[], Map<string, Path[]>];
/**
 * Compiles a meta pattern to bytecode.
 */
declare function metaPatternCompile(pattern: MetaPattern, code: Instr[], literals: Pattern[], captures: string[]): void;
/**
 * Checks if a meta pattern is complex.
 */
declare function metaPatternIsComplex(pattern: MetaPattern): boolean;
/**
 * Converts a meta pattern to string.
 */
declare function metaPatternToString(pattern: MetaPattern): string;
/**
 * Collects capture names from a meta pattern.
 */
declare function metaPatternCollectCaptureNames(pattern: MetaPattern, out: string[]): void;
//#endregion
//#region src/pattern/dcbor-integration.d.ts
/**
 * Convert a dcbor-pattern Pattern to a bc-envelope-pattern Pattern.
 *
 * This function serves as the bridge between the two pattern systems,
 * allowing dcbor-pattern expressions to be used in envelope pattern contexts.
 *
 * @param dcborPattern - The dcbor-pattern Pattern to convert
 * @returns The converted envelope pattern, or an error if conversion fails
 */
declare function convertDcborPatternToEnvelopePattern(dcborPattern: Pattern$1): Result<Pattern>;
//#endregion
//#region src/pattern/index.d.ts
/**
 * The main pattern type used for matching envelopes.
 *
 * Corresponds to the Rust `Pattern` enum in pattern/mod.rs
 */
type Pattern = {
  readonly type: "Leaf";
  readonly pattern: LeafPattern;
} | {
  readonly type: "Structure";
  readonly pattern: StructurePattern;
} | {
  readonly type: "Meta";
  readonly pattern: MetaPattern;
};
/**
 * Creates a Leaf pattern.
 */
declare function patternLeaf(leaf: LeafPattern): Pattern;
/**
 * Creates a Structure pattern.
 */
declare function patternStructure(structure: StructurePattern): Pattern;
/**
 * Creates a Meta pattern.
 */
declare function patternMeta(meta: MetaPattern): Pattern;
/**
 * Gets paths with captures for a pattern.
 * Routes through the VM for complex patterns that require compilation.
 */
declare function patternPathsWithCaptures(pattern: Pattern, haystack: Envelope): [Path[], Map<string, Path[]>];
/**
 * Gets paths for a pattern.
 */
declare function patternPaths(pattern: Pattern, haystack: Envelope): Path[];
/**
 * Checks if a pattern matches.
 */
declare function patternMatches(pattern: Pattern, haystack: Envelope): boolean;
/**
 * Checks if a pattern is complex.
 */
declare function patternIsComplex(pattern: Pattern): boolean;
/**
 * Compiles a pattern to bytecode.
 */
declare function patternCompile(pattern: Pattern, code: Instr[], literals: Pattern[], captures: string[]): void;
/**
 * Converts a pattern to string.
 */
declare function patternToString(pattern: Pattern): string;
/**
 * Collects capture names from a pattern.
 */
declare function patternCollectCaptureNames(pattern: Pattern, out: string[]): void;
/**
 * Creates a new Pattern that matches any CBOR value.
 */
declare function anyCbor(): Pattern;
/**
 * Creates a new Pattern that matches a specific CBOR value.
 */
declare function cborValue(value: CborInput): Pattern;
/**
 * Creates a new Pattern that matches CBOR values using dcbor-pattern expressions.
 */
declare function cborPattern(pattern: Pattern$1): Pattern;
/**
 * Creates a new Pattern that matches any boolean value.
 */
declare function anyBool(): Pattern;
/**
 * Creates a new Pattern that matches a specific boolean value.
 */
declare function bool(b: boolean): Pattern;
/**
 * Creates a new Pattern that matches any text value.
 */
declare function anyText(): Pattern;
/**
 * Creates a new Pattern that matches a specific text value.
 */
declare function text(value: string): Pattern;
/**
 * Creates a new Pattern that matches text values that match the given regex.
 */
declare function textRegex(regex: RegExp): Pattern;
/**
 * Creates a new Pattern that matches any Date value.
 */
declare function anyDate(): Pattern;
/**
 * Creates a new Pattern that matches a specific Date value.
 */
declare function date(d: CborDate): Pattern;
/**
 * Creates a new Pattern that matches Date values within a specified range.
 */
declare function dateRange(earliest: CborDate, latest: CborDate): Pattern;
/**
 * Creates a new Pattern that matches Date values on or after the specified date.
 */
declare function dateEarliest(d: CborDate): Pattern;
/**
 * Creates a new Pattern that matches Date values on or before the specified date.
 */
declare function dateLatest(d: CborDate): Pattern;
/**
 * Creates a new Pattern that matches Date values whose ISO-8601 string matches the regex.
 */
declare function dateRegex(pattern: RegExp): Pattern;
/**
 * Creates a new Pattern that matches any number value.
 */
declare function anyNumber(): Pattern;
/**
 * Creates a new Pattern that matches a specific number value.
 */
declare function number(value: number): Pattern;
/**
 * Creates a new Pattern that matches number values within a range.
 */
declare function numberRange(min: number, max: number): Pattern;
/**
 * Creates a new Pattern that matches number values greater than the specified value.
 */
declare function numberGreaterThan(value: number): Pattern;
/**
 * Creates a new Pattern that matches number values less than the specified value.
 */
declare function numberLessThan(value: number): Pattern;
/**
 * Creates a new Pattern that matches any byte string value.
 */
declare function anyByteString(): Pattern;
/**
 * Creates a new Pattern that matches a specific byte string value.
 */
declare function byteString(value: Uint8Array): Pattern;
/**
 * Creates a new Pattern that matches any known value.
 */
declare function anyKnownValue(): Pattern;
/**
 * Creates a new Pattern that matches a specific known value.
 */
declare function knownValue(value: KnownValue): Pattern;
/**
 * Creates a new Pattern that matches the unit known value.
 */
declare function unit(): Pattern;
/**
 * Creates a new Pattern that matches any array.
 */
declare function anyArray(): Pattern;
/**
 * Creates a new Pattern that matches any map.
 */
declare function anyMap(): Pattern;
/**
 * Creates a new Pattern that matches null.
 */
declare function nullPattern(): Pattern;
/**
 * Creates a new Pattern that matches any tagged value.
 */
declare function anyTag(): Pattern;
/**
 * Creates a new Pattern that matches a specific tagged value.
 */
declare function tagged(tag: Tag, pattern: Pattern$1): Pattern;
/**
 * Creates a new Pattern that matches leaf envelopes.
 */
declare function leaf(): Pattern;
/**
 * Creates a new Pattern that matches any assertion.
 */
declare function anyAssertion(): Pattern;
/**
 * Creates a new Pattern that matches assertions with predicates matching pattern.
 */
declare function assertionWithPredicate(pattern: Pattern): Pattern;
/**
 * Creates a new Pattern that matches assertions with objects matching pattern.
 */
declare function assertionWithObject(pattern: Pattern): Pattern;
/**
 * Creates a new Pattern that matches any subject.
 */
declare function anySubject(): Pattern;
/**
 * Creates a new Pattern that matches subjects matching pattern.
 */
declare function subject(pattern: Pattern): Pattern;
/**
 * Creates a new Pattern that matches any predicate.
 */
declare function anyPredicate(): Pattern;
/**
 * Creates a new Pattern that matches predicates matching pattern.
 */
declare function predicate(pattern: Pattern): Pattern;
/**
 * Creates a new Pattern that matches any object.
 */
declare function anyObject(): Pattern;
/**
 * Creates a new Pattern that matches objects matching pattern.
 */
declare function object(pattern: Pattern): Pattern;
/**
 * Creates a new Pattern that matches a specific digest.
 */
declare function digest(d: Digest): Pattern;
/**
 * Creates a new Pattern that matches digests with a prefix.
 */
declare function digestPrefix(prefix: Uint8Array): Pattern;
/**
 * Creates a new Pattern that matches any node.
 */
declare function anyNode(): Pattern;
/**
 * Creates a new Pattern that matches any obscured element.
 */
declare function obscured(): Pattern;
/**
 * Creates a new Pattern that matches elided elements.
 */
declare function elided(): Pattern;
/**
 * Creates a new Pattern that matches encrypted elements.
 */
declare function encrypted(): Pattern;
/**
 * Creates a new Pattern that matches compressed elements.
 */
declare function compressed(): Pattern;
/**
 * Creates a new Pattern that matches wrapped envelopes.
 */
declare function wrapped(): Pattern;
/**
 * Creates a new Pattern that matches wrapped envelopes and descends.
 * Named `unwrapEnvelope` to avoid conflict with Result.unwrap.
 */
declare function unwrapEnvelope(): Pattern;
/**
 * Creates a new Pattern that matches wrapped envelopes matching pattern.
 */
declare function unwrapMatching(pattern: Pattern): Pattern;
/**
 * Creates a new Pattern that matches any element.
 */
declare function any(): Pattern;
/**
 * Creates a new Pattern that matches if all patterns match.
 */
declare function and(patterns: Pattern[]): Pattern;
/**
 * Creates a new Pattern that matches if any pattern matches.
 */
declare function or(patterns: Pattern[]): Pattern;
/**
 * Creates a new Pattern that matches if the pattern does not match.
 */
declare function notMatching(pattern: Pattern): Pattern;
/**
 * Creates a new Pattern that captures a match with a name.
 */
declare function capture(name: string, pattern: Pattern): Pattern;
/**
 * Creates a new Pattern that searches for matches in the envelope tree.
 */
declare function search(pattern: Pattern): Pattern;
/**
 * Creates a new Pattern that matches a traversal order of patterns.
 */
declare function traverse(patterns: Pattern[]): Pattern;
/**
 * Creates a new Pattern that matches with repetition.
 */
declare function repeat(pattern: Pattern, min: number, max?: number, reluctance?: Reluctance$1): Pattern;
/**
 * Creates a new Pattern for grouping.
 */
declare function group(pattern: Pattern): Pattern;
//#endregion
//#region src/parse/index.d.ts
/**
 * Parse a pattern expression string into a Pattern.
 *
 * Mirrors Rust `Pattern::parse`: tries envelope-pattern parsing first;
 * on failure falls back to dcbor-pattern parsing and converts the
 * result into an envelope pattern via the
 * `dcbor_integration::convert_dcbor_pattern_to_envelope_pattern` bridge.
 */
declare function parse(input: string): Result<Pattern>;
/**
 * Parse a pattern, allowing extra data after the pattern.
 *
 * Returns the parsed pattern and the byte offset at which parsing
 * stopped, mirroring `Pattern::parse_partial` in spirit.
 */
declare function parsePartial(input: string): Result<[Pattern, number]>;
//#endregion
//#region src/index.d.ts
/**
 * Package version.
 */
declare const VERSION = "1.0.0-alpha.11";
//#endregion
export { AndPattern, AnyPattern, ArrayPattern, AssertionsPattern, type AssertionsPatternType, Axis, BoolPattern, ByteStringPattern, CBORPattern, type CBORPatternType, CapturePattern, DatePattern, DigestPattern, type DigestPatternType, EdgeType, EnvelopePatternError, FormatPathsOpts, FormatPathsOptsBuilder, GroupPattern, Instr, Interval, KnownValuePattern, LeafPattern, LeafStructurePattern, Lexer, MapPattern, type MapPatternType, Matcher, MatcherDefaults, MetaPattern, NodePattern, type NodePatternType, NotPattern, NullPattern, NumberPattern, ObjectPattern, type ObjectPatternType, ObscuredPattern, type ObscuredPatternType, OrPattern, Path, PathElementFormat, Pattern, PredicatePattern, type PredicatePatternType, Program, Quantifier, Reluctance, Result, SearchPattern, Span, StructurePattern, SubjectPattern, type SubjectPatternType, TaggedPattern, TextPattern, type Token, TraversePattern, VERSION, WrappedPattern, type WrappedPatternType, and, any, anyArray, anyAssertion, anyBool, anyByteString, anyCbor, anyDate, anyKnownValue, anyMap, anyNode, anyNumber, anyObject, anyPredicate, anySubject, anyTag, anyText, assertionWithObject, assertionWithPredicate, axisChildren, bool, byteString, capture, cborPattern, cborValue, compile, compileAsAtomic, compressed, convertDcborPatternToEnvelopePattern, date, dateEarliest, dateLatest, dateRange, dateRegex, dcborPatternError, defaultFormatPathsOpts, defaultPathElementFormat, digest, digestPrefix, digestURFormat, dispatchCompile, dispatchIsComplex, dispatchPaths, dispatchPathsWithCaptures, dispatchPatternToString, elided, emptyInput, encrypted, envelopeSummary, envelopeURFormat, err, expectedCloseBracket, expectedCloseParen, expectedOpenBracket, expectedOpenParen, expectedPattern, extraData, formatError, formatPath, formatPathOpt, formatPaths, formatPathsOpt, formatPathsOpts, formatPathsWithCaptures, formatPathsWithCapturesOpt, group, invalidCaptureGroupName, invalidDateFormat, invalidHexString, invalidNumberFormat, invalidPattern, invalidRange, invalidRegex, invalidUr, isErr, isOk, knownValue, leaf, leafArray, leafBool, leafByteString, leafCbor, leafDate, leafKnownValue, leafMap, leafNull, leafNumber, leafPatternCompile, leafPatternIsComplex, leafPatternPaths, leafPatternPathsWithCaptures, leafPatternToString, leafTag, leafText, map, matchPattern, metaAnd, metaAny, metaCapture, metaGroup, metaNot, metaOr, metaPatternCollectCaptureNames, metaPatternCompile, metaPatternIsComplex, metaPatternPathsWithCaptures, metaPatternToString, metaSearch, metaTraverse, notMatching, nullPattern, number, numberGreaterThan, numberLessThan, numberRange, object, obscured, ok, or, parse, parsePartial, patternCollectCaptureNames, patternCompile, patternIsComplex, patternLeaf, patternMatches, patternMeta, patternPaths, patternPathsWithCaptures, patternStructure, patternToString, predicate, registerAndPatternFactory, registerAnyPatternFactory, registerArrayPatternFactory, registerAssertionsPatternFactory, registerAssertionsPatternToStringDispatch, registerBoolPatternFactory, registerByteStringPatternFactory, registerCBORPatternFactory, registerCapturePatternFactory, registerDatePatternFactory, registerDigestPatternFactory, registerGroupPatternFactory, registerKnownValuePatternFactory, registerLeafStructurePatternFactory, registerMapPatternFactory, registerNodePatternFactory, registerNotPatternFactory, registerNullPatternFactory, registerNumberPatternFactory, registerObjectPatternFactory, registerObscuredPatternFactory, registerOrPatternFactory, registerPatternDispatchFns, registerPatternMatchFn, registerPredicatePatternFactory, registerSearchPatternFactory, registerSubjectPatternDispatch, registerSubjectPatternFactory, registerTaggedPatternFactory, registerTextPatternFactory, registerTraversePatternFactory, registerVMPatternFunctions, registerWrappedPatternAny, registerWrappedPatternDispatch, registerWrappedPatternFactory, repeat, run, search, structureAssertions, structureDigest, structureLeaf, structureNode, structureObject, structureObscured, structurePatternCompile, structurePatternIsComplex, structurePatternPaths, structurePatternPathsWithCaptures, structurePatternToString, structurePredicate, structureSubject, structureWrapped, subject, summaryFormat, tagged, text, textRegex, traverse, unexpectedEndOfInput, unexpectedToken, unit, unknown, unmatchedBraces, unmatchedParentheses, unrecognizedToken, unterminatedRegex, unwrap, unwrapEnvelope, unwrapMatching, unwrapOr, wrapped };
//# sourceMappingURL=index.d.mts.map