/**
 * `Path`: the envelopes from the root down to a matched element.
 */
import type { Envelope } from "@blockchaincommons/envelope";

/** A match path: the root, then each element descended into, ending at the matched element. */
export type Path = readonly Envelope[];

/** What a match yields: the matched paths and, by name, the captured paths. */
export interface MatchResult {
  /** Every path the pattern matched, in match order. */
  readonly paths: readonly Path[];
  /** The paths each capture name matched, in match order. */
  readonly captures: ReadonlyMap<string, readonly Path[]>;
}

/** Whether two paths visit the same envelopes. */
export const pathEquals = (a: Path, b: Path): boolean =>
  a.length === b.length && a.every((e, i) => e.digest().equals(b[i].digest()));

/** A key that identifies a path by its digests. */
export const pathKey = (path: Path): string => path.map((e) => e.digest().toHex()).join(",");

/**
 * Appends every item of `items` to `target`. A match can yield more paths
 * than `target.push(...items)` can pass as call arguments (about 120 000 on
 * V8, where the spread throws `RangeError`), so the matcher appends in a loop.
 */
export const pushAll = <T>(target: T[], items: readonly T[]): void => {
  for (const item of items) target.push(item);
};
