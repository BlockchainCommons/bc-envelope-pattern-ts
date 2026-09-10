/**
 * The differential corpus and the golden subset: every known pattern string
 * parsed, matched against a fixed set of envelope haystacks, and formatted,
 * plus generated patterns × haystacks and the JavaScript-only domain rows.
 * Haystacks are built deterministically (seeded keys, fixed nonces and
 * salts) and carried as their tagged CBOR hex, so the frozen baseline and
 * the reference decode the same bytes.
 */
import { encodeCbor, CborDate, cbor, taggedValue, type CborInput } from "@blockchaincommons/dcbor";
import {
  ARID,
  Digest,
  Nonce,
  PrivateKeyBase,
  SymmetricKey,
  XID,
} from "@blockchaincommons/components";
import { IS_A, ISSUER, CONTROLLER, NOTE, DATE, UNIT } from "@blockchaincommons/known-values";
import { Envelope } from "@blockchaincommons/envelope";
import { sign } from "@blockchaincommons/envelope/signature";
import { SeededRng } from "@blockchaincommons/rand";
import { hex, unhex, type Recipe, type FormatOpts } from "../vectors/recipes";
import { PATTERNS } from "./patterns";
import { DOMAIN_CASE_NAMES } from "./domain-cases";

const H = (e: Envelope): string => hex(e.toCbor().toData());
const seed = (n: number): Uint8Array =>
  Uint8Array.from({ length: 32 }, (_, i) => (i * 7 + n) & 0xff);
const key = SymmetricKey.from(seed(1));

/** Envelope's `encryptSubject` with a fixed nonce (the AAD is the tagged digest). */
const encryptSubject = (e: Envelope, nonceByte: number): Envelope => {
  const subject = e.subject();
  const plaintext = encodeCbor(subject.toCbor());
  const aad = encodeCbor(subject.digest().toCbor());
  const message = key.encrypt(plaintext, {
    aad,
    nonce: Nonce.from(Uint8Array.from({ length: 12 }, () => nonceByte)),
  });
  const encrypted = Envelope.encrypted(message);
  return e.isNode() ? Envelope.node(encrypted, e.assertions()) : encrypted;
};

const alice = Envelope.from("Alice").addAssertion("knows", "Bob").addAssertion("knows", "Carol");
const nested = Envelope.from("root")
  .addAssertion("child", Envelope.from("leaf").addAssertion("grandchild", 42))
  .addAssertion(IS_A, "Thing");
const arid = ARID.from(unhex("4676635a6e6068c2ef3ffd8ff726dd401fd341036e920f136a1d8af5e829496d"));
const ed25519 = PrivateKeyBase.from(
  unhex("82f32c855d3d542256180810797e0073"),
).ed25519SigningPrivateKey();

/** The credential from the reference suite, Schnorr-signed with a seeded RNG. */
function credential(): Envelope {
  const inner = Envelope.from(arid)
    .addAssertion(IS_A, "Certificate of Completion")
    .addAssertion(ISSUER, "Example Electrical Engineering Board")
    .addAssertion(CONTROLLER, "Example Electrical Engineering Board")
    .addAssertion("firstName", "James")
    .addAssertion("lastName", "Maxwell")
    .addAssertion("issueDate", CborDate.fromString("2020-01-01"))
    .addAssertion("expirationDate", CborDate.fromString("2028-01-01"))
    .addAssertion("photo", "This is James Maxwell's photo.")
    .addAssertion("certificateNumber", "123-456-789")
    .addAssertion("subject", "RF and Microwave Engineering")
    .addAssertion("continuingEducationUnits", 1)
    .addAssertion("professionalDevelopmentHours", 15)
    .addAssertion("topics", Envelope.leaf(cbor(["Subject 1", "Subject 2"])));
  const schnorr = PrivateKeyBase.from(
    unhex("82f32c855d3d542256180810797e0073"),
  ).schnorrPrivateKeys().signingPrivateKey;
  return sign(inner, schnorr, {
    signing: { type: "Schnorr", rng: SeededRng.forTesting() },
  }).addAssertion(NOTE, "Signed by Example Electrical Engineering Board");
}

