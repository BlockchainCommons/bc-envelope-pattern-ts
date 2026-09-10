/**
 * The lexer: pattern text into tokens with their spans. The longest token
 * wins at every position; text no token matches throws `UnrecognizedToken`
 * at its first character.
 */
import { Quantifier, Reluctance } from "@blockchaincommons/dcbor-pattern";
import { type Span, span, EnvelopePatternError } from "../error";

/** A token of the pattern language. */
export type Token =
  | { readonly type: "And" }
  | { readonly type: "Or" }
  | { readonly type: "Not" }
  | { readonly type: "Traverse" }
  | { readonly type: "RepeatZeroOrMore" }
  | { readonly type: "RepeatZeroOrMoreLazy" }
  | { readonly type: "RepeatZeroOrMorePossessive" }
  | { readonly type: "RepeatOneOrMore" }
  | { readonly type: "RepeatOneOrMoreLazy" }
  | { readonly type: "RepeatOneOrMorePossessive" }
  | { readonly type: "RepeatZeroOrOne" }
  | { readonly type: "RepeatZeroOrOneLazy" }
  | { readonly type: "RepeatZeroOrOnePossessive" }
  | { readonly type: "Assertion" }
  | { readonly type: "AssertionPred" }
  | { readonly type: "AssertionObj" }
  | { readonly type: "Digest" }
  | { readonly type: "Node" }
  | { readonly type: "Obj" }
  | { readonly type: "Obscured" }
  | { readonly type: "Elided" }
  | { readonly type: "Encrypted" }
  | { readonly type: "Compressed" }
  | { readonly type: "Pred" }
  | { readonly type: "Subject" }
  | { readonly type: "Wrapped" }
  | { readonly type: "Unwrap" }
  | { readonly type: "Search" }
  | { readonly type: "ByteString" }
  | { readonly type: "Leaf" }
  | { readonly type: "Cbor" }
  | { readonly type: "DateKeyword" }
  | { readonly type: "Known" }
  | { readonly type: "Null" }
  | { readonly type: "NumberKeyword" }
  | { readonly type: "Tagged" }
  | { readonly type: "BoolKeyword" }
  | { readonly type: "BoolTrue" }
  | { readonly type: "BoolFalse" }
  | { readonly type: "TextKeyword" }
  | { readonly type: "NaN" }
  | { readonly type: "StringLiteral"; readonly value: string }
  | { readonly type: "ParenOpen" }
  | { readonly type: "ParenClose" }
  | { readonly type: "BracketOpen" }
  | { readonly type: "BracketClose" }
  | { readonly type: "Comma" }
  | { readonly type: "Ellipsis" }
  | { readonly type: "GreaterThanOrEqual" }
  | { readonly type: "LessThanOrEqual" }
  | { readonly type: "GreaterThan" }
  | { readonly type: "LessThan" }
  | { readonly type: "Integer"; readonly value: number }
  | { readonly type: "Float"; readonly value: number }
  | { readonly type: "Infinity" }
  | { readonly type: "NegativeInfinity" }
  | { readonly type: "GroupName"; readonly name: string }
  | { readonly type: "Regex"; readonly pattern: string }
  | { readonly type: "HexPattern"; readonly bytes: Uint8Array }
  | { readonly type: "HexBinaryRegex"; readonly pattern: string }
  | { readonly type: "DatePattern"; readonly content: string }
  | {
      readonly type: "Range";
      /** The quantifier, or `undefined` when the range text is malformed. */
      readonly quantifier: Quantifier | undefined;
      /** Why the range is malformed. */
      readonly error: EnvelopePatternError | undefined;
    }
  | { readonly type: "SingleQuotedPattern"; readonly content: string }
  | { readonly type: "SingleQuotedRegex"; readonly pattern: string };

/** A token with its span in the source. */
export interface SpannedToken {
  /** The token. */
  readonly token: Token;
  /** Where it was read. */
  readonly span: Span;
}

