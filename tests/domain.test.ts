/**
 * The frozen record of the behaviours this package's plan changes: every
 * verified gap, every JavaScript-only input, and the runtime shapes, each
 * rendered as one line and pinned by a snapshot. A line changes only when
 * the behaviour behind it does, and the change is reviewed with `vitest -u`.
 */
import { describe, it, expect } from "vitest";
import { Envelope } from "@blockchaincommons/envelope";
import { cbor, taggedValue, CborDate } from "@blockchaincommons/dcbor";
import { IS_A } from "@blockchaincommons/known-values";
import * as root from "../src";
import * as format from "../src/format";
import { DOMAIN_CASES } from "./corpus/domain-cases";

const m = { ...root, ...format };

const describeError = (e: unknown): string => {
  if (root.EnvelopePatternError.isEnvelopePatternError(e)) {
    const err = e as unknown as {
      code: string;
      details?: Record<string, unknown>;
      span?: { start: number; end: number };
    };
    const details = err.details ?? {};
    const span = (err.span ?? details["span"]) as { start: number; end: number } | undefined;
    const token = details["token"] as { type?: string } | undefined;
    const kind = (details["kind"] as string | undefined) ?? token?.type;
    return `${err.code}${kind !== undefined ? `(${kind})` : ""}${span !== undefined ? `@${span.start}-${span.end}` : ""}`;
  }
  return e instanceof Error ? e.name : String(e);
};

const outcome = (f: () => unknown): string => {
  try {
    const v = f();
    return typeof v === "string" ? v : (JSON.stringify(v) ?? "undefined");
  } catch (e) {
    return `throw:${describeError(e)}`;
  }
};

const short = (p: readonly Envelope[]): string =>
  p.map((e) => e.digest().toHex().slice(0, 8)).join(",");
const match = (pattern: string, haystack: Envelope): string =>
  outcome(() => {
    const r = root.pathsWithCaptures(root.parseEnvelopePattern(pattern), haystack);
    const caps = [...r.captures.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([n, ps]) => `${n}=[${ps.map(short).join("|")}]`)
      .join(";");
    return `paths=[${r.paths.map(short).join("|")}]${caps === "" ? "" : ` captures{${caps}}`}`;
  });
const display = (src: string): string =>
  outcome(() => root.display(root.parseEnvelopePattern(src)));
const parse = display;

const alice = Envelope.from("Alice").addAssertion("knows", "Bob").addAssertion("knows", "Carol");
const hello = Envelope.from("Hello");
const arr = Envelope.leaf(cbor([1, 2, 3]));
const arr111 = Envelope.leaf(cbor([1, 1, 1]));
const mapAb = Envelope.leaf(cbor({ a: 1, b: "two" }));
const mapNested = Envelope.leaf(cbor({ a: [1, { b: 2 }] }));
const tagged = Envelope.leaf(taggedValue(100, cbor("tagged")));
const taggedArr = Envelope.leaf(taggedValue(100, cbor(["a", "b"])));
const isa = Envelope.fromBytes(Envelope.from(IS_A).toCbor().toData());
const isaNode = Envelope.fromBytes(Envelope.from(IS_A).addAssertion("note", "n").toCbor().toData());
const wrappedAlice = Envelope.wrap(alice);
const big = Envelope.leaf(cbor(1n << 60n));
const unitDate = Envelope.from(0).addAssertion("date", CborDate.fromString("2023-06-15"));

