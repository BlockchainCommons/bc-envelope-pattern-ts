/**
 * The recursive-descent parser over the lexer's tokens: `or` > `traverse`
 * > `not` > `and` > primary, with groups, captures, `search` and the
 * structure forms. A text the envelope grammar rejects is read once more
 * as a dCBOR pattern over the subject.
 */
import { CborDate, Tag } from "@blockchaincommons/dcbor";
import { tryParseDcborItemPartial } from "@blockchaincommons/dcbor-parse";
import { Digest } from "@blockchaincommons/components";
import { UR, decodeURWith } from "@blockchaincommons/uniform-resources";
import {
  Quantifier,
  Reluctance,
  any as dcborAny,
  tryParsePattern as tryParseDcborPattern,
} from "@blockchaincommons/dcbor-pattern";
import * as D from "@blockchaincommons/dcbor-pattern/patterns";
import { type Span, span as makeSpan, EnvelopePatternError } from "../error";
import { Lexer, type SpannedToken } from "./token";
import { type Pattern, leafPattern } from "../pattern/types";
import {
  any,
  anyArray,
  anyAssertion,
  anyBool,
  anyByteString,
  anyCbor,
  anyDate,
  anyKnownValue,
  anyNode,
  anyNumber,
  anyObject,
  anyPredicate,
  anySubject,
  anyTag,
  anyText,
  and,
  arrayWithCount,
  arrayWithRange,
  assertionWithObject,
  assertionWithPredicate,
  bool,
  byteString,
  byteStringBinaryRegex,
  capture,
  cborPattern,
  cborValue,
  compressed,
  date,
  dateEarliest,
  dateLatest,
  dateRange,
  dateRegex,
  digest,
  digestPrefix,
  elided,
  encrypted,
  knownValue,
  knownValueNamed,
  knownValueRegex,
  leaf,
  notMatching,
  nodeWithAssertionsRange,
  nullValue,
  number,
  numberGreaterThan,
  numberGreaterThanOrEqual,
  numberLessThan,
  numberLessThanOrEqual,
  numberNaN,
  numberRange,
  object,
  obscured,
  or,
  predicate,
  repeat,
  search,
  subject,
  text,
  textRegex,
  tagged,
  taggedRegex,
  traverse,
  unwrap,
  unwrapMatching,
  wrapped,
} from "../pattern/constructors";
import { convertDcborPatternToEnvelopePattern } from "../pattern/dcbor-integration";

const fail = (error: EnvelopePatternError): never => {
  throw error;
};

/** `UnexpectedToken` for `token` at `span`, quoting its source text. */
const unexpected = (input: string, t: SpannedToken): EnvelopePatternError => {
  const textOf = input.slice(t.span.start, t.span.end);
  return EnvelopePatternError.unexpectedToken(
    t.token.type,
    textOf === "" ? t.token.type : textOf,
    t.span,
  );
};

const skipWs = (src: string, pos: number): number => {
  while (pos < src.length && " \t\n\r\f".includes(src[pos])) pos++;
  return pos;
};

const U64_MAX = (1n << 64n) - 1n;

/** Parses the pattern text a `Lexer` produces; `maxDepth` bounds the nesting when given. */
class Parser {
  private readonly lexer: Lexer;
  private readonly maxDepth: number | undefined;
  private depth = 0;

  constructor(input: string, maxDepth: number | undefined) {
    this.lexer = new Lexer(input);
    this.maxDepth = maxDepth;
  }

  /** Enters a nesting level at `at`, or throws `NestingTooDeep` past a `maxDepth`. */
  private enter(at: Span): void {
    this.depth++;
    if (this.maxDepth !== undefined && this.depth > this.maxDepth) {
      fail(EnvelopePatternError.nestingTooDeep(this.maxDepth, at));
    }
  }

  private leave(): void {
    this.depth--;
  }

  private next(): SpannedToken | undefined {
    return this.lexer.next();
  }

  /** The next token without consuming it; `undefined` at the end or where the lexer would throw. */
  private peek(): SpannedToken | undefined {
    return this.lexer.peekQuiet();
  }

  private expectClose(): void {
    const t = this.next();
    if (t === undefined) fail(EnvelopePatternError.expectedCloseParen(this.lexer.span()));
    else if (t.token.type !== "ParenClose") fail(unexpected(this.lexer.input(), t));
  }

