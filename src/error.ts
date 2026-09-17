/**
 * Errors: `EnvelopePatternError` for text that does not parse. Spans are
 * UTF-16 code-unit offsets into the source, always absolute: where the
 * reference reports a span relative to the `date'…'`, `digest(…)`,
 * `cbor(…)`, `tagged(…)` or `[…]` body it parsed, this library reports the
 * same extent from the start of the source. Where the reference raises a
 * bare `Unknown` (text it could not lex inside a construct), this library
 * raises `UnrecognizedToken` or `InvalidPattern` with the span.
 *
 * @module error
 */

/** A non-throwing outcome: the value, or the error. */
export type DcborResult<T, E> =
  | {
      /** `true`: `value` is present. */
      readonly ok: true;
      /** The outcome. */
      readonly value: T;
    }
  | {
      /** `false`: `error` is present. */
      readonly ok: false;
      /** Why there is no value. */
      readonly error: E;
    };

/** A half-open range of UTF-16 code units in the source string. */
export interface Span {
  /** The offset of the first code unit. */
  readonly start: number;
  /** The offset after the last code unit. */
  readonly end: number;
}

/** Builds a frozen span. */
export function span(start: number, end: number): Span {
  return Object.freeze({ start, end });
}

/** The kind of a token, as `UnexpectedToken` reports it. */
export type TokenKind =
  | "And"
  | "Or"
  | "Not"
  | "Traverse"
  | "RepeatZeroOrMore"
  | "RepeatZeroOrMoreLazy"
  | "RepeatZeroOrMorePossessive"
  | "RepeatOneOrMore"
  | "RepeatOneOrMoreLazy"
  | "RepeatOneOrMorePossessive"
  | "RepeatZeroOrOne"
  | "RepeatZeroOrOneLazy"
  | "RepeatZeroOrOnePossessive"
  | "Assertion"
  | "AssertionPred"
  | "AssertionObj"
  | "Digest"
  | "Node"
  | "Obj"
  | "Obscured"
  | "Elided"
  | "Encrypted"
  | "Compressed"
  | "Pred"
  | "Subject"
  | "Wrapped"
  | "Unwrap"
  | "Search"
  | "ByteString"
  | "Leaf"
  | "Cbor"
  | "DateKeyword"
  | "Known"
  | "Null"
  | "NumberKeyword"
  | "Tagged"
  | "BoolKeyword"
  | "BoolTrue"
  | "BoolFalse"
  | "TextKeyword"
  | "NaN"
  | "StringLiteral"
  | "ParenOpen"
  | "ParenClose"
  | "BracketOpen"
  | "BracketClose"
  | "Comma"
  | "Ellipsis"
  | "GreaterThanOrEqual"
  | "LessThanOrEqual"
  | "GreaterThan"
  | "LessThan"
  | "Integer"
  | "Float"
  | "Infinity"
  | "NegativeInfinity"
  | "GroupName"
  | "Regex"
  | "HexPattern"
  | "HexBinaryRegex"
  | "DatePattern"
  | "Range"
  | "SingleQuotedPattern"
  | "SingleQuotedRegex";

/** Why a pattern text was rejected. */
export const EnvelopePatternErrorCode: {
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
} = Object.freeze({
  EmptyInput: "EmptyInput",
  UnexpectedEndOfInput: "UnexpectedEndOfInput",
  ExtraData: "ExtraData",
  UnexpectedToken: "UnexpectedToken",
  UnrecognizedToken: "UnrecognizedToken",
  InvalidRegex: "InvalidRegex",
  UnterminatedRegex: "UnterminatedRegex",
  InvalidRange: "InvalidRange",
  InvalidHexString: "InvalidHexString",
  InvalidDateFormat: "InvalidDateFormat",
  InvalidNumberFormat: "InvalidNumberFormat",
  InvalidUr: "InvalidUr",
  ExpectedOpenParen: "ExpectedOpenParen",
  ExpectedCloseParen: "ExpectedCloseParen",
  ExpectedOpenBracket: "ExpectedOpenBracket",
  ExpectedCloseBracket: "ExpectedCloseBracket",
  ExpectedPattern: "ExpectedPattern",
  UnmatchedParentheses: "UnmatchedParentheses",
  UnmatchedBraces: "UnmatchedBraces",
  InvalidCaptureGroupName: "InvalidCaptureGroupName",
  InvalidPattern: "InvalidPattern",
  NestingTooDeep: "NestingTooDeep",
});