const leaf = (value: CborInput): Envelope => Envelope.leaf(cbor(value));
const isaNode = Envelope.from(IS_A).addAssertion("note", "n");
const thirteen = (): Envelope => {
  let e = Envelope.from("many");
  for (let i = 1; i <= 13; i++) e = e.addAssertion(`p${i}`, i);
  return e;
};
const chain = (n: number): Envelope => {
  let e = Envelope.from("end");
  for (let i = 0; i < n; i++) e = Envelope.from(`n${i}`).addAssertion("next", e);
  return e;
};
const wraps = (n: number): Envelope => {
  let e = Envelope.from("core");
  for (let i = 0; i < n; i++) e = Envelope.wrap(e);
  return e;
};
const nestedArray = (n: number): Envelope => {
  let v: CborInput = "needle";
  for (let i = 0; i < n; i++) v = [i, v];
  return leaf(v);
};
const bobAssertion = alice
  .assertions()
  .find((a) => a.expectObject().asText() === "Bob") as Envelope;

/** Haystacks as tagged CBOR hex; `HAYSTACK_NAMES` names them by index. */
export const NAMED_HAYSTACKS: readonly (readonly [string, Envelope])[] = [
  ["hello", Envelope.from("Hello")],
  ["empty-text", Envelope.from("")],
  ["e-acute", Envelope.from("é")],
  ["emoji", Envelope.from("😀")],
  ["needle", Envelope.from("needle")],
  ["42", Envelope.from(42)],
  ["-1", Envelope.from(-1)],
  ["1.5", Envelope.from(1.5)],
  ["0", Envelope.from(0)],
  ["2^53", leaf(2 ** 53)],
  ["2^60", leaf(1n << 60n)],
  ["2^64-1", leaf((1n << 64n) - 1n)],
  ["-2^53-1", leaf(-(2n ** 53n) - 1n)],
  ["NaN", leaf(NaN)],
  ["Infinity", leaf(Infinity)],
  ["-Infinity", leaf(-Infinity)],
  ["true", Envelope.from(true)],
  ["false", Envelope.from(false)],
  ["null", Envelope.from(null)],
  ["bytes-010203", Envelope.from(new Uint8Array([1, 2, 3]))],
  ["bytes-ff", Envelope.from(new Uint8Array([0xff]))],
  ["bytes-c3a9", Envelope.from(new Uint8Array([0xc3, 0xa9]))],
  ["date", Envelope.from(CborDate.fromString("2023-06-15"))],
  ["date-fraction", Envelope.from(CborDate.fromString("2023-06-15T12:30:00.5Z"))],
  ["date-negative", Envelope.from(CborDate.fromString("1969-12-31T23:59:59.5Z"))],
  ["isA", Envelope.from(IS_A)],
  ["unit", Envelope.UNIT],
  ["known-25", Envelope.knownValue(25)],
  ["known-706", Envelope.knownValue(706)],
  ["known-999999", Envelope.knownValue(999999)],
  ["arid", Envelope.from(arid)],
  ["digest", Envelope.from(Digest.fromImage(new Uint8Array([1])))],
  [
    "xid",
    Envelope.from(XID.fromHex("de2853684ae55803a08b36dd7f4e566649970601927330299fd333f33fecc037")),
  ],
  ["array-123", leaf([1, 2, 3])],
  ["array-111", leaf([1, 1, 1])],
  ["array-nested", leaf([[1, 2], { 1: [3] }])],
  ["array-needle", leaf([1, [2, [3, "needle"]]])],
  ["array-known", leaf([taggedValue(40000, cbor(1)), 2])],
  ["array-tagged", leaf([taggedValue(100, cbor("x")), CborDate.fromString("2023-06-15")])],
  ["map-ab", leaf({ a: 1, b: "two" })],
  ["map-nested", leaf({ a: [1, { b: 2 }] })],
  ["map-known", leaf(new Map<CborInput, CborInput>([[1, taggedValue(40000, cbor(1))]]))],
  ["map-12", leaf(new Map<CborInput, CborInput>([[1, 2]]))],
  ["tagged-text", Envelope.leaf(taggedValue(100, cbor("tagged")))],
  ["tagged-array", Envelope.leaf(taggedValue(100, cbor(["a", "b"])))],
  ["tagged-nested", Envelope.leaf(taggedValue(100, cbor([1, [2]])))],
  ["tagged-twice", Envelope.leaf(taggedValue(200, taggedValue(200, cbor("x"))))],
  ["alice", alice],
  ["nested", nested],
  ["node-array", leaf([1, 2, 3]).addAssertion("kind", "array")],
  ["node-map", leaf({ a: 1, b: "two" }).addAssertion("kind", "map")],
  ["node-tagged", Envelope.leaf(taggedValue(100, cbor([1, [2]]))).addAssertion("kind", "tagged")],
  ["node-isA", isaNode],
  [
    "node-unit-date",
    Envelope.from(UNIT).addAssertion(DATE, CborDate.fromString("2023-06-15T12:30:00Z")),
  ],
  ["node-typed", Envelope.from("x").addAssertion(IS_A, "Type").addAssertion(NOTE, "n")],
  ["node-thirteen", thirteen()],
  [
    "node-nested-object",
    Envelope.from("s").addAssertion("p", Envelope.from("o").addAssertion("q", 1)),
  ],
  ["wrapped-alice", Envelope.wrap(alice)],
  ["wrapped-twice", Envelope.wrap(Envelope.wrap("twice"))],
  ["wrapped-with-assertion", Envelope.wrap(alice).addAssertion("note", "n")],
  ["assertion", Envelope.assertion("knows", "Bob")],
  ["assertion-node-object", Envelope.assertion("knows", alice)],
  ["elided-assertion", alice.elide({ removing: [bobAssertion] })],
  ["elided-subject", alice.elide({ removing: [alice.subject()] })],
  ["elided-object", alice.elide({ removing: [bobAssertion.expectObject()] })],
  ["elided", alice.elide()],
  ["compressed-subject", alice.compressSubject()],
  ["compressed", Envelope.from("compress me, compress me, compress me").compress()],
  ["encrypted-subject", encryptSubject(alice, 7)],
  ["encrypted", encryptSubject(Envelope.from("secret"), 9)],
  [
    "salted",
    Envelope.from("salted").addAssertionEnvelope(
      Envelope.assertion("p", "o").addSalt({ salt: seed(3).slice(0, 8) }),
    ),
  ],
  ["signed", sign(alice, ed25519)],
  ["credential", credential()],
  // Twelve levels: a repeated search enumerates every descending run of nodes (2^n states).
  ["chain-12", chain(12)],
  ["wraps-20", wraps(20)],
  ["array-deep-50", nestedArray(50)],
];