  /** `( pattern )` after a keyword, or nothing. */
  private optionalArgument(): Pattern | undefined {
    if (this.peek()?.token.type !== "ParenOpen") return undefined;
    const open = this.next();
    if (open === undefined) return undefined;
    this.enter(open.span);
    const inner = this.parseOr();
    this.expectClose();
    this.leave();
    return inner;
  }

  /** `( pattern )` that must follow a keyword. */
  private requiredArgument(): Pattern {
    const t = this.next();
    if (t === undefined) return fail(EnvelopePatternError.unexpectedEndOfInput());
    if (t.token.type !== "ParenOpen") return fail(unexpected(this.lexer.input(), t));
    this.enter(t.span);
    const inner = this.parseOr();
    this.expectClose();
    this.leave();
    return inner;
  }

  /** Nothing but whitespace may remain after the pattern. */
  finish(): void {
    const rest = this.next();
    if (rest !== undefined) fail(EnvelopePatternError.extraData(rest.span));
  }

  /** `a | b | …`. */
  parseOr(): Pattern {
    const patterns = [this.parseTraverse()];
    while (this.peek()?.token.type === "Or") {
      this.next();
      patterns.push(this.parseTraverse());
    }
    return patterns.length === 1 ? patterns[0] : or(...patterns);
  }

  /** `a -> b -> …`. */
  private parseTraverse(): Pattern {
    const patterns = [this.parseNot()];
    while (this.peek()?.token.type === "Traverse") {
      this.next();
      patterns.push(this.parseNot());
    }
    return patterns.length === 1 ? patterns[0] : traverse(...patterns);
  }

  /** `!p`, right-associative. */
  private parseNot(): Pattern {
    const t = this.peek();
    if (t?.token.type === "Not") {
      this.next();
      this.enter(t.span);
      const inner = this.parseNot();
      this.leave();
      return notMatching(inner);
    }
    return this.parseAnd();
  }

  /** `a & b & …`. */
  private parseAnd(): Pattern {
    const patterns = [this.parsePrimary()];
    while (this.peek()?.token.type === "And") {
      this.next();
      patterns.push(this.parsePrimary());
    }
    return patterns.length === 1 ? patterns[0] : and(...patterns);
  }

  private parsePrimary(): Pattern {
    const t = this.next();
    if (t === undefined) return fail(EnvelopePatternError.unexpectedEndOfInput());
    const { token } = t;
    switch (token.type) {
      case "Search":
        return this.parseSearch(t);
      case "Node":
        return this.parseNode();
      case "Assertion":
        return anyAssertion();
      case "AssertionPred":
        return assertionWithPredicate(this.requiredArgument());
      case "AssertionObj":
        return assertionWithObject(this.requiredArgument());
      case "Digest":
        return this.parseDigest();
      case "Obj": {
        const inner = this.optionalArgument();
        return inner === undefined ? anyObject() : object(inner);
      }
      case "Obscured":
        return obscured();
      case "Elided":
        return elided();
      case "Encrypted":
        return encrypted();
      case "Compressed":
        return compressed();
      case "Pred": {
        const inner = this.optionalArgument();
        return inner === undefined ? anyPredicate() : predicate(inner);
      }
      case "Wrapped":
        return wrapped();
      case "Unwrap": {
        const inner = this.optionalArgument();
        return inner === undefined ? unwrap() : unwrapMatching(inner);
      }
      case "Subject": {
        const inner = this.optionalArgument();
        return inner === undefined ? anySubject() : subject(inner);
      }
      case "GroupName":
        return this.parseCapture(token.name, t);
      case "ParenOpen":
        return this.parseGroup(t);
      case "Leaf":
        return leaf();
      case "Cbor":
        return this.parseCbor();
      case "RepeatZeroOrMore":
        return any();
      case "BoolKeyword":
        return anyBool();
      case "BoolTrue":
        return bool(true);
      case "BoolFalse":
        return bool(false);
      case "NumberKeyword":
        return anyNumber();
      case "TextKeyword":
        return anyText();
      case "StringLiteral":
        return text(token.value);
      case "Integer":
      case "Float":
        return this.parseNumberRangeOrValue(token.value);
      case "GreaterThanOrEqual":
        return numberGreaterThanOrEqual(this.parseNumberOperand());
      case "LessThanOrEqual":
        return numberLessThanOrEqual(this.parseNumberOperand());
      case "GreaterThan":
        return numberGreaterThan(this.parseNumberOperand());
      case "LessThan":
        return numberLessThan(this.parseNumberOperand());
      case "NaN":
        return numberNaN();
      case "Infinity":
        return number(Infinity);
      case "NegativeInfinity":
        return number(-Infinity);
      case "Regex":
        return textRegex(this.checkRegex(token.pattern, "text", t.span));
      case "BracketOpen":
        return this.parseArray(t);
      case "ByteString":
        return anyByteString();
      case "HexPattern":
        return byteString(token.bytes);
      case "HexBinaryRegex":
        return byteStringBinaryRegex(this.checkRegex(token.pattern, "bytes", t.span));
      case "DateKeyword":
        return anyDate();
      case "DatePattern":
        return this.parseDateContent(token.content, t.span);
      case "Tagged":
        return this.parseTagged();
      case "Known":
        return anyKnownValue();
      case "SingleQuotedPattern": {
        const value = parseU64(token.content);
        return value === undefined ? knownValueNamed(token.content) : knownValue(value);
      }
      case "SingleQuotedRegex":
        return knownValueRegex(this.checkRegex(token.pattern, "text", t.span));
      case "Null":
        return nullValue();
      default:
        return fail(unexpected(this.lexer.input(), t));
    }
  }