/** Fixed-text tokens, longest first so the longest match wins. */
const FIXED: readonly (readonly [string, Token["type"]])[] = [
  ["-Infinity", "NegativeInfinity"],
  ["assertpred", "AssertionPred"],
  ["assertobj", "AssertionObj"],
  ["compressed", "Compressed"],
  ["encrypted", "Encrypted"],
  ["Infinity", "Infinity"],
  ["obscured", "Obscured"],
  ["wrapped", "Wrapped"],
  ["assert", "Assertion"],
  ["digest", "Digest"],
  ["elided", "Elided"],
  ["number", "NumberKeyword"],
  ["search", "Search"],
  ["tagged", "Tagged"],
  ["unwrap", "Unwrap"],
  ["false", "BoolFalse"],
  ["known", "Known"],
  ["bool", "BoolKeyword"],
  ["bstr", "ByteString"],
  ["cbor", "Cbor"],
  ["date", "DateKeyword"],
  ["leaf", "Leaf"],
  ["node", "Node"],
  ["null", "Null"],
  ["pred", "Pred"],
  ["subj", "Subject"],
  ["text", "TextKeyword"],
  ["true", "BoolTrue"],
  ["NaN", "NaN"],
  ["obj", "Obj"],
  ["...", "Ellipsis"],
  ["->", "Traverse"],
  ["*?", "RepeatZeroOrMoreLazy"],
  ["*+", "RepeatZeroOrMorePossessive"],
  ["+?", "RepeatOneOrMoreLazy"],
  ["++", "RepeatOneOrMorePossessive"],
  ["??", "RepeatZeroOrOneLazy"],
  ["?+", "RepeatZeroOrOnePossessive"],
  [">=", "GreaterThanOrEqual"],
  ["<=", "LessThanOrEqual"],
  ["&", "And"],
  ["|", "Or"],
  ["!", "Not"],
  ["*", "RepeatZeroOrMore"],
  ["+", "RepeatOneOrMore"],
  ["?", "RepeatZeroOrOne"],
  ["(", "ParenOpen"],
  [")", "ParenClose"],
  ["[", "BracketOpen"],
  ["]", "BracketClose"],
  [",", "Comma"],
  [">", "GreaterThan"],
  ["<", "LessThan"],
];

const FLOAT = /^-?(?:0|[1-9]\d*)\.\d+(?:[eE][+-]?\d+)?/;
const INTEGER = /^-?(?:0|[1-9]\d*)/;
const GROUP_NAME = /^@[a-zA-Z_][a-zA-Z0-9_]*/;
const I64_MIN = -(2n ** 63n);
const I64_MAX = 2n ** 63n - 1n;

const isWhitespace = (ch: string): boolean =>
  ch === " " || ch === "\t" || ch === "\r" || ch === "\n" || ch === "\f";
const isDigit = (ch: string): boolean => ch >= "0" && ch <= "9";
const isHexDigit = (ch: string): boolean =>
  (ch >= "0" && ch <= "9") || (ch >= "a" && ch <= "f") || (ch >= "A" && ch <= "F");

/** The number of UTF-16 code units of the code point at `i`. */
const charWidth = (s: string, i: number): number => {
  const cp = s.codePointAt(i);
  return cp !== undefined && cp > 0xffff ? 2 : 1;
};

/** Reads the tokens of a pattern text one at a time. */
export class Lexer {
  private readonly _input: string;
  private _position = 0;

  constructor(input: string) {
    this._input = input;
  }

  /** The whole source. */
  input(): string {
    return this._input;
  }

  /** The offset after the last token read. */
  position(): number {
    return this._position;
  }

  /** The source from the current offset on. */
  remainder(): string {
    return this._input.slice(this._position);
  }

  /** Skips `n` code units. */
  bump(n: number): void {
    this._position += n;
  }

  /** The empty span at the current offset. */
  span(): Span {
    return span(this._position, this._position);
  }

  private skipWhitespace(): void {
    while (this._position < this._input.length && isWhitespace(this._input[this._position])) {
      this._position++;
    }
  }

