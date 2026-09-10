/**
 * Meta patterns: the combinators. Their matching is the VM's; this module
 * holds their display and equality.
 */
import type { MetaPattern, Pattern } from "./types";

/** The canonical text of a meta pattern. */
export const metaPatternDisplay = (
  pattern: MetaPattern,
  display: (p: Pattern) => string,
): string => {
  switch (pattern.type) {
    case "Any":
      return "*";
    case "And":
      return pattern.patterns.map(display).join(" & ");
    case "Or":
      return pattern.patterns.map(display).join(" | ");
    case "Not":
      return `!${display(pattern.pattern)}`;
    case "Search":
      return `search(${display(pattern.pattern)})`;
    case "Traverse":
      return pattern.patterns.map(display).join(" -> ");
    case "Group":
      return `(${display(pattern.pattern)})${pattern.quantifier.toString()}`;
    case "Capture":
      return `@${pattern.name}(${display(pattern.pattern)})`;
  }
};

const allEqual = (
  a: readonly Pattern[],
  b: readonly Pattern[],
  equals: (p: Pattern, q: Pattern) => boolean,
): boolean => a.length === b.length && a.every((p, i) => equals(p, b[i]));

/** Whether two meta patterns are the same pattern. */
export const metaPatternEquals = (
  a: MetaPattern,
  b: MetaPattern,
  equals: (p: Pattern, q: Pattern) => boolean,
): boolean => {
  if (a.type !== b.type) return false;
  switch (a.type) {
    case "Any":
      return true;
    case "And":
    case "Or":
    case "Traverse":
      return allEqual(a.patterns, (b as typeof a).patterns, equals);
    case "Not":
    case "Search":
      return equals(a.pattern, (b as typeof a).pattern);
    case "Group": {
      const other = b as typeof a;
      return a.quantifier.equals(other.quantifier) && equals(a.pattern, other.pattern);
    }
    case "Capture": {
      const other = b as typeof a;
      return a.name === other.name && equals(a.pattern, other.pattern);
    }
  }
};
