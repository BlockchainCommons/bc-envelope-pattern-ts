# Gordian Envelope Pattern Matching

### _by Leonardo Custodio_

**`bc-envelope-pattern-ts`** matches, searches, and captures structure inside Gordian Envelopes using a declarative pattern language.

`@blockchaincommons/envelope-pattern` provides a pattern matching language for querying and extracting data from [Gordian Envelope](https://github.com/BlockchainCommons/bc-envelope-ts) structures. It extends the dCBOR pattern matching capabilities with envelope-specific patterns for subjects, predicates, objects, assertions, and wrapped envelopes.

The pattern language is designed to be expressive yet concise, allowing you to match complex nested envelope structures with simple pattern expressions.

## Installation Instructions

[@blockchaincommons/envelope-pattern](https://www.npmjs.com/package/@blockchaincommons/envelope-pattern) is published to npm. Install it with your package manager of choice:

```sh
npm install @blockchaincommons/envelope-pattern
# or
pnpm add @blockchaincommons/envelope-pattern
# or
yarn add @blockchaincommons/envelope-pattern
# or
bun add @blockchaincommons/envelope-pattern
```

## Usage Instructions

A pattern is text such as `search(assertpred("knows") -> obj(text))`, parsed
once into a frozen `Pattern` and run against an `Envelope`. A match yields
_paths_: each path is the list of envelopes from the root down to the
matched element.

Register the envelope tags first: digests then render as URs, and known
values by name, in every formatted path.

```typescript
import { Envelope } from "@blockchaincommons/envelope";
import { registerTags } from "@blockchaincommons/envelope/format";
import {
  parseEnvelopePattern,
  paths,
  matches,
  pathsWithCaptures,
  display,
} from "@blockchaincommons/envelope-pattern";
import { formatPaths } from "@blockchaincommons/envelope-pattern/format";

registerTags();

const alice = Envelope.from("Alice").addAssertion("knows", "Bob").addAssertion("knows", "Carol");
const pattern = parseEnvelopePattern('search(assertpred("knows") -> obj(@who(text)))');

display(pattern); // 'search(assertpred("knows") -> obj(@who(text)))'
matches(pattern, alice); // true
paths(pattern, alice).length; // 2

const { paths: found, captures } = pathsWithCaptures(pattern, alice);
console.log(formatPaths(found, { captures }));
```

Patterns can also be composed from the constructors, which take dCBOR
patterns at the leaves:

```typescript
import {
  and,
  anyNode,
  search,
  capture,
  text,
  subject,
  cbor,
} from "@blockchaincommons/envelope-pattern";
import { parsePattern } from "@blockchaincommons/dcbor-pattern";

const built = and(anyNode(), search(capture("name", text("Bob"))));
display(built); // 'node & search(@name("Bob"))'

// a dCBOR pattern applied to the subject's CBOR; its paths extend below the leaf
const inner = subject(cbor(parsePattern("search(number)")));
```

Every constructor and every parsed pattern returns a frozen object; a
`Pattern` is compared with `patternEquals`, never with `===`.

### Errors

`parseEnvelopePattern` throws an `EnvelopePatternError` for text that is not
a pattern. Its `code` says why (`EnvelopePatternErrorCode` lists every
code), `details` carries the span and any code-specific fields, and
`fullMessage(source)` renders the message with the source line and a caret
under the span. `tryParseEnvelopePattern` returns `{ ok: true, value }` or
`{ ok: false, error }` instead of throwing.

```typescript
import {
  tryParseEnvelopePattern,
  parseEnvelopePattern,
  EnvelopePatternError,
} from "@blockchaincommons/envelope-pattern";

const rejected = tryParseEnvelopePattern("subj(text");
if (!rejected.ok) {
  rejected.error.code; // "ExpectedCloseParen"
  rejected.error.span; // { start: 9, end: 9 }
}

try {
  parseEnvelopePattern("text $");
} catch (e) {
  if (EnvelopePatternError.isEnvelopePatternError(e)) console.log(e.fullMessage("text $"));
  // line 1: Unrecognized token
  // text $
  //      ^
}
```

Spans are UTF-16 code-unit offsets into the source. A wrong argument type
(a haystack that is not an `Envelope`, a pattern that is not a `Pattern`, a
non-string source) is a `TypeError`; a wrong value (`number(NaN)`, an
inverted range, a capture name that is not an identifier, a digest prefix
over 32 bytes, a `maxDepth` that is not a positive integer) is a
`RangeError`. Nesting is not limited by default, as in the reference: text
nested a few thousand levels deep exhausts the engine's stack with a
`RangeError`. `ParseOptions.maxDepth` sets a limit when one is wanted;
deeper text is then rejected with `NestingTooDeep`.

### Entries

| Entry     | Contents                                                                                                                                                       |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| root      | parsing, the constructors, `paths`, `matches`, `display`, `pathsWithCaptures`, `patternEquals`, `Interval`, `Quantifier`, `Reluctance`, `EnvelopePatternError` |
| `/format` | `formatPaths`, `formatPath` and `envelopeSummary`, the text rendering of paths and captures                                                                    |

### Pattern syntax

Whitespace between tokens is ignored. Keywords are case-sensitive. A text
the envelope grammar does not accept is read once more as a dCBOR pattern
applied to the subject, so every dCBOR value form parses here too.

**Leaf patterns** match the subject's CBOR.

| Pattern                                                                                    | Matches                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `bool`, `true`, `false`                                                                    | any boolean subject, or the given one                                                                                                                                    |
| `null`                                                                                     | a null subject                                                                                                                                                           |
| `number`, `42`, `-1.5`, `1...10`, `>=1`, `<=1`, `>1`, `<1`, `NaN`, `Infinity`, `-Infinity` | a number subject, that number, a number in the range, or the special values                                                                                              |
| `text`, `"string"`, `/regex/`                                                              | a text subject, that text, or one the regex matches                                                                                                                      |
| `bstr`, `h'0a0b'`, `h'/regex/'`                                                            | a byte-string subject, those bytes, or one the byte regex matches                                                                                                        |
| `date`, `date'2024-01-01'`, `date'a...b'`, `date'a...'`, `date'...b'`, `date'/regex/'`     | a date subject, that date, one in the range, one from or up to the date, or one whose ISO-8601 text the regex matches                                                    |
| `known`, `'12'`, `'isA'`, `'/regex/'`                                                      | a known-value subject, the one with that number or name, or one whose name the regex matches                                                                             |
| `array`, `[{n}]`, `[{n,m}]`, `[{n,}]`, `[p1, p2, …]`                                       | an array subject, one with that many elements, or one whose elements match the dCBOR sequence                                                                            |
| `map`, `{{n}}`, `{{n,m}}`, `{{n,}}`, `{k: v, …}`                                           | a map subject, one with that many entries, or one whose entries match                                                                                                    |
| `tagged`, `tagged(1, p)`, `tagged(date, p)`, `tagged(/regex/, p)`                          | a tagged subject, or one with that tag number, registered name, or name the regex matches, whose content matches the dCBOR pattern `p`; the match is the envelope itself |
| `cbor`, `cbor(value)`, `cbor(ur:…)`, `cbor(/pattern/)`                                     | any subject, one equal to the dCBOR diagnostic value or UR, or one whose CBOR matches the dCBOR pattern, with the paths extending below the leaf                         |

**Structure patterns** match elements of the envelope tree.

| Pattern                                         | Matches                                                                                   |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `leaf`                                          | a leaf or known-value envelope                                                            |
| `node`, `node({n,m})`                           | an envelope with assertions, or with that many                                            |
| `subj`, `subj(p)`                               | the subject of an envelope, when it matches `p`                                           |
| `assert`, `assertpred(p)`, `assertobj(p)`       | each assertion of a node, or those whose predicate or object matches `p`                  |
| `pred`, `pred(p)`, `obj`, `obj(p)`              | the predicate or object of an assertion, when it matches `p`                              |
| `wrapped`, `unwrap`, `unwrap(p)`                | an envelope whose subject is wrapped, its content, or its content when it matches `p`     |
| `digest(hex)`, `digest(ur:digest/…)`            | an envelope whose digest starts with the hex prefix (up to 32 bytes) or equals the digest |
| `obscured`, `elided`, `encrypted`, `compressed` | an obscured envelope, or that form                                                        |

**Meta patterns** combine patterns. Precedence, highest first: repeat, `&`, `!`, `->`, `|`.

| Pattern                                   | Matches                                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------------------------- |
| `*`                                       | any envelope                                                                                |
| `p & q`                                   | both, `q` continuing where `p` ended                                                        |
| `p \| q`                                  | either; every matching alternative yields its paths                                         |
| `!p`                                      | anything but `p`                                                                            |
| `p -> q`                                  | `q` matched from where `p` ended, with no other element between                             |
| `(p)`, `(p){n,m}`, `(p)*`, `(p)+`, `(p)?` | a group, or `p` repeated greedily; `?`, `+` after the quantifier make it lazy or possessive |
| `@name(p)`                                | `p`, with the matched paths recorded under `name`                                           |
| `search(p)`                               | `p` at every node of the tree                                                               |

`display` prints a pattern in canonical form, which parses back to an equal
pattern.

### Dialect notes

- A regex inside a pattern is written in the dialect shared by every
  implementation and translated for JavaScript by dcbor-pattern: leading
  `(?i)`, `(?m)`, `(?s)`, `(?x)` groups set flags, `(?P<n>…)` names a group,
  `\x{hhhh}` is a code point, `\pL` and `\p{Greek}` are classes, `\A` and
  `\z` anchor; lookaround, backreferences and `(?U)` are rejected. `\w`,
  `\d` and `\b` are ASCII, as in JavaScript.
- Number literals are `-?(0|[1-9]\d*)`, with a fraction and an exponent
  only after the fraction; `1e3` is rejected. A number displays without an
  exponent (`1000000000000000000000`), `-0.0` as `-0`.
- Text literals are read as UTF-16 text, so `"é"` matches `"é"`.
- Error spans are absolute offsets into the whole source, including inside
  `date'…'`, `digest(…)` and `tagged(…)` bodies.

Runnable examples live in the [`examples/`](https://github.com/BlockchainCommons/bc-envelope-pattern-ts/tree/master/examples) directory.

## Status - Beta

`bc-envelope-pattern-ts` is currently under active development and in beta testing. It should not be used for production tasks until it has had further testing and auditing. See [Blockchain Commons' Development Phases](https://github.com/BlockchainCommons/Community/blob/master/release-path.md).

### Version History

- **1.0.0-beta.1 (September 9, 2026)** - Initial beta implementation.

### Roadmap

- Continued testing and auditing on the path from beta to a stable **1.0.0** release.
- Continued parity with the Rust reference implementation as it evolves (see [`RUST_DIVERGENCES.md`](./RUST_DIVERGENCES.md)).

### Dependencies

`@blockchaincommons/envelope-pattern` depends on `@blockchaincommons/components`, `@blockchaincommons/dcbor`, `@blockchaincommons/dcbor-parse`, `@blockchaincommons/dcbor-pattern`, `@blockchaincommons/envelope`, `@blockchaincommons/known-values` and `@blockchaincommons/uniform-resources` at runtime.

To build and work on this library, you'll need the following tools:

- [Node.js](https://nodejs.org/) >= 22.12 - JavaScript runtime.
- [Bun](https://bun.sh/) - used to install dependencies and run scripts (any node package manager works).
- [TypeScript](https://www.typescriptlang.org/) >= 5.7 - language and type checker.

### Derived from ...

This `bc-envelope-pattern-ts` project is either derived from or was inspired by:

- [BlockchainCommons/bc-envelope-pattern-rust](https://github.com/BlockchainCommons/bc-envelope-pattern-rust) - The reference Rust implementation, by [Wolf McNally](https://github.com/wolfmcnally).
- [paritytech/bcts](https://github.com/paritytech/bcts) - A TypeScript port covering many Blockchain Commons' implementations, by [Parity Technologies](https://github.com/paritytech).

## Financial Support

`bc-envelope-pattern-ts` is a project of [Blockchain Commons](https://www.blockchaincommons.com/). We are proudly a "not-for-profit" social benefit corporation committed to open source & open development. Our work is funded entirely by donations and collaborative partnerships with people like you. Every contribution will be spent on building open tools, technologies, and techniques that sustain and advance blockchain and internet security infrastructure and promote an open web.

To financially support further development of `bc-envelope-pattern-ts` and other projects, please consider becoming a Patron of Blockchain Commons through ongoing monthly patronage as a [GitHub Sponsor](https://github.com/sponsors/BlockchainCommons). You can also support Blockchain Commons with bitcoins at our [BTCPay Server](https://btcpay.blockchaincommons.com/).

## Contributing

We encourage public contributions through issues and pull requests! Please review [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our development process. All contributions to this repository require a GPG signed [Contributor License Agreement](./CLA.md).

### Discussions

The best place to talk about Blockchain Commons and its projects is in our GitHub Discussions areas.

[**Gordian Developer Community**](https://github.com/BlockchainCommons/Gordian-Developer-Community/discussions). For standards and open-source developers who want to talk about interoperable wallet specifications, please use the Discussions area of the [Gordian Developer Community repo](https://github.com/BlockchainCommons/Gordian-Developer-Community/discussions). This is where you talk about Gordian specifications such as [Gordian Envelope](https://github.com/BlockchainCommons/Gordian/tree/master/Envelope#articles), [bc-shamir](https://github.com/BlockchainCommons/bc-shamir), [Sharded Secret Key Reconstruction](https://github.com/BlockchainCommons/bc-sskr), and [bc-ur](https://github.com/BlockchainCommons/bc-ur) as well as the larger [Gordian Architecture](https://github.com/BlockchainCommons/Gordian/blob/master/Docs/Overview-Architecture.md), its [Principles](https://github.com/BlockchainCommons/Gordian#gordian-principles) of independence, privacy, resilience, and openness, and its macro-architectural ideas such as functional partition (including airgapping, the original name of this community).

[**Gordian User Community**](https://github.com/BlockchainCommons/Gordian/discussions). For users of the Gordian reference apps, including [Gordian Coordinator](https://github.com/BlockchainCommons/iOS-GordianCoordinator), [Gordian Seed Tool](https://github.com/BlockchainCommons/GordianSeedTool-iOS), [Gordian Server](https://github.com/BlockchainCommons/GordianServer-macOS), [Gordian Wallet](https://github.com/BlockchainCommons/GordianWallet-iOS), and [SpotBit](https://github.com/BlockchainCommons/spotbit) as well as our whole series of [CLI apps](https://github.com/BlockchainCommons/Gordian/blob/master/Docs/Overview-Apps.md#cli-apps). This is a place to talk about bug reports and feature requests as well as to explore how our reference apps embody the [Gordian Principles](https://github.com/BlockchainCommons/Gordian#gordian-principles).

[**Blockchain Commons Discussions**](https://github.com/BlockchainCommons/Community/discussions). For developers, interns, and patrons of Blockchain Commons, please use the discussions area of the [Community repo](https://github.com/BlockchainCommons/Community) to talk about general Blockchain Commons issues, the intern program, or topics other than those covered by the [Gordian Developer Community](https://github.com/BlockchainCommons/Gordian-Developer-Community/discussions) or the
[Gordian User Community](https://github.com/BlockchainCommons/Gordian/discussions).

### Other Questions & Problems

As an open-source, open-development community, Blockchain Commons does not have the resources to provide direct support of our projects. Please consider the discussions area as a locale where you might get answers to questions. Alternatively, please use this repository's [issues](https://github.com/BlockchainCommons/bc-envelope-pattern-ts/issues) feature. Unfortunately, we can not make any promises on response time.

If your company requires support to use our projects, please feel free to contact us directly about options. We may be able to offer you a contract for support from one of our contributors, or we might be able to point you to another entity who can offer the contractual support that you need.

### Credits

The following people directly contributed to this repository. You can add your name here by getting involved. The first step is learning how to contribute from our [CONTRIBUTING.md](./CONTRIBUTING.md) documentation.

| Name              | Role                     | Github                                                   | Email                                 | GPG Fingerprint                                   |
| ----------------- | ------------------------ | -------------------------------------------------------- | ------------------------------------- | ------------------------------------------------- |
| Christopher Allen | Principal Architect      | [@ChristopherA](https://github.com/ChristopherA)         | \<ChristopherA@LifeWithAlacrity.com\> | FDFE 14A5 4ECB 30FC 5D22 74EF F8D3 6C91 3574 05ED |
| Wolf McNally      | Lead Researcher/Engineer | [@wolfmcnally](https://github.com/wolfmcnally)           | \<Wolf@WolfMcNally.com\>              | 9436 52EE 3844 1760 C3DC 3536 4B6C 2FCF 8947 80AE |
| Leonardo Custodio | Software Engineer        | [@leonardocustodio](https://github.com/leonardocustodio) | \<leonardo@snowpine.io\>              | 59DA D997 67EF 3BAB 2B90 D057 5384 DEF3 B582 450D |

### Contributing Sponsor

**Gordian Envelope Pattern Matching for TypeScript** was produced as a collaboration between Blockchain Commons and one of our patrons, [Parity Technologies](https://parity.io): Parity wrote the wrappers based on Blockchain Commons' specifications and reference libraries. Blockchain Commons is dedicated to not just creating open infrastructure on our own, but also coordinating the work of other companies in benefiting the Commons. Thanks to Parity for working directly with us in this manner.

![](.github/assets/parity.svg)

## Responsible Disclosure

We want to keep all of our software safe for everyone. If you have discovered a security vulnerability, we appreciate your help in disclosing it to us in a responsible manner. We are unfortunately not able to offer bug bounties at this time.

We do ask that you offer us good faith and use best efforts not to leak information or harm any user, their data, or our developer community. Please give us a reasonable amount of time to fix the issue before you publish it. Do not defraud our users or us in the process of discovery. We promise not to bring legal action against researchers who point out a problem provided they do their best to follow the these guidelines.

### Reporting a Vulnerability

Please report suspected security vulnerabilities in private via email to ChristopherA@BlockchainCommons.com (do not use this email for support). Please do NOT create publicly viewable issues for suspected security vulnerabilities.

The following keys may be used to communicate sensitive information to developers:

| Name              | Fingerprint                                       |
| ----------------- | ------------------------------------------------- |
| Christopher Allen | FDFE 14A5 4ECB 30FC 5D22 74EF F8D3 6C91 3574 05ED |

You can import a key by running the following command with that individual’s fingerprint: `gpg --recv-keys "<fingerprint>"` Ensure that you put quotes around fingerprints that contain spaces.
