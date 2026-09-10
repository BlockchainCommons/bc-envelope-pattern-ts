/**
 * Pattern constructors: one function per pattern form, composing into the
 * frozen `Pattern` union that `paths`, `matches` and `display` run.
 */
import { CborDate, type CborInput, Tag, cbor as toCbor } from "@blockchaincommons/dcbor";
import { Digest } from "@blockchaincommons/components";
import { KnownValue } from "@blockchaincommons/known-values";
import {
  Interval,
  Quantifier,
  type Pattern as DcborPattern,
  type RegexInput,
} from "@blockchaincommons/dcbor-pattern";
import * as D from "@blockchaincommons/dcbor-pattern/patterns";
import { type Pattern, leafPattern, metaPattern, structurePattern } from "./types";
import {
  requireBytes,
  requireNumber,
  requirePattern,
  requirePatterns,
  requireString,
} from "./guards";

const CAPTURE_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const TAG_NAME = /^[A-Za-z0-9_-]+$/;

const isDcborPattern = (value: unknown): value is DcborPattern =>
  typeof value === "object" &&
  value !== null &&
  "kind" in value &&
  (value.kind === "Value" || value.kind === "Structure" || value.kind === "Meta") &&
  "pattern" in value &&
  typeof value.pattern === "object" &&
  value.pattern !== null;

const requireDcborPattern = (value: unknown, what = "pattern"): DcborPattern => {
  if (!isDcborPattern(value)) throw new TypeError(`${what} must be a dCBOR Pattern`);
  return value;
};

const requireFiniteOrInfinite = (value: unknown, what: string): number => {
  if (Number.isNaN(requireNumber(value, what))) throw new RangeError(`${what} must not be NaN`);
  return value as number;
};

const requireCount = (value: unknown, what: string): number => {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new RangeError(`${what} must be a non-negative integer`);
  }
  return value;
};

// region: leaf patterns

/** `cbor`: matches any subject CBOR. */
export const anyCbor = (): Pattern => leafPattern({ type: "Cbor", pattern: { variant: "Any" } });

/** `cbor(value)`: matches a subject equal to `value`. */
export const cborValue = (value: CborInput): Pattern =>
  leafPattern({ type: "Cbor", pattern: Object.freeze({ variant: "Value", cbor: toCbor(value) }) });

/** `cbor(/pattern/)`: matches a subject whose CBOR matches the dCBOR pattern; the paths extend into it. */
export const cborPattern = (pattern: DcborPattern): Pattern =>
  leafPattern({
    type: "Cbor",
    pattern: Object.freeze({ variant: "Pattern", pattern: requireDcborPattern(pattern) }),
  });

/**
 * A subject equal to `value`, or a subject whose CBOR matches an embedded
 * dCBOR `pattern`.
 */
export function cbor(valueOrPattern: CborInput | DcborPattern): Pattern {
  return isDcborPattern(valueOrPattern) ? cborPattern(valueOrPattern) : cborValue(valueOrPattern);
}

/** `bool`: matches any boolean subject. */
export const anyBool = (): Pattern => leafPattern({ type: "Bool", pattern: D.boolPatternAny() });

/** `true` / `false`: matches that boolean subject. */
export const boolean = (value: boolean): Pattern => {
  if (typeof value !== "boolean") throw new TypeError("value must be a boolean");
  return leafPattern({ type: "Bool", pattern: D.boolPatternValue(value) });
};

/** `text`: matches any text subject. */
export const anyText = (): Pattern => leafPattern({ type: "Text", pattern: D.textPatternAny() });

/** `"string"`: matches that text subject. */
export const text = (value: string): Pattern =>
  leafPattern({ type: "Text", pattern: D.textPatternValue(requireString(value, "value")) });

/** `/regex/`: matches a text subject the regex matches. */
export const textRegex = (regex: RegexInput): Pattern =>
  leafPattern({ type: "Text", pattern: D.textPatternRegex(regex) });

/** `date`: matches any date subject. */
export const anyDate = (): Pattern => leafPattern({ type: "Date", pattern: D.datePatternAny() });

const requireDate = (value: unknown, what: string): CborDate => {
  if (!(value instanceof CborDate)) throw new TypeError(`${what} must be a CborDate`);
  return value;
};

/** `date'iso'`: matches that date subject. */
export const date = (value: CborDate): Pattern =>
  leafPattern({ type: "Date", pattern: D.datePatternValue(requireDate(value, "value")) });

