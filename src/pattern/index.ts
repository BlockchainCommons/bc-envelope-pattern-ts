/**
 * The `Pattern` union and the operations over it: `paths`, `matches`,
 * `display`, `pathsWithCaptures`, `patternEquals`.
 */
import type { Envelope } from "@blockchaincommons/envelope";
import type { Pattern } from "./types";
import { type MatchResult, type Path } from "./path";
import { leafPatternDisplay, leafPatternEquals } from "./leaf";
import { structurePatternDisplay, structurePatternEquals } from "./structure";
import { metaPatternDisplay, metaPatternEquals } from "./meta";
import { vmPaths, vmPathsWithCaptures } from "./vm";
import { requireEnvelope, requirePattern } from "./guards";

export type {
  Pattern,
  LeafPattern,
  StructurePattern,
  MetaPattern,
  CborPattern,
  AssertionsPattern,
  DigestPattern,
  NodePattern,
  ObjectPattern,
  ObscuredPattern,
  PredicatePattern,
  SubjectPattern,
  WrappedPattern,
} from "./types";
export type { Path, MatchResult } from "./path";

/**
 * Every path in `haystack` the pattern matches.
 *
 * @throws {TypeError} If `pattern` is not a `Pattern` or `haystack` is not an `Envelope`
 */
export const paths = (pattern: Pattern, haystack: Envelope): Path[] =>
  vmPaths(requirePattern(pattern), requireEnvelope(haystack));

/**
 * Whether the pattern matches `haystack`.
 *
 * @throws {TypeError} If `pattern` is not a `Pattern` or `haystack` is not an `Envelope`
 */
export const matches = (pattern: Pattern, haystack: Envelope): boolean =>
  paths(pattern, haystack).length > 0;

const displayOf = (pattern: Pattern): string => {
  switch (pattern.kind) {
    case "Leaf":
      return leafPatternDisplay(pattern.pattern);
    case "Structure":
      return structurePatternDisplay(pattern.pattern, displayOf);
    case "Meta":
      return metaPatternDisplay(pattern.pattern, displayOf);
  }
};

/**
 * The canonical text of the pattern.
 *
 * @throws {TypeError} If `pattern` is not a `Pattern`
 */
export const display = (pattern: Pattern): string => displayOf(requirePattern(pattern));

/**
 * Every path the pattern matches in `haystack`, with the paths each capture
 * name matched; the result and its arrays are frozen.
 *
 * @throws {TypeError} If `pattern` is not a `Pattern` or `haystack` is not an `Envelope`
 */
export const pathsWithCaptures = (pattern: Pattern, haystack: Envelope): MatchResult => {
  const [found, captures] = vmPathsWithCaptures(requirePattern(pattern), requireEnvelope(haystack));
  const frozen = new Map<string, readonly Path[]>();
  for (const [name, list] of captures)
    frozen.set(name, Object.freeze(list.map((p) => Object.freeze(p))));
  return Object.freeze({
    paths: Object.freeze(found.map((p) => Object.freeze(p))),
    captures: frozen,
  });
};

const equalsOf = (a: Pattern, b: Pattern): boolean => {
  if (a === b) return true;
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case "Leaf":
      return leafPatternEquals(a.pattern, (b as typeof a).pattern);
    case "Structure":
      return structurePatternEquals(a.pattern, (b as typeof a).pattern, equalsOf);
    case "Meta":
      return metaPatternEquals(a.pattern, (b as typeof a).pattern, equalsOf);
  }
};

/**
 * Whether two patterns are the same pattern: the same kinds, values, regex
 * sources and sub-patterns.
 *
 * @throws {TypeError} If either argument is not a `Pattern`
 */
export const patternEquals = (a: Pattern, b: Pattern): boolean =>
  equalsOf(requirePattern(a, "a"), requirePattern(b, "b"));