export const HAYSTACK_NAMES: readonly string[] = NAMED_HAYSTACKS.map(([n]) => n);
export const HAYSTACKS: readonly string[] = NAMED_HAYSTACKS.map(([, e]) => H(e));
export const haystackHex = (name: string): string => {
  const i = HAYSTACK_NAMES.indexOf(name);
  if (i < 0) throw new Error(`no haystack ${name}`);
  return HAYSTACKS[i];
};

const FORMAT_OPTS: readonly FormatOpts[] = [
  {},
  { indent: false },
  { lastElementOnly: true },
  { maxLength: 12 },
  { element: "digestUR" },
  { element: "envelopeUR", lastElementOnly: true },
];

const xorshift = (seed: number): (() => number) => {
  let x = seed >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5;
    x >>>= 0;
    return x;
  };
};
const pick = <T>(next: () => number, xs: readonly T[]): T => xs[next() % xs.length];

/** Grammar-driven patterns to a given depth. */
function genPattern(next: () => number, depth: number): string {
  const leaves = [
    "*",
    "leaf",
    "node",
    "wrapped",
    "unwrap",
    "assert",
    "elided",
    "encrypted",
    "compressed",
    "obscured",
    "bool",
    "true",
    "null",
    "number",
    "42",
    "1...3",
    ">1",
    "text",
    '"Alice"',
    "/o/",
    "bstr",
    "date",
    "date'2023-06-15'",
    "known",
    "'isA'",
    "digest",
    "tagged",
    "tagged(100, *)",
    "tagged(100, text)",
    "array",
    "[*]",
    "[{2,}]",
    "map",
    '{"a": *}',
    "{{1,}}",
    "cbor",
    "cbor(42)",
    "cbor(/number/)",
    "cbor(/search(number)/)",
    "cbor(/search(@n(number))/)",
    "cbor(/{@k(*): @v(*)}/)",
    "unit",
    "subj(text)",
    "subj(node)",
    "pred(text)",
    "pred('isA')",
    "obj(text)",
    "obj(number)",
    "assertpred(text)",
    "assertobj(number)",
    "node({1})",
    "node({2,})",
  ];
  if (depth <= 0) return pick(next, leaves);
  switch (next() % 14) {
    case 0:
      return `${genPattern(next, depth - 1)} | ${genPattern(next, depth - 1)}`;
    case 1:
      return `${genPattern(next, depth - 1)} & ${genPattern(next, depth - 1)}`;
    case 2:
      return `!${genPattern(next, depth - 1)}`;
    case 3:
      return `(${genPattern(next, depth - 1)})`;
    case 4:
      return `@${pick(next, ["a", "b", "item", "x1"])}(${genPattern(next, depth - 1)})`;
    case 5:
      return `search(${genPattern(next, depth - 1)})`;
    case 6:
      return `${genPattern(next, depth - 1)} -> ${genPattern(next, depth - 1)}`;
    case 7:
      return `subj(${genPattern(next, depth - 1)})`;
    case 8:
      return `assertpred(${genPattern(next, depth - 1)})`;
    case 9:
      return `unwrap(${genPattern(next, depth - 1)})`;
    case 10:
      return `(${genPattern(next, depth - 1)})${pick(next, ["*", "+", "?", "{2}", "{1,3}", "{1}", "*?", "++"])}`;
    case 11:
      return `@${pick(next, ["a", "b"])}(${genPattern(next, depth - 1)}) & @${pick(next, ["c", "d"])}(${genPattern(next, depth - 1)})`;
    case 12:
      return `obj(${genPattern(next, depth - 1)})`;
    default:
      return pick(next, leaves);
  }
}