const rows: Record<string, () => string> = {
  // conjunction, disjunction and groups
  "and captures": () => match("@a(text) & @b(*)", hello),
  "and captures on a node": () => match("@a(*) & @b(*)", alice),
  "and under search": () => match("search(@a(text) & @b(*))", alice),
  "and extends paths": () => match("cbor(/search(number)/) & *", arr),
  "and then number": () => match("cbor(/search(number)/) & number", arr),
  "any and search": () => match("* & cbor(/search(number)/)", arr),
  "and map captures": () => match("cbor(/{@k(*): @v(*)}/) & *", mapAb),
  "or multiplicity": () => match("* | *", hello),
  "or three": () => match("* | * | *", alice),
  "or captures": () => match("@a(*) | @b(*)", hello),
  "or capture inner": () => match("@x(text | *)", hello),
  "or under search": () => match("search(@a(*) | @b(*))", alice),
  "text or text": () => match("text | text", hello),
  "group one": () => match("(*){1}", hello),
  "group one one": () => match("(*){1,1}", alice),
  "bare group": () => match("(*)", hello),
  // map constraints
  "map display": () => display('{"a": 1}'),
  "map any display": () => display('{"a": *}'),
  "map capture display": () => display('{@k("a"): @v(*)}'),
  "map and map display": () => display('{"a": 1} & map'),
  "map matches nested": () => match('{"a": 1}', mapNested),
  "map matches ab": () => match('{"a": 1}', mapAb),
  "map capture": () => match('{"a": [@x(1)]}', mapNested),
  "map length display": () => display("{{1,2}}"),
  // the class-side compiler and traversal captures
  "search under subj": () => match("subj(search(@c(text)))", alice),
  "search under unwrap": () => match("unwrap(search(@c(text)))", wrappedAlice),
  "three-way or under subj": () => match('subj("a" | "b" | "Alice")', alice),
  "three-way or top": () => match('"a" | "b" | "Alice"', alice),
  "map captures then traverse": () => match("cbor(/{@k(*): @v(*)}/) -> *", mapAb),
  "array captures then traverse": () =>
    match("cbor(/[@a(*), @b(*)]/) -> *", Envelope.leaf(cbor([1, 2]))),
  "search captures then traverse": () => match("cbor(/search(@x(number))/) -> *", arr),
  "outer capture then traverse": () =>
    match("@y(cbor(/@x([*, *])/)) -> *", Envelope.leaf(cbor([1, 2]))),
  "capture under structure in search": () => match("search(subj(@c(text)))", alice),
  // tagged
  "tagged capture": () => match("tagged(100, @c(text))", tagged),
  "tagged search": () => match("tagged(100, search(text))", taggedArr),
  "tagged search then text": () => match("tagged(100, search(text)) -> text", taggedArr),
  "tagged array captures": () => match("tagged(100, [@a(*), @b(*)])", taggedArr),
  "cbor tagged capture": () => match("cbor(/tagged(100, @c(text))/)", tagged),
  // lexer and parser
  ...Object.fromEntries(
    [
      "text $",
      "-text",
      "obj(text $)",
      "1.",
      ".5",
      "$",
      "#",
      "}",
      "@",
      "@é(*)",
      "text -> $",
      "> =5",
      "@name-x(text)",
      "text ; text",
      "subj(text)x",
      "'/abc/x'",
      "-Infinityx",
      "nodes",
      "nodetext",
      "true1",
      "known1",
      "text123",
      "search(foo)",
      "node foo",
      "digest(abcd ef)",
      "1e3",
      "1E3",
      "1e-7",
      "1e21",
      "1e400",
      "1e5 -> text",
      "1e",
      "1.5e",
      "007",
      "-0.0",
      "0.0000001",
      "(text){99999999999999999999}",
      "node(1)",
      "node(5)",
      "cbor(1 2)",
      "tagged(1)",
      "tagged(date)",
      "tagged(/^a/)",
      "tagged(foo text)",
      "tagged(1",
      'tagged(1, ")")',
      "@(text)",
      "@(*)",
      "@1x(text)",
      "@1a(*)",
      "'+5'",
      "tagged(+1, *)",
      "date'2023-06-15 '",
      "cbor(/ number /)",
      "date'bogus'",
      "text | date'bogus'",
      "date'/[/'",
      "date'a...b...c'",
      "digest(abc)",
      "digest()",
      "digest(ur:digest/bad)",
      '"é"',
      '"😀"',
      "h'/é/'",
      "'/é/'",
      "date'/'",
      "//",
      "/(?i)a/",
      "/(?P<n>a)/",
      "/(?=a)/",
      "/(?<=a)b/",
      "/(a)\\1/",
      "/\\h/",
      "h'/(?-u)\\xff/'",
      "[1, 2] -> text",
      "unit",
      "traverse()",
      "digest",
      "[*]",
      "[1, 2]",
      "map",
      "{{2}}",
      "array",
    ].map((s) => [`parse ${s}`, (): string => parse(s)]),
  ),
  // big integers and known values
  "search 1 on isA": () => match("cbor(/search(1)/)", isa),
  "search number on isA": () => match("cbor(/search(number)/)", isa),
  "2^60 leaf": () => match("1152921504606846976", big),
  "capture on isA": () => match("cbor(/search(@x(number))/)", isa),
  "capture on isA node": () => match("cbor(/search(@x(number))/)", isaNode),
  "search duplicates": () => match("cbor(/search(number)/)", arr111),
  "non-ascii literal": () => match('"é"', Envelope.from("é")),
  // formatter
  "format known value": () =>
    outcome(() => format.formatPaths(root.paths(root.parseEnvelopePattern("subj"), isaNode))),
  "format unit date": () =>
    outcome(() =>
      format.formatPaths(root.paths(root.parseEnvelopePattern("search(known)"), unitDate)),
    ),
  "format truncated emoji": () =>
    outcome(() =>
      format.formatPaths(root.paths(root.parseEnvelopePattern("*"), Envelope.from("😀😀😀😀😀")), {
        maxLength: 12,
      }),
    ),
  // cbor(value) display
  "cbor nested display": () => display("cbor([[1, 2]])"),
  "cbor map display": () => display("cbor({1: [3]})"),
  "cbor date display": () => display("cbor(1(2023-06-15))"),
  // constructors
  "traverse empty": () => outcome(() => root.display(root.traverse())),
  "and empty": () => outcome(() => root.display(root.and())),
  "or empty": () => outcome(() => root.display(root.or())),
  "display empty object": () => outcome(() => root.display({} as unknown as root.Pattern)),
  // depth
  "depth 3000 parens": () =>
    outcome(
      () =>
        root.display(root.parseEnvelopePattern("(".repeat(3000) + "*" + ")".repeat(3000))).length,
    ),
  "depth 3000 search": () =>
    outcome(
      () =>
        root.display(root.parseEnvelopePattern("search(".repeat(3000) + "*" + ")".repeat(3000)))
          .length,
    ),
  // the JavaScript-only domain
  ...Object.fromEntries(
    Object.entries(DOMAIN_CASES).map(([k, f]) => [`domain ${k}`, (): string => f(m)]),
  ),
};

describe("golden: argument domain and edges", () => {
  it("every known divergence, every JS-only input, and the runtime shapes", () => {
    const lines = Object.entries(rows).map(([name, f]) => `${name} → ${f()}`);
    expect(lines).toMatchSnapshot();
  });
});