/** `date'a...b'`: matches a date subject in the inclusive range. */
export const dateRange = (min: CborDate, max: CborDate): Pattern =>
  leafPattern({
    type: "Date",
    pattern: D.datePatternRange(requireDate(min, "min"), requireDate(max, "max")),
  });

/** `date'a...'`: matches a date subject on or after `value`. */
export const dateEarliest = (value: CborDate): Pattern =>
  leafPattern({ type: "Date", pattern: D.datePatternEarliest(requireDate(value, "value")) });

/** `date'...b'`: matches a date subject on or before `value`. */
export const dateLatest = (value: CborDate): Pattern =>
  leafPattern({ type: "Date", pattern: D.datePatternLatest(requireDate(value, "value")) });

/** A date subject matched by its ISO-8601 text. */
export const dateIso8601 = (value: string): Pattern => {
  requireString(value, "value");
  try {
    CborDate.fromString(value);
  } catch {
    throw new RangeError(`value is not an ISO-8601 date: ${value}`);
  }
  return leafPattern({ type: "Date", pattern: D.datePatternStringValue(value) });
};

/** `date'/regex/'`: matches a date subject whose ISO-8601 text the regex matches. */
export const dateRegex = (regex: RegexInput): Pattern =>
  leafPattern({ type: "Date", pattern: D.datePatternRegex(regex) });

/** `number`: matches any number subject. */
export const anyNumber = (): Pattern =>
  leafPattern({ type: "Number", pattern: D.numberPatternAny() });

/** A bare number: matches that number subject. */
export const number = (value: number): Pattern => {
  if (Number.isNaN(requireNumber(value, "value"))) {
    throw new RangeError("value must not be NaN; use numberNaN()");
  }
  return leafPattern({ type: "Number", pattern: D.numberPatternValue(value) });
};

/** `min...max`: matches a number subject in the inclusive range. */
export const numberRange = (min: number, max: number): Pattern => {
  requireFiniteOrInfinite(min, "min");
  requireFiniteOrInfinite(max, "max");
  if (min > max) throw new RangeError("min must not exceed max");
  return leafPattern({ type: "Number", pattern: D.numberPatternRange(min, max) });
};

/** `>value`. */
export const numberGreaterThan = (value: number): Pattern =>
  leafPattern({
    type: "Number",
    pattern: D.numberPatternGreaterThan(requireFiniteOrInfinite(value, "value")),
  });

/** `>=value`. */
export const numberGreaterThanOrEqual = (value: number): Pattern =>
  leafPattern({
    type: "Number",
    pattern: D.numberPatternGreaterThanOrEqual(requireFiniteOrInfinite(value, "value")),
  });

/** `<value`. */
export const numberLessThan = (value: number): Pattern =>
  leafPattern({
    type: "Number",
    pattern: D.numberPatternLessThan(requireFiniteOrInfinite(value, "value")),
  });

/** `<=value`. */
export const numberLessThanOrEqual = (value: number): Pattern =>
  leafPattern({
    type: "Number",
    pattern: D.numberPatternLessThanOrEqual(requireFiniteOrInfinite(value, "value")),
  });

/** `NaN`: matches a NaN subject. */
export const numberNaN = (): Pattern =>
  leafPattern({ type: "Number", pattern: D.numberPatternNaN() });

/** `bstr`: matches any byte-string subject. */
export const anyByteString = (): Pattern =>
  leafPattern({ type: "ByteString", pattern: D.byteStringPatternAny() });

/** `h'hex'`: matches that byte-string subject. */
export const byteString = (value: Uint8Array): Pattern =>
  leafPattern({
    type: "ByteString",
    pattern: D.byteStringPatternValue(requireBytes(value, "value")),
  });

/** `h'/regex/'`: matches a byte-string subject the byte regex matches. */
export const byteStringRegex = (regex: RegexInput): Pattern =>
  leafPattern({ type: "ByteString", pattern: D.byteStringPatternBinaryRegex(regex) });

/** `known`: matches any known-value subject. */
export const anyKnownValue = (): Pattern =>
  leafPattern({ type: "KnownValue", pattern: D.knownValuePatternAny() });

