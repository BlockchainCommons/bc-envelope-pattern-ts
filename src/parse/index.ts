/**
 * Parsing pattern text: `parseEnvelopePattern` throws,
 * `tryParseEnvelopePattern` returns the error.
 */
import type { Pattern } from "../pattern/types";
import { type DcborResult, EnvelopePatternError } from "../error";
import { DEFAULT_MAX_DEPTH, parseAll } from "./parser";

/** How deep a pattern may nest; the field has a default. */
export interface ParseOptions {
  /** The deepest nesting of groups, captures, `search`, `!` and the structure forms accepted (a positive integer), 500 by default. */
  readonly maxDepth?: number | undefined;
}

const requireSource = (input: string): void => {
  if (typeof input !== "string") throw new TypeError("pattern source must be a string");
};

const resolveMaxDepth = (options: ParseOptions | undefined): number => {
  if (options !== undefined && (options === null || typeof options !== "object")) {
    throw new TypeError("options must be an object");
  }
  const maxDepth = options?.maxDepth;
  if (maxDepth === undefined) return DEFAULT_MAX_DEPTH;
  if (typeof maxDepth !== "number" || !Number.isInteger(maxDepth) || maxDepth < 1) {
    throw new RangeError("maxDepth must be a positive integer");
  }
  return maxDepth;
};

/**
 * Parses a whole pattern string; whitespace may surround the pattern.
 *
 * @throws {EnvelopePatternError} If the string is not a pattern, has trailing input, or nests deeper than `maxDepth`
 * @throws {TypeError} If `input` is not a string
 * @throws {RangeError} If `maxDepth` is not a positive integer
 */
export function parseEnvelopePattern(input: string, options?: ParseOptions): Pattern {
  requireSource(input);
  return parseAll(input, resolveMaxDepth(options));
}

/** `parseEnvelopePattern` with the error returned instead of thrown; a `TypeError` or `RangeError` still throws. */
export function tryParseEnvelopePattern(
  input: string,
  options?: ParseOptions,
): DcborResult<Pattern, EnvelopePatternError> {
  try {
    return { ok: true, value: parseEnvelopePattern(input, options) };
  } catch (e) {
    if (EnvelopePatternError.isEnvelopePatternError(e)) return { ok: false, error: e };
    throw e;
  }
}