/** One of the `EnvelopePatternErrorCode` values. */
export type EnvelopePatternErrorCode =
  (typeof EnvelopePatternErrorCode)[keyof typeof EnvelopePatternErrorCode];

/**
 * The structured payload of an {@link EnvelopePatternError}, discriminated
 * by `code`: `e.details.code === "UnexpectedToken"` narrows to `{ span,
 * kind, text }`. Every code but `EmptyInput` and `UnexpectedEndOfInput`
 * carries the span of the offending text.
 */
export type EnvelopePatternErrorDetails =
  | {
      /** The discriminant. */
      readonly code: "EmptyInput";
    }
  | {
      /** The discriminant. */
      readonly code: "UnexpectedEndOfInput";
    }
  | {
      /** The discriminant. */
      readonly code: "ExtraData";
      /** The text after the pattern. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "UnexpectedToken";
      /** The token. */
      readonly span: Span;
      /** The kind of the token found. */
      readonly kind: TokenKind;
      /** The token's source text. */
      readonly text: string;
    }
  | {
      /** The discriminant. */
      readonly code: "UnrecognizedToken";
      /** The unrecognised text. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "InvalidRegex";
      /** The regex literal. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "UnterminatedRegex";
      /** The opening delimiter. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "InvalidRange";
      /** The range text. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "InvalidHexString";
      /** The `h'…'` literal, or for `digest(…)` the point just after the hex. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "InvalidDateFormat";
      /** The body between the quotes of `date'…'`. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "InvalidNumberFormat";
      /** The literal. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "InvalidUr";
      /** The point just after the UR in `digest(…)`. */
      readonly span: Span;
      /** The UR decoder's reason. */
      readonly cause: string;
    }
  | {
      /** The discriminant. */
      readonly code: "ExpectedOpenParen";
      /** Where the parenthesis was required. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "ExpectedCloseParen";
      /** The token found instead, or the end of the source. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "ExpectedOpenBracket";
      /** Where the bracket was required. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "ExpectedCloseBracket";
      /** The token found instead, or the end of the source. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "ExpectedPattern";
      /** Where the pattern was required. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "UnmatchedParentheses";
      /** The parenthesis without a pair. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "UnmatchedBraces";
      /** The brace without a pair. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "InvalidCaptureGroupName";
      /** The `@` and the name. */
      readonly span: Span;
      /** The name as written. */
      readonly name: string;
    }
  | {
      /** The discriminant. */
      readonly code: "InvalidPattern";
      /** The dCBOR pattern body, or the rest of the text an array pattern consumed. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "NestingTooDeep";
      /** The token that opened the level too many. */
      readonly span: Span;
      /** The limit in force. */
      readonly maxDepth: number;
    };

/** The details payload of each `EnvelopePatternErrorCode`. */
export type EnvelopePatternErrorDetailsByCode = {
  [D in EnvelopePatternErrorDetails as D["code"]]: D;
};

/**
 * An {@link EnvelopePatternError} narrowed to one code: `code` is `C` and
 * `details` is the payload of `C`. With the default type argument it is the
 * union over every code, so narrowing on `error.code` narrows `error.details`.
 */
export type EnvelopePatternErrorTyped<
  C extends EnvelopePatternErrorCode = EnvelopePatternErrorCode,
> = C extends EnvelopePatternErrorCode
  ? EnvelopePatternError & {
      /** The discriminant. */
      readonly code: C;
      /** The payload of `code`. */
      readonly details: EnvelopePatternErrorDetailsByCode[C];
    }
  : never;

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
export class EnvelopePatternError extends Error {
  /** Always `"EnvelopePatternError"`; the cross-copy identity {@link EnvelopePatternError.isEnvelopePatternError} checks. */
  override readonly name = "EnvelopePatternError";
  /** The discriminant; equals `details.code`. */
  readonly code: EnvelopePatternErrorCode;
  /** The structured payload, discriminated by `code`. */
  readonly details: EnvelopePatternErrorDetails;

  private constructor(message: string, details: EnvelopePatternErrorDetails) {
    super(message);
    this.code = details.code;
    this.details = Object.freeze(details);
  }