/** `'value'` / `'name'`: matches that known-value subject, given as a `KnownValue`, its number, or its name. */
export const knownValue = (value: KnownValue | number | bigint | string): Pattern => {
  if (typeof value === "string") return knownValueNamed(value);
  if (value instanceof KnownValue) {
    return leafPattern({ type: "KnownValue", pattern: D.knownValuePatternValue(value) });
  }
  if (typeof value !== "number" && typeof value !== "bigint") {
    throw new TypeError("value must be a KnownValue, a number, a bigint or a name");
  }
  return leafPattern({
    type: "KnownValue",
    pattern: D.knownValuePatternValue(KnownValue.from(value)),
  });
};

/** `'name'`: matches the known-value subject registered as `name`. */
export const knownValueNamed = (name: string): Pattern =>
  leafPattern({
    type: "KnownValue",
    pattern: D.knownValuePatternNamed(requireString(name, "name")),
  });

/** `'/regex/'`: matches a known-value subject whose name the regex matches. */
export const knownValueRegex = (regex: RegexInput): Pattern =>
  leafPattern({ type: "KnownValue", pattern: D.knownValuePatternRegex(regex) });

/** The known value `''` (unit). */
export const unit = (): Pattern => knownValue(0);

/** `array`: matches any array subject. */
export const anyArray = (): Pattern => leafPattern({ type: "Array", pattern: D.arrayPatternAny() });

/** `[{min,max}]`: matches an array subject with that many elements (unbounded without `max`). */
export const arrayWithRange = (min: number, max?: number): Pattern =>
  leafPattern({
    type: "Array",
    pattern: D.arrayPatternWithLengthInterval(
      new Interval(
        requireCount(min, "min"),
        max === undefined ? undefined : requireCount(max, "max"),
      ),
    ),
  });

/** `[{n}]`: matches an array subject with exactly `count` elements. */
export const arrayWithCount = (count: number): Pattern =>
  leafPattern({ type: "Array", pattern: D.arrayPatternWithLength(requireCount(count, "count")) });

/** `map`: matches any map subject. */
export const anyMap = (): Pattern => leafPattern({ type: "Map", pattern: D.mapPatternAny() });

/** `{{min,max}}`: matches a map subject with that many entries (unbounded without `max`). */
export const mapWithRange = (min: number, max?: number): Pattern =>
  leafPattern({
    type: "Map",
    pattern: D.mapPatternWithLengthInterval(
      new Interval(
        requireCount(min, "min"),
        max === undefined ? undefined : requireCount(max, "max"),
      ),
    ),
  });

/** `{{n}}`: matches a map subject with exactly `count` entries. */
export const mapWithCount = (count: number): Pattern =>
  leafPattern({ type: "Map", pattern: D.mapPatternWithLength(requireCount(count, "count")) });

/** `null`: matches a null subject. */
export const nullValue = (): Pattern => leafPattern({ type: "Null", pattern: D.nullPattern() });

/** `tagged`: matches any tagged subject. */
export const anyTagged = (): Pattern =>
  leafPattern({ type: "Tagged", pattern: D.taggedPatternAny() });

const isTag = (value: unknown): value is Tag =>
  typeof value === "object" &&
  value !== null &&
  "value" in value &&
  (typeof value.value === "number" || typeof value.value === "bigint");

const toTag = (tag: Tag | number | bigint): Tag => {
  if (isTag(tag)) return tag;
  if (typeof tag !== "number" && typeof tag !== "bigint") {
    throw new TypeError("tag must be a Tag, a number, a bigint or a name");
  }
  return Tag.from(tag);
};

/** `tagged(tag, p)`: matches a tagged subject with that tag (a `Tag`, its number, or its registered name) whose content matches the dCBOR pattern. */
export const tagged = (tag: Tag | number | bigint | string, pattern: DcborPattern): Pattern => {
  if (typeof tag === "string") return taggedName(tag, pattern);
  return leafPattern({
    type: "Tagged",
    pattern: D.taggedPatternWithTag(toTag(tag), requireDcborPattern(pattern)),
  });
};

/** `tagged(name, p)`: matches a tagged subject whose tag is registered as `name`. */
export const taggedName = (name: string, pattern: DcborPattern): Pattern => {
  if (!TAG_NAME.test(requireString(name, "name"))) {
    throw new RangeError(`tag name must be a bare word: ${JSON.stringify(name)}`);
  }
  return leafPattern({
    type: "Tagged",
    pattern: D.taggedPatternWithName(name, requireDcborPattern(pattern)),
  });
};