  /** The regex source, once the dialect accepts it for `mode`. */
  private checkRegex(source: string, mode: "text" | "bytes", at: Span): string {
    try {
      if (mode === "text") D.textPatternRegex(source);
      else D.byteStringPatternBinaryRegex(source);
      return source;
    } catch {
      return fail(EnvelopePatternError.invalidRegex(at));
    }
  }

  private parseNumberOperand(): number {
    const t = this.next();
    if (t === undefined) return fail(EnvelopePatternError.unexpectedEndOfInput());
    if (t.token.type !== "Integer" && t.token.type !== "Float") {
      return fail(unexpected(this.lexer.input(), t));
    }
    return t.token.value;
  }

  /** `n`, or `n...m`. */
  private parseNumberRangeOrValue(first: number): Pattern {
    if (this.peek()?.token.type !== "Ellipsis") return number(first);
    this.next();
    return numberRange(first, this.parseNumberOperand());
  }

  private parseSearch(at: SpannedToken): Pattern {
    const t = this.next();
    if (t === undefined) return fail(EnvelopePatternError.unexpectedEndOfInput());
    if (t.token.type !== "ParenOpen") return fail(unexpected(this.lexer.input(), t));
    this.enter(at.span);
    const inner = this.parseOr();
    this.expectClose();
    this.leave();
    return search(inner);
  }

  private parseCapture(name: string, at: SpannedToken): Pattern {
    const t = this.next();
    if (t === undefined) return fail(EnvelopePatternError.unexpectedEndOfInput());
    if (t.token.type !== "ParenOpen") return fail(unexpected(this.lexer.input(), t));
    this.enter(at.span);
    const inner = this.parseOr();
    this.expectClose();
    this.leave();
    return capture(name, inner);
  }

  /** `( pattern )` with an optional quantifier; a bare group is its content. */
  private parseGroup(at: SpannedToken): Pattern {
    this.enter(at.span);
    const inner = this.parseOr();
    this.expectClose();
    this.leave();
    const q = this.peek();
    if (q === undefined) return inner;
    let quantifier: Quantifier | undefined;
    switch (q.token.type) {
      case "RepeatZeroOrMore":
        quantifier = Quantifier.zeroOrMore(Reluctance.Greedy);
        break;
      case "RepeatZeroOrMoreLazy":
        quantifier = Quantifier.zeroOrMore(Reluctance.Lazy);
        break;
      case "RepeatZeroOrMorePossessive":
        quantifier = Quantifier.zeroOrMore(Reluctance.Possessive);
        break;
      case "RepeatOneOrMore":
        quantifier = Quantifier.oneOrMore(Reluctance.Greedy);
        break;
      case "RepeatOneOrMoreLazy":
        quantifier = Quantifier.oneOrMore(Reluctance.Lazy);
        break;
      case "RepeatOneOrMorePossessive":
        quantifier = Quantifier.oneOrMore(Reluctance.Possessive);
        break;
      case "RepeatZeroOrOne":
        quantifier = Quantifier.zeroOrOne(Reluctance.Greedy);
        break;
      case "RepeatZeroOrOneLazy":
        quantifier = Quantifier.zeroOrOne(Reluctance.Lazy);
        break;
      case "RepeatZeroOrOnePossessive":
        quantifier = Quantifier.zeroOrOne(Reluctance.Possessive);
        break;
      case "Range":
        if (q.token.quantifier === undefined) {
          this.next();
          return fail(q.token.error ?? EnvelopePatternError.invalidRange(q.span));
        }
        quantifier = q.token.quantifier;
        break;
      default:
        return inner;
    }
    this.next();
    return repeat(inner, quantifier);
  }