export function* hand(): Generator<Recipe> {
  for (const src of PATTERNS) yield { k: "parse", src };
  for (const pattern of PATTERNS) for (const hex of HAYSTACKS) yield { k: "match", pattern, hex };
  const formatPatterns = PATTERNS.filter((_, i) => i % 7 === 0);
  for (const pattern of formatPatterns)
    for (const hex of HAYSTACKS.filter((_, i) => i % 4 === 0))
      for (const opts of FORMAT_OPTS) yield { k: "format", pattern, hex, opts };
}

export function* generated(): Generator<Recipe> {
  const next = xorshift(0x9e3779b1);
  const patterns: string[] = [];
  for (let i = 0; i < 1500; i++) patterns.push(genPattern(next, 1 + (next() % 3)));
  for (const src of patterns) yield { k: "parse", src };
  for (const pattern of patterns) {
    for (let j = 0; j < 4; j++) yield { k: "match", pattern, hex: pick(next, HAYSTACKS) };
  }
  for (let i = 0; i < 40; i++) {
    const src = patterns[i * 13];
    for (let cut = 1; cut < src.length; cut++) yield { k: "parse", src: src.slice(0, cut) };
  }
}

export const categories: Record<string, () => Generator<Recipe>> = { hand, generated };

/** The haystacks the golden `match` subset runs over. */
export const GOLDEN_HAYSTACK_NAMES: readonly string[] = [
  "hello",
  "e-acute",
  "2^60",
  "date",
  "isA",
  "array-111",
  "array-needle",
  "array-known",
  "map-nested",
  "map-known",
  "tagged-text",
  "tagged-array",
  "alice",
  "nested",
  "node-isA",
  "node-unit-date",
  "node-thirteen",
  "wrapped-alice",
  "assertion",
  "elided-assertion",
  "encrypted-subject",
  "credential",
];

/**
 * The golden subset: parses of every pattern, matches on the golden
 * haystacks, `matches` on a quarter of them, the format calls, generated
 * patterns and every domain row.
 */
export function* goldenRecipes(): Generator<Recipe> {
  for (const src of PATTERNS) yield { k: "parse", src };
  const golden = GOLDEN_HAYSTACK_NAMES.map(haystackHex);
  for (const pattern of PATTERNS) for (const hex of golden) yield { k: "match", pattern, hex };
  for (const pattern of PATTERNS.filter((_, i) => i % 4 === 0))
    for (const hex of golden.filter((_, i) => i % 3 === 0)) yield { k: "matches", pattern, hex };
  for (const pattern of PATTERNS.filter((_, i) => i % 7 === 0))
    for (const hex of [haystackHex("nested"), haystackHex("node-isA"), haystackHex("credential")])
      for (const opts of FORMAT_OPTS) yield { k: "format", pattern, hex, opts };
  let i = 0;
  for (const r of generated()) {
    if (i++ >= 600) break;
    yield r;
  }
  for (const name of DOMAIN_CASE_NAMES) yield { k: "domain", name };
}