/** `tagged(/regex/, p)`: matches a tagged subject whose registered tag name the regex matches. */
export const taggedRegex = (regex: RegexInput, pattern: DcborPattern): Pattern =>
  leafPattern({
    type: "Tagged",
    pattern: D.taggedPatternWithRegex(regex, requireDcborPattern(pattern)),
  });

// endregion

// region: structure patterns

/** `leaf`: matches a leaf or known-value envelope. */
export const leaf = (): Pattern => structurePattern({ type: "Leaf" });

/** `assert`: matches every assertion of a node. */
export const anyAssertion = (): Pattern =>
  structurePattern({ type: "Assertions", pattern: { variant: "Any" } });

/** `assertpred(p)`: matches the assertions whose predicate matches `pattern`. */
export const assertionWithPredicate = (pattern: Pattern): Pattern =>
  structurePattern({
    type: "Assertions",
    pattern: Object.freeze({ variant: "WithPredicate", pattern: requirePattern(pattern) }),
  });

/** `assertobj(p)`: matches the assertions whose object matches `pattern`. */
export const assertionWithObject = (pattern: Pattern): Pattern =>
  structurePattern({
    type: "Assertions",
    pattern: Object.freeze({ variant: "WithObject", pattern: requirePattern(pattern) }),
  });

/** `subj`: matches the subject of any envelope. */
export const anySubject = (): Pattern =>
  structurePattern({ type: "Subject", pattern: { variant: "Any" } });

/** `subj(p)`: matches the subject when it matches `pattern`. */
export const subject = (pattern: Pattern): Pattern =>
  structurePattern({
    type: "Subject",
    pattern: Object.freeze({ variant: "Pattern", pattern: requirePattern(pattern) }),
  });

/** `pred`: matches the predicate of an assertion. */
export const anyPredicate = (): Pattern =>
  structurePattern({ type: "Predicate", pattern: { variant: "Any" } });

/** `pred(p)`: matches the predicate of an assertion when it matches `pattern`. */
export const predicate = (pattern: Pattern): Pattern =>
  structurePattern({
    type: "Predicate",
    pattern: Object.freeze({ variant: "Pattern", pattern: requirePattern(pattern) }),
  });

/** `obj`: matches the object of an assertion. */
export const anyObject = (): Pattern =>
  structurePattern({ type: "Object", pattern: { variant: "Any" } });

/** `obj(p)`: matches the object of an assertion when it matches `pattern`. */
export const object = (pattern: Pattern): Pattern =>
  structurePattern({
    type: "Object",
    pattern: Object.freeze({ variant: "Pattern", pattern: requirePattern(pattern) }),
  });

/** `digest(ur:digest/…)`: matches the envelope with that digest. */
export const digest = (value: Digest): Pattern => {
  if (!(value instanceof Digest)) throw new TypeError("value must be a Digest");
  return structurePattern({
    type: "Digest",
    pattern: Object.freeze({ variant: "Digest", digest: value }),
  });
};

/** `digest(hex)`: matches envelopes whose digest starts with `prefix` (at most 32 bytes). */
export const digestPrefix = (prefix: Uint8Array): Pattern => {
  if (requireBytes(prefix, "prefix").length > Digest.DIGEST_SIZE) {
    throw new RangeError(`a digest prefix is at most ${Digest.DIGEST_SIZE} bytes`);
  }
  return structurePattern({
    type: "Digest",
    pattern: Object.freeze({ variant: "Prefix", prefix: Uint8Array.from(prefix) }),
  });
};

/** `digest(/regex/)`: matches envelopes whose digest bytes the byte regex matches. */
export const digestBinaryRegex = (regex: RegexInput): Pattern => {
  const compiled = D.digestPatternBinaryRegex(regex);
  if (compiled.variant !== "BinaryRegex") throw new TypeError("regex must be a pattern regex");
  return structurePattern({
    type: "Digest",
    pattern: Object.freeze({ variant: "BinaryRegex", regex: compiled.regex }),
  });
};

/** `node`: matches any envelope with assertions. */
export const anyNode = (): Pattern =>
  structurePattern({ type: "Node", pattern: { variant: "Any" } });

/** `node({min,max})`: matches a node with that many assertions (unbounded without `max`). */
export const nodeWithAssertionsRange = (min: number, max?: number): Pattern =>
  structurePattern({
    type: "Node",
    pattern: Object.freeze({
      variant: "AssertionsInterval",
      interval: new Interval(
        requireCount(min, "min"),
        max === undefined ? undefined : requireCount(max, "max"),
      ),
    }),
  });

