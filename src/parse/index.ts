/**
 * Parsing pattern text: `parseEnvelopePattern` throws,
 * `tryParseEnvelopePattern` returns the error.
 */
import type { Pattern } from "../pattern/types";
import { type DcborResult, EnvelopePatternError } from "../error";
import { parseAll } from "./parser";

/** An optional limit on how deep a pattern may nest. */
export interface ParseOptions {
  /**
   * The deepest nesting of groups, captures, `search`, `!` and the structure
   * forms accepted (a positive integer). No limit by default: text nested a
   * few thousand levels deep then exhausts the engine's stack with a
   * `RangeError`. The limit also applies to the dCBOR patterns embedded in
   * `cbor(/…/)`, `[…]` and `tagged(…)`.
   */
  readonly maxDepth?: number | undefined;
}

const requireSource = (input: string): void => {
  if (typeof input !== "string") throw new TypeError("pattern source must be a string");
};

const resolveMaxDepth = (options: ParseOptions | undefined): number | undefined => {
  if (options !== undefined && (options === null || typeof options !== "object")) {
    throw new TypeError("options must be an object");
  }
  const maxDepth = options?.maxDepth;
  if (maxDepth === undefined) return undefined;
  if (typeof maxDepth !== "number" || !Number.isInteger(maxDepth) || maxDepth < 1) {
    throw new RangeError("maxDepth must be a positive integer");
  }
  return maxDepth;
};

/**
 * Parses a whole pattern string; whitespace may surround the pattern.
 *
 * @throws {EnvelopePatternError} If the string is not a pattern, has trailing input, or nests deeper than a given `maxDepth`
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