  /** Type guard for an `EnvelopePatternError`, including one from another copy of this package. */
  static isEnvelopePatternError(value: unknown): value is EnvelopePatternErrorTyped {
    return value instanceof Error && value.name === "EnvelopePatternError" && "code" in value;
  }

  /** `true` when `code` is this error's code. */
  is(code: EnvelopePatternErrorCode): boolean {
    return this.code === code;
  }

  /** The span, if the error has one. */
  get span(): Span | undefined {
    return "span" in this.details ? this.details.span : undefined;
  }

  /** The message with the source line and a caret under the span. */
  fullMessage(source: string): string {
    const s =
      this.code === "UnexpectedEndOfInput" || this.code === "EmptyInput"
        ? span(source.length, source.length)
        : (this.span ?? span(0, 0));
    return formatMessage(this.message, source, s);
  }

  /** @internal The same error with its span moved by `offset`. */
  shifted(offset: number): EnvelopePatternError {
    const current = this.span;
    if (current === undefined) return this;
    const moved = span(current.start + offset, current.end + offset);
    return new EnvelopePatternError(this.message, {
      ...this.details,
      span: moved,
    } as EnvelopePatternErrorDetails);
  }

  private static make<C extends EnvelopePatternErrorCode>(
    message: string,
    details: EnvelopePatternErrorDetailsByCode[C],
  ): EnvelopePatternErrorTyped<C> {
    return new EnvelopePatternError(message, details) as EnvelopePatternErrorTyped<C>;
  }

