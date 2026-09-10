/**
 * Vector recipes: pattern text to parse and display, a pattern matched
 * against an envelope haystack (given as its tagged CBOR hex), the boolean
 * `matches`, a match formatted, or a JavaScript-only domain case by name.
 * `materialize` runs a recipe through a `VectorApi` and returns one outcome
 * string, so the same recipe drives the golden file, the differential and
 * the Rust harness.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { DOMAIN_CASES } from "../corpus/domain-cases";

export interface FormatOpts {
  indent?: boolean;
  element?: "summary" | "envelopeUR" | "digestUR";
  maxLength?: number;
  lastElementOnly?: boolean;
}
export type Recipe =
  | { k: "parse"; src: string }
  | { k: "match"; pattern: string; hex: string }
  | { k: "matches"; pattern: string; hex: string }
  | { k: "format"; pattern: string; hex: string; opts?: FormatOpts }
  | { k: "domain"; name: string };
export type Outcome = string;

/** A match: paths as arrays of element digests (hex), captures by name. */
export interface Match {
  paths: string[][];
  captures: [string, string[][]][];
}

export interface VectorApi {
  /** Parses and returns the canonical display, or throws. */
  display(src: string): string;
  match(pattern: string, haystack: Uint8Array): Match;
  matches(pattern: string, haystack: Uint8Array): boolean;
  format(pattern: string, haystack: Uint8Array, opts: FormatOpts): string;
  /** A JavaScript-only domain case by name; `undefined` where the surface cannot run it. */
  domain?(name: string): string;
  /** `Variant`, `Variant(TokenType)`, with `@start-end` when the error has a span. */
  errorCode(e: unknown): string | undefined;
}

export const hex = (u: Uint8Array): string => Buffer.from(u).toString("hex");
export const unhex = (h: string): Uint8Array => Uint8Array.from(Buffer.from(h, "hex"));

export function recipeName(r: Recipe): string {
  if (r.k === "parse") return `parse ${JSON.stringify(r.src).slice(0, 60)}`;
  if (r.k === "domain") return `domain ${r.name}`;
  const opts = r.k === "format" && r.opts !== undefined ? ` ${JSON.stringify(r.opts)}` : "";
  return `${r.k} ${JSON.stringify(r.pattern).slice(0, 40)} on ${r.hex.slice(0, 16)}${opts}`;
}

const renderPaths = (paths: string[][]): string => paths.map((p) => p.join(",")).join("|");

export function materialize(api: VectorApi, r: Recipe): Outcome {
  try {
    switch (r.k) {
      case "parse":
        return api.display(r.src);
      case "match": {
        const m = api.match(r.pattern, unhex(r.hex));
        const caps = [...m.captures]
          .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
          .map(([name, paths]) => `${name}=[${renderPaths(paths)}]`)
          .join(";");
        return `paths=[${renderPaths(m.paths)}]${caps === "" ? "" : ` captures{${caps}}`}`;
      }
      case "matches":
        return String(api.matches(r.pattern, unhex(r.hex)));
      case "format":
        return api.format(r.pattern, unhex(r.hex), r.opts ?? {});
      case "domain":
        return api.domain?.(r.name) ?? "unsupported";
    }
  } catch (e) {
    return `throw:${api.errorCode(e) ?? (e as Error).message}`;
  }
}

const describeError = (err: any): string => {
  if (err === undefined || err === null || typeof err !== "object") return String(err);
  const type: string = err.type ?? err.code ?? "?";
  const token = err.token?.type !== undefined ? `(${err.token.type})` : "";
  const span = err.span ?? err.details?.span;
  return `${type}${token}${span !== undefined ? `@${span.start}-${span.end}` : ""}`;
};

class ResultError extends Error {
  constructor(readonly inner: unknown) {
    super("result error");
  }
}

const digests = (paths: any[][]): string[][] => paths.map((p) => p.map((e) => e.digest().toHex()));

/** Pre-redesign surface: `Result` objects, builder-style format options, the frozen envelope. */
export function baselineAdapterFor(m: any): VectorApi {
  const parse = (src: string): any => {
    const r = m.parse(src);
    if (!r.ok) throw new ResultError(r.error);
    return r.value;
  };
  const opts = (o: FormatOpts): any => {
    let b = m.formatPathsOpts();
    if (o.indent !== undefined) b = b.indent(o.indent);
    if (o.element === "envelopeUR") b = b.elementFormat(m.envelopeURFormat());
    else if (o.element === "digestUR") b = b.elementFormat(m.digestURFormat());
    else if (o.maxLength !== undefined) b = b.elementFormat(m.summaryFormat(o.maxLength));
    if (o.lastElementOnly !== undefined) b = b.lastElementOnly(o.lastElementOnly);
    return b.build();
  };
  return {
    display: (src) => m.patternToString(parse(src)),
    match: (pattern, haystack) => {
      const [paths, captures] = m.patternPathsWithCaptures(
        parse(pattern),
        m.envelopeFromBytes(haystack),
      );
      return {
        paths: digests(paths),
        captures: [...captures].map(([n, p]: [string, any[][]]) => [n, digests(p)]),
      };
    },
    matches: (pattern, haystack) =>
      m.patternMatches(parse(pattern), m.envelopeFromBytes(haystack)) as boolean,
    format: (pattern, haystack, o) => {
      const [paths, captures] = m.patternPathsWithCaptures(
        parse(pattern),
        m.envelopeFromBytes(haystack),
      );
      return m.formatPathsWithCapturesOpt(paths, captures, opts(o));
    },
    errorCode: (e) => (e instanceof ResultError ? describeError(e.inner) : undefined),
  };
}

export interface CurrentDeps {
  envelopeFromBytes: (bytes: Uint8Array) => unknown;
}

/**
 * The current surface: throwing `parseEnvelopePattern`, `display`,
 * `pathsWithCaptures`, `formatPaths(paths, { captures, ...opts })`, and the
 * domain cases over the module itself.
 */
export function adapterFor(m: any, deps: CurrentDeps): VectorApi {
  return {
    display: (src) => m.display(m.parseEnvelopePattern(src)),
    matches: (pattern, haystack) =>
      m.matches(m.parseEnvelopePattern(pattern), deps.envelopeFromBytes(haystack)) as boolean,
    domain: (name) => {
      const c = DOMAIN_CASES[name];
      return c === undefined ? "unsupported" : c(m);
    },
    match: (pattern, haystack) => {
      const r = m.pathsWithCaptures(
        m.parseEnvelopePattern(pattern),
        deps.envelopeFromBytes(haystack),
      );
      return {
        paths: digests(r.paths),
        captures: [...r.captures].map(([n, p]: [string, any[][]]) => [n, digests(p)]),
      };
    },
    format: (pattern, haystack, o) => {
      const r = m.pathsWithCaptures(
        m.parseEnvelopePattern(pattern),
        deps.envelopeFromBytes(haystack),
      );
      return m.formatPaths(r.paths, {
        captures: r.captures,
        indent: o.indent,
        element: o.element,
        elementFormat: o.element,
        maxLength: o.maxLength,
        lastElementOnly: o.lastElementOnly,
      });
    },
    errorCode: (e) => {
      const x: any = e;
      if (x?.name !== "EnvelopePatternError") return undefined;
      return describeError({
        type: x.code,
        token: x.details?.kind !== undefined ? { type: x.details.kind } : x.details?.token,
        span: x.span ?? x.details?.span,
      });
    },
  };
}
