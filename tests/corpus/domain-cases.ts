/**
 * JavaScript-only domain rows: calls a Rust caller cannot make (wrong
 * argument types, values outside the type's domain, engine limits) and the
 * runtime shapes (frozen objects, error messages). Each case runs against a
 * module `m` (the root and `/format` surfaces merged) and returns one
 * outcome string, so the golden file records what happens today and the
 * harness counts the rows as `js-only`.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Envelope } from "@blockchaincommons/envelope";
import { CborDate, cbor } from "@blockchaincommons/dcbor";

type Api = any;

const describeError = (e: unknown): string => {
  if (typeof e !== "object" || e === null) return String(e);
  const err = e as { name?: string; code?: string; details?: any; span?: any; message?: string };
  if (err.name === "EnvelopePatternError") {
    const span = err.span ?? err.details?.span;
    const kind = err.details?.kind ?? err.details?.token?.type;
    return `${err.code}${kind !== undefined ? `(${kind})` : ""}${span !== undefined ? `@${span.start}-${span.end}` : ""}`;
  }
  return err.name ?? "Error";
};

const outcome = (f: () => unknown): string => {
  try {
    const v = f();
    if (v === undefined) return "undefined";
    if (typeof v === "string") return v;
    return JSON.stringify(v);
  } catch (e) {
    return `throw:${describeError(e)}`;
  }
};

const shortPaths = (r: {
  paths: readonly (readonly Envelope[])[];
  captures: Map<string, readonly (readonly Envelope[])[]>;
}): string => {
  const short = (p: readonly Envelope[]): string =>
    p.map((e) => e.digest().toHex().slice(0, 8)).join(",");
  const caps = [...r.captures.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([n, ps]) => `${n}=[${ps.map(short).join("|")}]`)
    .join(";");
  return `paths=[${r.paths.map(short).join("|")}]${caps === "" ? "" : ` captures{${caps}}`}`;
};

const alice = (): Envelope =>
  Envelope.from("Alice").addAssertion("knows", "Bob").addAssertion("knows", "Carol");

/** Every domain case by name. */
export const DOMAIN_CASES: Record<string, (m: Api) => string> = {
  "parse-undefined": (m) => outcome(() => m.parseEnvelopePattern(undefined)),
  "parse-number": (m) => outcome(() => m.parseEnvelopePattern(123)),
  "try-parse-undefined": (m) => outcome(() => m.tryParseEnvelopePattern(undefined)),
  "paths-haystack-undefined": (m) => outcome(() => m.paths(m.parseEnvelopePattern("*"), undefined)),
  "paths-haystack-plain-object": (m) => outcome(() => m.paths(m.parseEnvelopePattern("*"), {})),
  "paths-haystack-string": (m) => outcome(() => m.paths(m.parseEnvelopePattern("*"), "text")),
  "paths-haystack-cbor": (m) => outcome(() => m.paths(m.parseEnvelopePattern("*"), cbor(1))),
  "matches-pattern-undefined": (m) => outcome(() => m.matches(undefined, alice())),
  "matches-pattern-plain-object": (m) => outcome(() => m.matches({}, alice())),
  "display-undefined": (m) => outcome(() => m.display(undefined)),
  "display-plain-object": (m) => outcome(() => m.display({})),
  "frozen-pattern": (m) => outcome(() => Object.isFrozen(m.parseEnvelopePattern("subj(text)"))),
  "frozen-pattern-inner": (m) =>
    outcome(() => Object.isFrozen(m.parseEnvelopePattern("subj(text)").pattern)),
  "frozen-error-codes": (m) => outcome(() => Object.isFrozen(m.EnvelopePatternErrorCode)),
  "frozen-reluctance": (m) => outcome(() => Object.isFrozen(m.Reluctance)),
  "frozen-result": (m) =>
    outcome(() => Object.isFrozen(m.pathsWithCaptures(m.parseEnvelopePattern("*"), alice()))),
  "frozen-result-paths": (m) =>
    outcome(() => Object.isFrozen(m.pathsWithCaptures(m.parseEnvelopePattern("*"), alice()).paths)),
  "frozen-error-details": (m) =>
    outcome(() => {
      const r = m.tryParseEnvelopePattern("(");
      return Object.isFrozen(r.error.details);
    }),
  "mutate-paths": (m) =>
    outcome(() => {
      const ps = m.paths(m.parseEnvelopePattern("*"), alice());
      ps.push(alice());
      return ps.length;
    }),
  "capture-name-space": (m) => outcome(() => m.display(m.capture("a b", m.any()))),
  "capture-name-empty": (m) => outcome(() => m.display(m.capture("", m.any()))),
  "and-empty": (m) => outcome(() => m.display(m.and())),
  "or-empty": (m) => outcome(() => m.display(m.or())),
  "traverse-empty": (m) => outcome(() => m.display(m.traverse())),
  "number-string": (m) => outcome(() => m.display(m.number("x"))),
  "number-nan": (m) => outcome(() => m.display(m.number(NaN))),
  "number-negative-zero": (m) => outcome(() => m.display(m.number(-0))),
  "number-1e21": (m) => outcome(() => m.display(m.number(1e21))),
  "number-2^60": (m) => outcome(() => m.display(m.number(2 ** 60))),
  "number-range-inverted": (m) => outcome(() => m.display(m.numberRange(3, 1))),
  "text-number": (m) => outcome(() => m.display(m.text(42))),
  "text-regex-string": (m) => outcome(() => m.display(m.textRegex("x"))),
  "text-regex-global": (m) => outcome(() => m.display(m.textRegex(/x/g))),
  "text-regex-i": (m) => outcome(() => m.display(m.textRegex(/X/i))),
  "date-string": (m) => outcome(() => m.display(m.date("nope"))),
  "date-js-date": (m) => outcome(() => m.display(m.date(new Date(0)))),
  "date-cbor-date": (m) => outcome(() => m.display(m.date(CborDate.fromString("2023-06-15")))),
  "known-value-number": (m) => outcome(() => m.display(m.knownValue(1))),
  "known-value-string": (m) => outcome(() => m.display(m.knownValue("isA"))),
  "tagged-number": (m) =>
    outcome(() => m.display(m.tagged(100, m.anyNumber ? m.anyNumber() : m.any()))),
  "tagged-string": (m) => outcome(() => m.display(m.tagged("date", m.any()))),
  "digest-prefix-string": (m) => outcome(() => m.display(m.digestPrefix("zz"))),
  "digest-prefix-33-bytes": (m) => outcome(() => m.display(m.digestPrefix(new Uint8Array(33)))),
  "digest-string": (m) => outcome(() => m.display(m.digest("abc"))),
  "repeat-object-quantifier": (m) =>
    outcome(() => m.display(m.repeat(m.any(), { min: 3, max: 1 }))),
  "repeat-quantifier": (m) => outcome(() => m.display(m.repeat(m.any(), m.Quantifier.from(2, 5)))),
  "quantifier-inverted": (m) => outcome(() => String(m.Quantifier.from(2, 1))),
  "interval-inverted": (m) => outcome(() => String(m.Interval.from(3, 1))),
  "cbor-kind-object": (m) => outcome(() => m.display(m.cbor({ kind: "x" }))),
  "format-paths-undefined": (m) => outcome(() => m.formatPaths(undefined)),
  "format-element-bogus": (m) =>
    outcome(() =>
      m.formatPaths(m.paths(m.parseEnvelopePattern("*"), alice()), {
        element: "bogus",
        elementFormat: "bogus",
      }),
    ),
  "format-max-length-negative": (m) =>
    outcome(() => m.formatPaths(m.paths(m.parseEnvelopePattern("*"), alice()), { maxLength: -1 })),
  "format-max-length-fraction": (m) =>
    outcome(() => m.formatPaths(m.paths(m.parseEnvelopePattern("*"), alice()), { maxLength: 1.5 })),
  "nest-400-parens": (m) =>
    outcome(
      () => m.display(m.parseEnvelopePattern("(".repeat(400) + "*" + ")".repeat(400))).length,
    ),
  "nest-501-parens": (m) =>
    outcome(
      () => m.display(m.parseEnvelopePattern("(".repeat(501) + "*" + ")".repeat(501))).length,
    ),
  "nest-501-search": (m) =>
    outcome(
      () => m.display(m.parseEnvelopePattern("search(".repeat(501) + "*" + ")".repeat(501))).length,
    ),
  "nest-501-not": (m) =>
    outcome(() => m.display(m.parseEnvelopePattern("!".repeat(501) + "*")).length),
  "nest-1000-parens": (m) =>
    outcome(
      () => m.display(m.parseEnvelopePattern("(".repeat(1000) + "*" + ")".repeat(1000))).length,
    ),
  "max-depth-option": (m) =>
    outcome(() => m.display(m.parseEnvelopePattern("((*))", { maxDepth: 1 }))),
  "max-depth-option-ok": (m) =>
    outcome(() => m.display(m.parseEnvelopePattern("((*))", { maxDepth: 2 }))),
  "max-depth-zero": (m) => outcome(() => m.display(m.parseEnvelopePattern("*", { maxDepth: 0 }))),
  "error-message": (m) =>
    outcome(() => {
      const r = m.tryParseEnvelopePattern("[1, 2");
      return r.error.message;
    }),
  "error-full-message": (m) =>
    outcome(() => {
      const r = m.tryParseEnvelopePattern("subj(text");
      return typeof r.error.fullMessage === "function"
        ? r.error.fullMessage("subj(text")
        : "no fullMessage";
    }),
  "error-own-keys": (m) =>
    outcome(() => {
      const r = m.tryParseEnvelopePattern("subj(text");
      return Object.keys(r.error).sort().join(",");
    }),
  "error-details": (m) =>
    outcome(() => {
      const r = m.tryParseEnvelopePattern("node foo");
      return JSON.stringify(r.error.details);
    }),
  "error-unexpected-token-details": (m) =>
    outcome(() => {
      const r = m.tryParseEnvelopePattern("cbor(1 2)");
      const d = r.error.details;
      return `${r.error.code}:${d.kind ?? d.token?.type}:${d.text ?? ""}`;
    }),
  "error-is": (m) =>
    outcome(() => {
      const r = m.tryParseEnvelopePattern("(");
      return typeof r.error.is === "function" ? r.error.is("ExpectedCloseParen") : "no is";
    }),
  "error-codes": (m) => outcome(() => Object.keys(m.EnvelopePatternErrorCode).join(",")),
  "error-constructor": (m) =>
    outcome(() => new m.EnvelopePatternError({ type: "EmptyInput" }).code),
  "prefix-text-foo": (m) =>
    outcome(() =>
      m.parseEnvelopePatternPrefix === undefined
        ? "absent"
        : m.parseEnvelopePatternPrefix("text foo").length,
    ),
  "prefix-text-paren": (m) =>
    outcome(() =>
      m.parseEnvelopePatternPrefix === undefined
        ? "absent"
        : m.parseEnvelopePatternPrefix("text )").length,
    ),
  "prefix-map": (m) =>
    outcome(() =>
      m.parseEnvelopePatternPrefix === undefined
        ? "absent"
        : m.parseEnvelopePatternPrefix("map").length,
    ),
  exports: (m) =>
    outcome(() =>
      Object.keys(m)
        .filter((k) => !["formatPath", "formatPaths", "envelopeSummary"].includes(k))
        .sort()
        .join(","),
    ),
  "pattern-equals": (m) =>
    outcome(() =>
      typeof m.patternEquals === "function"
        ? m.patternEquals(
            m.parseEnvelopePattern("subj(text) & @a(*)"),
            m.parseEnvelopePattern("subj(text) & @a(*)"),
          )
        : "absent",
    ),
  "search-captures-shape": (m) =>
    outcome(() =>
      shortPaths(
        m.pathsWithCaptures(
          m.parseEnvelopePattern("search(@n(number))"),
          alice().addAssertion("age", 42),
        ),
      ),
    ),
};

export const DOMAIN_CASE_NAMES: readonly string[] = Object.keys(DOMAIN_CASES);