  /** `node`, or `node({n,m})`. */
  private parseNode(): Pattern {
    if (this.peek()?.token.type !== "ParenOpen") return anyNode();
    this.next();
    const t = this.next();
    if (t === undefined) return fail(EnvelopePatternError.unexpectedEndOfInput());
    if (t.token.type !== "Range") return fail(unexpected(this.lexer.input(), t));
    const q = t.token.quantifier;
    if (q === undefined) return fail(t.token.error ?? EnvelopePatternError.invalidRange(t.span));
    const pattern = nodeWithAssertionsRange(q.min, q.max);
    this.expectClose();
    return pattern;
  }

  /** `digest(hex)` or `digest(ur:digest/…)`; the parenthesis is required. */
  private parseDigest(): Pattern {
    const t = this.next();
    if (t === undefined) return fail(EnvelopePatternError.unexpectedEndOfInput());
    if (t.token.type !== "ParenOpen") return fail(unexpected(this.lexer.input(), t));
    const src = this.lexer.remainder();
    const base = this.lexer.position();
    let pos = skipWs(src, 0);
    let pattern: Pattern;
    // an error points at the end of the body, as the reference reports it
    if (src.startsWith("ur:", pos)) {
      const start = pos;
      while (pos < src.length && src[pos] !== ")") pos++;
      const ur = src.slice(start, pos).trimEnd();
      try {
        pattern = digest(decodeURWith(UR.parse(ur), Digest.codec));
      } catch (e) {
        return fail(
          EnvelopePatternError.invalidUr(
            e instanceof Error ? e.message : String(e),
            makeSpan(base + pos, base + pos),
          ),
        );
      }
      pos = skipWs(src, pos);
    } else {
      const start = pos;
      while (pos < src.length && /[0-9a-fA-F]/.test(src[pos])) pos++;
      const hex = src.slice(start, pos);
      if (hex.length === 0 || hex.length % 2 !== 0 || hex.length / 2 > Digest.DIGEST_SIZE) {
        return fail(EnvelopePatternError.invalidHexString(makeSpan(base + pos, base + pos)));
      }
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
      pattern = digestPrefix(bytes);
      pos = skipWs(src, pos);
    }
    this.lexer.bump(pos);
    this.expectClose();
    return pattern;
  }

  /** `cbor`, `cbor(value)`, `cbor(ur:…)` or `cbor(/pattern/)`. */
  private parseCbor(): Pattern {
    if (this.peek()?.token.type !== "ParenOpen") return anyCbor();
    this.next();
    const src = this.lexer.remainder();
    const base = this.lexer.position();
    let pos = skipWs(src, 0);
    let pattern: Pattern;
    if (src[pos] === "/") {
      const start = pos + 1;
      pos++;
      let escape = false;
      let closed = false;
      while (pos < src.length) {
        const ch = src[pos++];
        if (escape) escape = false;
        else if (ch === "\\") escape = true;
        else if (ch === "/") {
          closed = true;
          break;
        }
      }
      if (!closed) {
        return fail(EnvelopePatternError.unterminatedRegex(makeSpan(base + start - 1, base + pos)));
      }
      const body = src.slice(start, pos - 1);
      const parsed = tryParseDcborPattern(body, { maxDepth: this.maxDepth });
      if (!parsed.ok) {
        return fail(EnvelopePatternError.invalidPattern(makeSpan(base + start, base + pos - 1)));
      }
      pattern = cborPattern(parsed.value);
      pos = skipWs(src, pos);
    } else {
      const parsed = tryParseDcborItemPartial(src.slice(pos));
      if (!parsed.ok) {
        return fail(EnvelopePatternError.invalidPattern(makeSpan(base + pos, base + src.length)));
      }
      pattern = cborValue(parsed.value.value);
      pos += parsed.value.length;
    }
    this.lexer.bump(pos);
    this.expectClose();
    return pattern;
  }