  /** The source is empty. */
  static emptyInput(): EnvelopePatternErrorTyped<"EmptyInput"> {
    return EnvelopePatternError.make("Empty input", { code: "EmptyInput" });
  }
  /** The source ended inside a pattern. */
  static unexpectedEndOfInput(): EnvelopePatternErrorTyped<"UnexpectedEndOfInput"> {
    return EnvelopePatternError.make("Unexpected end of input", { code: "UnexpectedEndOfInput" });
  }
  /** Text follows the pattern. */
  static extraData(range: Span): EnvelopePatternErrorTyped<"ExtraData"> {
    return EnvelopePatternError.make("Extra data at end of input", {
      code: "ExtraData",
      span: range,
    });
  }
  /** A token that cannot start or continue a pattern here. */
  static unexpectedToken(
    kind: TokenKind,
    text: string,
    range: Span,
  ): EnvelopePatternErrorTyped<"UnexpectedToken"> {
    return EnvelopePatternError.make(`Unexpected token \`${text}\``, {
      code: "UnexpectedToken",
      span: range,
      kind,
      text,
    });
  }
  /** Text no token matches. */
  static unrecognizedToken(range: Span): EnvelopePatternErrorTyped<"UnrecognizedToken"> {
    return EnvelopePatternError.make("Unrecognized token", {
      code: "UnrecognizedToken",
      span: range,
    });
  }
  /** A regex the dialect does not accept. */
  static invalidRegex(range: Span): EnvelopePatternErrorTyped<"InvalidRegex"> {
    return EnvelopePatternError.make("Invalid regex pattern", {
      code: "InvalidRegex",
      span: range,
    });
  }
  /** A regex or quoted literal without its closing delimiter. */
  static unterminatedRegex(range: Span): EnvelopePatternErrorTyped<"UnterminatedRegex"> {
    return EnvelopePatternError.make("Unterminated regex pattern", {
      code: "UnterminatedRegex",
      span: range,
    });
  }
  /** A `{n,m}` range that is not one, or with `n` above `m`. */
  static invalidRange(range: Span): EnvelopePatternErrorTyped<"InvalidRange"> {
    return EnvelopePatternError.make("Invalid range", { code: "InvalidRange", span: range });
  }
  /** A hex literal that is not even-length hex of at most 32 bytes. */
  static invalidHexString(range: Span): EnvelopePatternErrorTyped<"InvalidHexString"> {
    return EnvelopePatternError.make("Invalid hex string", {
      code: "InvalidHexString",
      span: range,
    });
  }
  /** A `date'…'` body that is not a date, a range of dates, or a regex. */
  static invalidDateFormat(range: Span): EnvelopePatternErrorTyped<"InvalidDateFormat"> {
    return EnvelopePatternError.make("Invalid date format", {
      code: "InvalidDateFormat",
      span: range,
    });
  }
  /** A number literal outside the 64-bit integer range. */
  static invalidNumberFormat(range: Span): EnvelopePatternErrorTyped<"InvalidNumberFormat"> {
    return EnvelopePatternError.make("Invalid number format", {
      code: "InvalidNumberFormat",
      span: range,
    });
  }
  /** A `digest(ur:…)` body the UR decoder rejects. */
  static invalidUr(cause: string, range: Span): EnvelopePatternErrorTyped<"InvalidUr"> {
    return EnvelopePatternError.make(`Invalid UR: ${cause}`, {
      code: "InvalidUr",
      span: range,
      cause,
    });
  }
  /** An opening parenthesis was required. */
  static expectedOpenParen(range: Span): EnvelopePatternErrorTyped<"ExpectedOpenParen"> {
    return EnvelopePatternError.make("Expected opening parenthesis", {
      code: "ExpectedOpenParen",
      span: range,
    });
  }
  /** A closing parenthesis was required. */
  static expectedCloseParen(range: Span): EnvelopePatternErrorTyped<"ExpectedCloseParen"> {
    return EnvelopePatternError.make("Expected closing parenthesis", {
      code: "ExpectedCloseParen",
      span: range,
    });
  }
  /** An opening bracket was required. */
  static expectedOpenBracket(range: Span): EnvelopePatternErrorTyped<"ExpectedOpenBracket"> {
    return EnvelopePatternError.make("Expected opening bracket", {
      code: "ExpectedOpenBracket",
      span: range,
    });
  }
  /** A closing bracket was required. */
  static expectedCloseBracket(range: Span): EnvelopePatternErrorTyped<"ExpectedCloseBracket"> {
    return EnvelopePatternError.make("Expected closing bracket", {
      code: "ExpectedCloseBracket",
      span: range,
    });
  }
  /** A pattern was required after an operator. */
  static expectedPattern(range: Span): EnvelopePatternErrorTyped<"ExpectedPattern"> {
    return EnvelopePatternError.make("Expected pattern after operator", {
      code: "ExpectedPattern",
      span: range,
    });
  }
  /** Parentheses that do not pair. */
  static unmatchedParentheses(range: Span): EnvelopePatternErrorTyped<"UnmatchedParentheses"> {
    return EnvelopePatternError.make("Unmatched parentheses", {
      code: "UnmatchedParentheses",
      span: range,
    });
  }
  /** Braces that do not pair. */
  static unmatchedBraces(range: Span): EnvelopePatternErrorTyped<"UnmatchedBraces"> {
    return EnvelopePatternError.make("Unmatched braces", { code: "UnmatchedBraces", span: range });
  }
  /** A capture name that is not an identifier. */
  static invalidCaptureGroupName(
    name: string,
    range: Span,
  ): EnvelopePatternErrorTyped<"InvalidCaptureGroupName"> {
    return EnvelopePatternError.make(`Invalid capture group name '${name}'`, {
      code: "InvalidCaptureGroupName",
      span: range,
      name,
    });
  }
  /** A `cbor(…)` body that is neither a value, a UR nor a dCBOR pattern. */
  static invalidPattern(range: Span): EnvelopePatternErrorTyped<"InvalidPattern"> {
    return EnvelopePatternError.make("Invalid pattern", { code: "InvalidPattern", span: range });
  }
  /** A pattern nested deeper than `maxDepth`. */
  static nestingTooDeep(
    maxDepth: number,
    range: Span,
  ): EnvelopePatternErrorTyped<"NestingTooDeep"> {
    return EnvelopePatternError.make(`Nesting deeper than ${maxDepth} levels`, {
      code: "NestingTooDeep",
      span: range,
      maxDepth,
    });
  }
}

function formatMessage(message: string, source: string, range: Span): string {
  const start = range.start;
  const end = range.end;
  let lineNumber = 1;
  let lineStart = 0;
  for (let idx = 0; idx < source.length && idx < start; idx++) {
    if (source[idx] === "\n") {
      lineNumber++;
      lineStart = idx + 1;
    }
  }
  const lines = source.split("\n");
  let line = lines[lineNumber - 1] ?? "";
  if (line.endsWith("\r")) line = line.slice(0, -1);
  const column = Math.max(0, start - lineStart);
  const underlineLen = Math.max(1, end - start);
  const caret = " ".repeat(column) + "^".repeat(underlineLen);
  return `line ${lineNumber}: ${message}\n${line}\n${caret}`;
}
