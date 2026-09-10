/**
 * Formatting match paths as text: each element on its own line as a short
 * digest and a one-line summary, or as an envelope UR or a digest UR, with
 * the captures listed first.
 *
 * Subpath entry `@blockchaincommons/envelope-pattern/format`.
 *
 * @packageDocumentation
 */
import { Envelope } from "@blockchaincommons/envelope";
import { formatFlat, shortId, summary as summaryOf } from "@blockchaincommons/envelope/format";
import type { Path } from "./pattern/path";

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

interface Resolved {
  readonly indent: boolean;
  readonly elementFormat: PathElementFormat;
  readonly maxLength: number | undefined;
  readonly lastElementOnly: boolean;
}

const ELEMENT_FORMATS: readonly PathElementFormat[] = ["summary", "envelopeUR", "digestUR"];

const resolve = (o: FormatPathsOptions): Resolved => {
  if (typeof o !== "object" || o === null) throw new TypeError("options must be an object");
  const elementFormat = o.elementFormat ?? "summary";
  if (!ELEMENT_FORMATS.includes(elementFormat)) {
    throw new RangeError(`elementFormat must be one of ${ELEMENT_FORMATS.join(", ")}`);
  }
  const maxLength = o.maxLength;
  if (maxLength !== undefined && (!Number.isInteger(maxLength) || maxLength < 0)) {
    throw new RangeError("maxLength must be a non-negative integer");
  }
  if (o.captures !== undefined && !(o.captures instanceof Map)) {
    throw new TypeError("captures must be a Map");
  }
  return {
    indent: o.indent ?? true,
    elementFormat,
    maxLength,
    lastElementOnly: o.lastElementOnly ?? false,
  };
};

const requirePath = (path: unknown, what: string): void => {
  if (!Array.isArray(path) || !path.every((e) => e instanceof Envelope)) {
    throw new TypeError(`${what} must be an array of Envelope`);
  }
};

const requirePaths = (paths: unknown, what: string): void => {
  if (!Array.isArray(paths)) throw new TypeError(`${what} must be an array of paths`);
  for (const path of paths) requirePath(path, what);
};

/**
 * One line for a path element: its short digest and a summary of its
 * case (`NODE …`, `LEAF …`, `WRAPPED …`, `ASSERTION …`, `ELIDED`,
 * `KNOWN_VALUE 'name'`, `ENCRYPTED`, `COMPRESSED`). Known values resolve
 * their name through envelope's global format context.
 */
export function envelopeSummary(env: Envelope): string {
  if (!(env instanceof Envelope)) throw new TypeError("env must be an Envelope");
  const id = shortId(env, "short");
  const c = env.case;
  let text: string;
  switch (c.type) {
    case "node":
      text = `NODE ${formatFlat(env)}`;
      break;
    case "leaf":
      text = `LEAF ${summaryOf(env, { maxLength: Number.MAX_SAFE_INTEGER })}`;
      break;
    case "wrapped":
      text = `WRAPPED ${formatFlat(env)}`;
      break;
    case "assertion":
      text = `ASSERTION ${formatFlat(env)}`;
      break;
    case "elided":
      text = "ELIDED";
      break;
    case "knownValue":
      text = `KNOWN_VALUE ${summaryOf(env)}`;
      break;
    case "encrypted":
      text = "ENCRYPTED";
      break;
    case "compressed":
      text = "COMPRESSED";
      break;
  }
  return `${id} ${text}`;
}

const truncate = (s: string, maxLength: number | undefined): string => {
  if (maxLength === undefined || s.length <= maxLength) return s;
  return maxLength > 1 ? `${s.slice(0, maxLength - 1)}…` : "…";
};

const element = (e: Envelope, opts: Resolved): string => {
  switch (opts.elementFormat) {
    case "summary":
      return truncate(envelopeSummary(e), opts.maxLength);
    case "envelopeUR":
      return e.toUR().toString();
    case "digestUR":
      return e.digest().toUR().toString();
  }
};

const formatPathWith = (path: Path, opts: Resolved): string => {
  if (opts.lastElementOnly) {
    const last = path[path.length - 1];
    return last === undefined ? "" : element(last, opts);
  }
  if (opts.elementFormat === "summary") {
    return path
      .map((e, index) => `${opts.indent ? " ".repeat(index * 4) : ""}${element(e, opts)}`)
      .join("\n");
  }
  return path.map((e) => element(e, opts)).join(" ");
};

/**
 * One path: one element per line, indented by depth unless `indent` is
 * false; on one line for the UR formats.
 *
 * @throws {TypeError} If `path` is not an array of `Envelope`
 * @throws {RangeError} If an option is out of range
 */
export function formatPath(path: Path, options: FormatPathsOptions = {}): string {
  requirePath(path, "path");
  return formatPathWith(path, resolve(options));
}

/**
 * Match paths as text: each capture (sorted by name) as `@name` followed by
 * its paths indented, then every path.
 *
 * @throws {TypeError} If `paths` is not an array of paths of `Envelope`
 * @throws {RangeError} If an option is out of range
 */
export function formatPaths(paths: readonly Path[], options: FormatPathsOptions = {}): string {
  requirePaths(paths, "paths");
  const opts = resolve(options);
  const captures = options.captures ?? new Map<string, readonly Path[]>();
  const result: string[] = [];
  for (const name of [...captures.keys()].sort()) {
    const capturePaths = captures.get(name);
    if (capturePaths === undefined) continue;
    requirePaths(capturePaths, `captures[${name}]`);
    result.push(`@${name}`);
    for (const path of capturePaths) {
      for (const line of formatPathWith(path, opts).split("\n")) {
        if (line.length > 0) result.push(`    ${line}`);
      }
    }
  }
  if (opts.elementFormat === "summary") {
    for (const path of paths) {
      for (const line of formatPathWith(path, opts).split("\n")) {
        if (line.length > 0) result.push(line);
      }
    }
  } else if (paths.length > 0) {
    const joined = paths.map((path) => formatPathWith(path, opts)).join(" ");
    if (joined.length > 0) result.push(joined);
  }
  return result.join("\n");
}