  /**
   * The next token, or `undefined` at the end of the source.
   *
   * @throws {EnvelopePatternError} for text no token matches, or a malformed literal
   */
  next(): SpannedToken | undefined {
    this.skipWhitespace();
    if (this._position >= this._input.length) return undefined;
    const start = this._position;
    const rest = this.remainder();
    const done = (token: Token): SpannedToken => ({ token, span: span(start, this._position) });

    // literal-bearing tokens: their prefix beats a shorter fixed token
    if (rest.startsWith("h'/")) {
      this.bump(3);
      return done({ type: "HexBinaryRegex", pattern: this.hexBinaryRegex(start) });
    }
    if (rest.startsWith("h'")) {
      this.bump(2);
      return done({ type: "HexPattern", bytes: this.hexPattern(start) });
    }
    if (rest.startsWith("date'")) {
      this.bump(5);
      return done({ type: "DatePattern", content: this.quoted(start, "date'") });
    }
    if (rest.startsWith("'/")) {
      this.bump(2);
      return done({ type: "SingleQuotedRegex", pattern: this.singleQuotedRegex(start) });
    }
    if (rest.startsWith("'")) {
      this.bump(1);
      return done({ type: "SingleQuotedPattern", content: this.quoted(start, "'") });
    }
    if (rest.startsWith('"')) {
      this.bump(1);
      return done({ type: "StringLiteral", value: this.stringLiteral() });
    }
    if (rest.startsWith("/")) {
      this.bump(1);
      return done({ type: "Regex", pattern: this.regex(start) });
    }
    if (rest.startsWith("{")) {
      this.bump(1);
      try {
        return done({ type: "Range", quantifier: this.range(start), error: undefined });
      } catch (e) {
        // a malformed range is still a `{` token; the parser reports it where it is used
        if (!EnvelopePatternError.isEnvelopePatternError(e)) throw e;
        return done({ type: "Range", quantifier: undefined, error: e });
      }
    }

    // the longest of the fixed tokens and the number forms
    let best: { length: number; token: Token } | undefined;
    const consider = (length: number, token: Token): void => {
      if (best === undefined || length > best.length) best = { length, token };
    };
    for (const [text, type] of FIXED) {
      if (rest.startsWith(text)) {
        consider(text.length, { type } as Token);
        break;
      }
    }
    const float = FLOAT.exec(rest);
    if (float !== null) consider(float[0].length, { type: "Float", value: Number(float[0]) });
    const integer = INTEGER.exec(rest);
    if (integer !== null && (float === null || integer[0].length > float[0].length)) {
      const big = BigInt(integer[0]);
      if (big < I64_MIN || big > I64_MAX) {
        this.bump(integer[0].length);
        throw EnvelopePatternError.invalidNumberFormat(span(start, this._position));
      }
      consider(integer[0].length, { type: "Integer", value: Number(big) });
    }
    const group = GROUP_NAME.exec(rest);
    if (group !== null) consider(group[0].length, { type: "GroupName", name: group[0].slice(1) });

    if (best !== undefined) {
      const chosen: { length: number; token: Token } = best;
      this.bump(chosen.length);
      return done(chosen.token);
    }
    this.bump(charWidth(this._input, start));
    throw EnvelopePatternError.unrecognizedToken(span(start, this._position));
  }

  /** The next token without consuming it, or `undefined` at the end; throws as `next` does. */
  peek(): SpannedToken | undefined {
    const saved = this._position;
    try {
      return this.next();
    } finally {
      this._position = saved;
    }
  }

  /** The next token without consuming it; `undefined` at the end or when the lexer would throw. */
  peekQuiet(): SpannedToken | undefined {
    try {
      return this.peek();
    } catch (e) {
      if (EnvelopePatternError.isEnvelopePatternError(e)) return undefined;
      throw e;
    }
  }

