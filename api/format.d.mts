import { n as Path } from "./path-CyiQSXnM.mjs";
import { Envelope } from "@blockchaincommons/envelope";
//#region src/format.d.ts
/** How each path element is rendered: a one-line summary, the envelope UR, or the digest UR. */
export type PathElementFormat = "summary" | "envelopeUR" | "digestUR";
/** Options for `formatPaths` and `formatPath`; every field has a default. */
export interface FormatPathsOptions {
  /** Named captures to list (sorted by name) before the paths. */
  readonly captures?: ReadonlyMap<string, readonly Path[]> | undefined;
  /** Indent each element by its depth (on by default). */
  readonly indent?: boolean | undefined;
  /** How each element is rendered (`"summary"` by default). */
  readonly elementFormat?: PathElementFormat | undefined;
  /** Truncate each summary to this many UTF-16 code units, with an ellipsis. */
  readonly maxLength?: number | undefined;
  /** Render only the last element of each path, unindented. */
  readonly lastElementOnly?: boolean | undefined;
}
/**
 * One line for a path element: its short digest and a summary of its
 * case (`NODE …`, `LEAF …`, `WRAPPED …`, `ASSERTION …`, `ELIDED`,
 * `KNOWN_VALUE 'name'`, `ENCRYPTED`, `COMPRESSED`). Known values resolve
 * their name through envelope's global format context.
 */
export declare function envelopeSummary(env: Envelope): string;
/**
 * One path: one element per line, indented by depth unless `indent` is
 * false; on one line for the UR formats.
 *
 * @throws {TypeError} If `path` is not an array of `Envelope`
 * @throws {RangeError} If an option is out of range
 */
export declare function formatPath(path: Path, options?: FormatPathsOptions): string;
/**
 * Match paths as text: each capture (sorted by name) as `@name` followed by
 * its paths indented, then every path.
 *
 * @throws {TypeError} If `paths` is not an array of paths of `Envelope`
 * @throws {RangeError} If an option is out of range
 */
export declare function formatPaths(paths: readonly Path[], options?: FormatPathsOptions): string;
//#endregion
//# sourceMappingURL=format.d.mts.map