/** `node({n})`: matches a node with exactly `count` assertions. */
export const nodeWithAssertionsCount = (count: number): Pattern =>
  structurePattern({
    type: "Node",
    pattern: Object.freeze({
      variant: "AssertionsInterval",
      interval: Interval.exactly(requireCount(count, "count")),
    }),
  });

/** `obscured`: matches an elided, encrypted or compressed envelope. */
export const obscured = (): Pattern =>
  structurePattern({ type: "Obscured", pattern: { variant: "Any" } });

/** `elided`. */
export const elided = (): Pattern =>
  structurePattern({ type: "Obscured", pattern: { variant: "Elided" } });

/** `encrypted`. */
export const encrypted = (): Pattern =>
  structurePattern({ type: "Obscured", pattern: { variant: "Encrypted" } });

/** `compressed`. */
export const compressed = (): Pattern =>
  structurePattern({ type: "Obscured", pattern: { variant: "Compressed" } });

/** `wrapped`: matches an envelope whose subject is wrapped, without descending. */
export const wrapped = (): Pattern =>
  structurePattern({ type: "Wrapped", pattern: { variant: "Any" } });

/** `unwrap(p)`: matches a wrapped envelope and continues on its content, which must match `pattern`. */
export const unwrapMatching = (pattern: Pattern): Pattern =>
  structurePattern({
    type: "Wrapped",
    pattern: Object.freeze({ variant: "Unwrap", pattern: requirePattern(pattern) }),
  });

/** `unwrap` / `unwrap(p)`: the content of a wrapped envelope, matching `pattern` when given. */
export const unwrap = (pattern?: Pattern): Pattern => unwrapMatching(pattern ?? any());

// endregion

// region: meta patterns

/** `*`: matches any envelope. */
export const any = (): Pattern => metaPattern({ type: "Any" });

/**
 * `a & b & …`: matches when every operand matches, each continuing where the previous one ended.
 *
 * @throws {RangeError} If there is no operand
 */
export const and = (...patterns: Pattern[]): Pattern => {
  if (patterns.length === 0) throw new RangeError("and needs at least one operand");
  return metaPattern({
    type: "And",
    patterns: Object.freeze(requirePatterns(patterns, "and")),
  });
};

/**
 * `a | b | …`: matches when any operand matches; every matching alternative yields its paths.
 *
 * @throws {RangeError} If there is no operand
 */
export const or = (...patterns: Pattern[]): Pattern => {
  if (patterns.length === 0) throw new RangeError("or needs at least one operand");
  return metaPattern({ type: "Or", patterns: Object.freeze(requirePatterns(patterns, "or")) });
};

/** `!p`: matches when `pattern` does not. */
export const not = (pattern: Pattern): Pattern =>
  metaPattern({ type: "Not", pattern: requirePattern(pattern) });

/** `a -> b -> …`: each pattern matched from where the previous one ended; no pattern is `!*`. */
export const traverse = (...patterns: Pattern[]): Pattern => {
  if (patterns.length === 0) return not(any());
  return metaPattern({
    type: "Traverse",
    patterns: Object.freeze(requirePatterns(patterns, "traverse")),
  });
};

/** `search(p)`: matches at every node of the tree where `pattern` matches. */
export const search = (pattern: Pattern): Pattern =>
  metaPattern({ type: "Search", pattern: requirePattern(pattern) });

/** `(p){n,m}`: `pattern` repeated according to `quantifier`. */
export const repeat = (pattern: Pattern, quantifier: Quantifier): Pattern => {
  if (!(quantifier instanceof Quantifier)) throw new TypeError("quantifier must be a Quantifier");
  return metaPattern({ type: "Group", pattern: requirePattern(pattern), quantifier });
};

/** `(p){1}`: a group, which is a repeat of exactly one. */
export const group = (pattern: Pattern): Pattern => repeat(pattern, Quantifier.exactly(1));

/** `@name(p)`: matches as `pattern` and records the paths it matched under `name`. */
export const capture = (name: string, pattern: Pattern): Pattern => {
  if (!CAPTURE_NAME.test(requireString(name, "name"))) {
    throw new RangeError(`capture name must be an identifier: ${JSON.stringify(name)}`);
  }
  return metaPattern({ type: "Capture", name, pattern: requirePattern(pattern) });
};

// endregion