  /** `[*]`, `[{n,m}]`, or `[…]` read whole as a dCBOR array pattern. */
  private parseArray(at: SpannedToken): Pattern {
    const src = this.lexer.remainder();
    const base = this.lexer.position();
    let pos = skipWs(src, 0);
    let pattern: Pattern;
    if (src[pos] === "*") {
      pos = skipWs(src, pos + 1);
      pattern = anyArray();
    } else if (src[pos] === "{") {
      pos = skipWs(src, pos + 1);
      const from = pos;
      while (pos < src.length && /\d/.test(src[pos])) pos++;
      if (pos === from)
        return fail(EnvelopePatternError.invalidRange(makeSpan(base + pos, base + pos)));
      const first = Number(src.slice(from, pos));
      pos = skipWs(src, pos);
      if (pos >= src.length) return fail(EnvelopePatternError.unexpectedEndOfInput());
      if (src[pos] === "}") {
        pos = skipWs(src, pos + 1);
        pattern = arrayWithCount(first);
      } else if (src[pos] === ",") {
        pos = skipWs(src, pos + 1);
        if (pos >= src.length) return fail(EnvelopePatternError.unexpectedEndOfInput());
        if (src[pos] === "}") {
          pos = skipWs(src, pos + 1);
          pattern = arrayWithRange(first);
        } else if (/\d/.test(src[pos])) {
          const secondFrom = pos;
          while (pos < src.length && /\d/.test(src[pos])) pos++;
          const second = Number(src.slice(secondFrom, pos));
          pos = skipWs(src, pos);
          if (src[pos] !== "}") return fail(EnvelopePatternError.unexpectedEndOfInput());
          pos = skipWs(src, pos + 1);
          pattern = arrayWithRange(first, second);
        } else {
          return fail(EnvelopePatternError.invalidRange(makeSpan(base + pos, base + pos)));
        }
      } else {
        return fail(EnvelopePatternError.invalidRange(makeSpan(base + pos, base + pos)));
      }
    } else {
      // the whole remainder belongs to the array pattern, read as `[…]`; a
      // well-formed `[…]` therefore fails here (its own `]` is inside the
      // remainder) and parses through the whole-input dCBOR fallback
      const parsed = tryParseDcborPattern(`[${src.slice(pos)}]`, { maxDepth: this.maxDepth });
      if (!parsed.ok) {
        return fail(EnvelopePatternError.invalidPattern(makeSpan(base + pos, base + src.length)));
      }
      if (parsed.value.kind !== "Structure" || parsed.value.pattern.type !== "Array") {
        return fail(unexpected(this.lexer.input(), at));
      }
      pattern = leafPattern({ type: "Array", pattern: parsed.value.pattern.pattern });
      pos = src.length;
    }
    this.lexer.bump(pos);
    const close = this.next();
    if (close === undefined)
      return fail(EnvelopePatternError.expectedCloseBracket(this.lexer.span()));
    if (close.token.type !== "BracketClose") return fail(unexpected(this.lexer.input(), close));
    return pattern;
  }

  /** `date'…'` content: a regex, a range, or one date; an error spans the body between the quotes. */
  private parseDateContent(content: string, at: Span): Pattern {
    const body = makeSpan(at.start + "date'".length, at.end - 1);
    const invalid = (): never => fail(EnvelopePatternError.invalidDateFormat(body));
    const toDate = (s: string): CborDate => {
      try {
        return CborDate.fromString(s);
      } catch {
        return invalid();
      }
    };
    if (content.length >= 2 && content.startsWith("/") && content.endsWith("/")) {
      return dateRegex(this.checkRegex(content.slice(1, -1), "text", body));
    }
    if (content.includes("...")) {
      const parts = content.split("...");
      if (parts.length === 2) {
        const [start, end] = parts;
        if (start === "") return dateLatest(toDate(end));
        if (end === "") return dateEarliest(toDate(start));
        return dateRange(toDate(start), toDate(end));
      }
    }
    return date(toDate(content));
  }