  /** A `"…"` literal after its opening quote; `\"`, `\\`, `\n`, `\r`, `\t` are escapes. */
  private stringLiteral(): string {
    let content = "";
    let escape = false;
    while (this._position < this._input.length) {
      const ch = this._input[this._position++];
      if (escape) {
        switch (ch) {
          case "n":
            content += "\n";
            break;
          case "t":
            content += "\t";
            break;
          case "r":
            content += "\r";
            break;
          case "\\":
            content += "\\";
            break;
          case '"':
            content += '"';
            break;
          default:
            content += `\\${ch}`;
        }
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        return content;
      } else {
        content += ch;
      }
    }
    throw EnvelopePatternError.unexpectedEndOfInput();
  }

  /** A regex after its opening `/`, up to the unescaped closing `/`. */
  private regexBody(start: number, opener: number, closesWithQuote: boolean): string {
    let escape = false;
    const from = this._position;
    while (this._position < this._input.length) {
      const ch = this._input[this._position++];
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === "/") {
        const body = this._input.slice(from, this._position - 1);
        if (closesWithQuote && this._input[this._position] === "'") this._position++;
        return body;
      }
    }
    throw EnvelopePatternError.unterminatedRegex(span(start, start + opener));
  }

  private regex(start: number): string {
    return this.regexBody(start, 1, false);
  }

  private hexBinaryRegex(start: number): string {
    return this.regexBody(start, 3, true);
  }

  private singleQuotedRegex(start: number): string {
    return this.regexBody(start, 2, true);
  }

  /** `h'…'` after `h'`: even-length hex. */
  private hexPattern(start: number): Uint8Array {
    let hex = "";
    while (this._position < this._input.length) {
      const ch = this._input[this._position];
      if (ch === "'") {
        this._position++;
        if (hex.length % 2 !== 0) {
          throw EnvelopePatternError.invalidHexString(span(start, this._position));
        }
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
        return bytes;
      }
      if (!isHexDigit(ch)) throw EnvelopePatternError.invalidHexString(span(start, start + 2));
      hex += ch;
      this._position++;
    }
    throw EnvelopePatternError.invalidHexString(span(start, start + 2));
  }

  /** The text up to the closing `'`. */
  private quoted(start: number, opener: string): string {
    const from = this._position;
    while (this._position < this._input.length) {
      if (this._input[this._position] === "'") {
        const content = this._input.slice(from, this._position);
        this._position++;
        return content;
      }
      this._position++;
    }
    throw EnvelopePatternError.unterminatedRegex(span(start, start + opener.length));
  }

  private digits(): string {
    const from = this._position;
    while (this._position < this._input.length && isDigit(this._input[this._position])) {
      this._position++;
    }
    return this._input.slice(from, this._position);
  }

  /** `{n}`, `{n,m}` or `{n,}` after `{`, with an optional `?` or `+`. */
  private range(start: number): Quantifier {
    const invalid = (): never => {
      throw EnvelopePatternError.invalidRange(span(start, start + 1));
    };
    const count = (text: string): number => {
      if (text === "") invalid();
      const big = BigInt(text);
      if (big > BigInt(Number.MAX_SAFE_INTEGER)) invalid();
      return Number(big);
    };
    this.skipWhitespace();
    const min = count(this.digits());
    this.skipWhitespace();
    let max: number | undefined;
    const ch = this._input[this._position];
    if (ch === ",") {
      this._position++;
      this.skipWhitespace();
      const next = this._input[this._position];
      if (next === "}") {
        this._position++;
        max = undefined;
      } else if (next !== undefined && isDigit(next)) {
        max = count(this.digits());
        this.skipWhitespace();
        if (this._input[this._position] !== "}") invalid();
        this._position++;
      } else {
        invalid();
      }
    } else if (ch === "}") {
      this._position++;
      max = min;
    } else {
      invalid();
    }
    let reluctance: Reluctance = Reluctance.Greedy;
    if (this._input[this._position] === "?") {
      this._position++;
      reluctance = Reluctance.Lazy;
    } else if (this._input[this._position] === "+") {
      this._position++;
      reluctance = Reluctance.Possessive;
    }
    if (max !== undefined && min > max) {
      throw EnvelopePatternError.invalidRange(span(start, this._position));
    }
    return max === undefined
      ? Quantifier.atLeast(min, reluctance)
      : Quantifier.between(min, max, reluctance);
  }
}