  /** `tagged`, `tagged(x)`, `tagged(x, p)`: the body read as a dCBOR tagged pattern, else a bare tag. */
  private parseTagged(): Pattern {
    if (this.peek()?.token.type !== "ParenOpen") return anyTag();
    this.next();
    const src = this.lexer.remainder();
    const base = this.lexer.position();
    let depth = 0;
    let close = -1;
    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      if (ch === "(") depth++;
      else if (ch === ")") {
        if (depth === 0) {
          close = i;
          break;
        }
        depth--;
      }
    }
    if (close < 0) {
      return fail(
        EnvelopePatternError.expectedCloseParen(makeSpan(base + src.length, base + src.length)),
      );
    }
    const inner = src.slice(0, close);
    const parsed = tryParseDcborPattern(`tagged(${inner})`, { maxDepth: this.maxDepth });
    if (parsed.ok) {
      this.lexer.bump(close);
      const t = this.next();
      if (t === undefined) return fail(EnvelopePatternError.expectedCloseParen(this.lexer.span()));
      if (t.token.type !== "ParenClose") return fail(unexpected(this.lexer.input(), t));
      if (parsed.value.kind !== "Structure" || parsed.value.pattern.type !== "Tagged") {
        return fail(unexpected(this.lexer.input(), t));
      }
      return leafPattern({ type: "Tagged", pattern: parsed.value.pattern.pattern });
    }
    // `tagged(n)`, `tagged(name)`, `tagged(/re/)`: any content
    let pos = skipWs(src, 0);
    let pattern: Pattern;
    if (src[pos] === "/") {
      const start = pos + 1;
      let end = -1;
      let escape = false;
      for (let i = start; i < src.length; i++) {
        const ch = src[i];
        if (escape) escape = false;
        else if (ch === "\\") escape = true;
        else if (ch === "/") {
          end = i;
          break;
        }
      }
      if (end < 0)
        return fail(EnvelopePatternError.unterminatedRegex(makeSpan(base + pos, base + pos + 1)));
      const regexSource = src.slice(start, end);
      pattern = taggedRegex(
        this.checkRegex(regexSource, "text", makeSpan(base + pos, base + end + 1)),
        dcborAny(),
      );
      pos = skipWs(src, end + 1);
    } else {
      const start = pos;
      while (pos < src.length && !" \t\n\r\f)".includes(src[pos])) pos++;
      if (pos === start) return fail(EnvelopePatternError.unexpectedEndOfInput());
      const word = src.slice(start, pos);
      const value = parseU64(word);
      // any bare word names the tag
      pattern =
        value !== undefined
          ? tagged(Tag.from(value), dcborAny())
          : leafPattern({ type: "Tagged", pattern: D.taggedPatternWithName(word, dcborAny()) });
      pos = skipWs(src, pos);
    }
    this.lexer.bump(pos);
    const t = this.next();
    if (t === undefined) return fail(EnvelopePatternError.expectedCloseParen(this.lexer.span()));
    if (t.token.type !== "ParenClose") return fail(unexpected(this.lexer.input(), t));
    return pattern;
  }
}

/** An unsigned 64-bit integer: an optional `+`, then digits, within range. */
const parseU64 = (s: string): number | bigint | undefined => {
  if (!/^\+?\d+$/.test(s)) return undefined;
  const big = BigInt(s.startsWith("+") ? s.slice(1) : s);
  if (big > U64_MAX) return undefined;
  return big <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(big) : big;
};

/**
 * Parses `input` as a whole pattern: the envelope grammar first, then the
 * whole text as a dCBOR pattern over the subject.
 */
export const parseAll = (input: string, maxDepth?: number): Pattern => {
  const parser = new Parser(input, maxDepth);
  let pattern: Pattern;
  try {
    pattern = parser.parseOr();
  } catch (e) {
    if (!EnvelopePatternError.isEnvelopePatternError(e) || e.code === "NestingTooDeep") throw e;
    const fallback = tryParseDcborPattern(input, { maxDepth });
    if (fallback.ok) return convertDcborPatternToEnvelopePattern(fallback.value);
    throw e;
  }
  parser.finish();
  return pattern;
};
