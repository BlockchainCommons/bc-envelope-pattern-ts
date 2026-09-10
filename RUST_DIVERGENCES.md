# Divergences from the Rust reference implementation

This library is a TypeScript port of
[`BlockchainCommons/bc-envelope-pattern-rust`](https://github.com/BlockchainCommons/bc-envelope-pattern-rust),
tracked at version **0.14.0**
([`44fe3983`](https://github.com/BlockchainCommons/bc-envelope-pattern-rust/commit/44fe39832e9321445dc5d6a10b0e1f852d28f982)).

The tracked version and commit are recorded in
[`.github/versions.yml`](./.github/versions.yml), and the `upstream.yml`
workflow opens a tracking issue whenever the reference implementation moves
ahead of it.

This document is the deliberate record of every place the TypeScript
behaviour differs from the reference. It has six kinds of entry:

1. **Behavioural divergences** - the same input produces a different outcome, by design.
2. **JS-only input domain** - inputs that have no Rust analog, so there is nothing to diverge from.
3. **Mapping equivalences** - JS-specific inputs validated through the bytes they produce.
4. **Port-right rows** - inputs where this library follows the documented behaviour and the reference does not.
5. **Upstream items** - reference behaviours this library reproduces on purpose while they are open.
6. **Inherited** - what reaches this package through dcbor-pattern.

Every entry is checked by `tests/rust-validation`, a Rust program that
builds `bc-envelope-pattern` at the tracked commit and replays
`tests/vectors/vectors.json`: every pattern of the corpus parsed and
displayed, matched against a fixed set of envelope haystacks (leaves of
every kind, decoded known values, containers as subjects, tagged containers,
nodes, wrapped, elided, compressed, encrypted, salted, signed, the
reference's credential) with `paths_with_captures` and `matches`, and
formatted, plus the JavaScript-only domain rows. It compares displays, path
elements as envelope digests, captures, formatted output and error
variants, and classifies every difference into one of the classes below.
The current run:

**14 501 vectors - 13 794 match, 5 R1, 54 R2, 6 R3, 66 R4, 37 R5, 23 R7,
1 X1, 318 S1, 195 S2, 2 D1, 74 js-only, 0 mismatches.**

## 1. Behavioural divergences

### D1. Infinite number patterns display as `Infinity` (2 vectors)

`Infinity` and `-Infinity` parse on both sides; the reference displays them
through Rust's `f64` formatting (`inf`, `-inf`), which its own parser does
not accept. This library displays the parseable spelling, so
`parse(display(p))` round-trips.

### X1. `\w`, `\d`, `\b` are ASCII (1 vector)

A regex reaches this package through dcbor-pattern's dialect translation.
`\w`, `\d` and `\b` are ASCII in JavaScript and Unicode-aware in the
reference, so `/\w+/` does not match `"é"` here. See dcbor-pattern's
`RUST_DIVERGENCES.md` for the whole dialect record.

## 2. JS-only input domain

- **Error taxonomy on rejected patterns (S1 318, S2 195).** Both sides
  reject the same strings. The reference's lexer reports a bare `Unknown`
  at eleven sites and spans `date'…'`, `digest(…)` and `tagged(…)` bodies
  relative to the body; this library reports the specific code
  (`UnrecognizedToken`, `InvalidPattern`, `InvalidRange`) and every span
  as an absolute offset. A `{…}` that is not a range is `UnexpectedToken`
  there and `InvalidRange` here. Spans are UTF-16 code units here; the
  harness transcodes.
- **`NestingTooDeep`.** A pattern nested deeper than `ParseOptions.maxDepth`
  (500 by default) is rejected with a code the reference does not have; the
  reference overflows its stack at a few thousand levels.
- **Argument guards (74 domain rows).** A haystack that is not an
  `Envelope`, a pattern that is not a `Pattern`, a non-string source or a
  wrong argument type is a `TypeError`; `number(NaN)`, an inverted range, a
  capture name that is not an identifier, a tag name that is not a bare
  word, an invalid ISO-8601 date, a digest prefix over 32 bytes, an empty
  `and()` or `or()`, or a `maxDepth` that is not a positive integer is a
  `RangeError`. The reference's type system rules these inputs out.
- **Truncation** (`maxLength`) counts UTF-16 code units where the reference
  counts bytes; the cut differs only inside non-ASCII text.

## 3. Mapping equivalences

- Haystacks are carried as tagged CBOR bytes and decoded on both sides;
  path elements compare as envelope digests. Encrypted haystacks use a
  fixed nonce, salted ones a fixed salt, and signed ones seeded keys, so the
  bytes are reproducible.
- Format options map one to one (`indent`, `lastElementOnly`,
  `elementFormat` as summary with an optional `maxLength`, envelope UR or
  digest UR).
- Known values in formatted paths resolve their name through envelope's
  global format context on both sides once the tags are registered.

## 4. Port-right rows

- **R1 (5).** The reference reads a `"…"` literal byte by byte and pushes
  each byte as a character, so `"é"` becomes `"Ã©"` and never matches;
  this library reads text.
- **R2 (54).** `h'/é/'` and `'/é/'` are rejected by the reference (a byte
  index used as a character index misses the closing quote); this library
  accepts them.
- **R3 (6).** `tagged(date, *)` and `tagged(/^d/, *)` match decoded data
  here, as the syntax document promises; the reference's `Tag::name()` does
  not consult the tags store on decoded data.
- **R4 (66).** Three or more `|` alternatives: the reference's `or` lays
  its splits out so that only the first two alternatives ever run
  (`"a" | "b" | "Alice"` fails on Alice, `* | * | *` yields two paths).
  This library explores every alternative.
- **R5 (37).** Captures under a structure pattern inside `search`
  (`search(subj(@c(text)))`, `search(@o(unwrap(@c(*))))`) are reported
  here; the reference's capture-name collector descends meta patterns only,
  so its `Search` drops them.
- **R7 (23).** `date'/'` panics the reference; this library reports
  `InvalidDateFormat`.

## 5. Upstream items reproduced on purpose

| #   | Item                                                                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| U1  | `"…"` literals decoded byte by byte (R1).                                                                                                                                       |
| U2  | Non-ASCII regex bodies lose their closing quote (R2).                                                                                                                           |
| U3  | `or` with three or more alternatives runs the first two (R4).                                                                                                                   |
| U4  | `collect_capture_names` skips structure patterns (R5).                                                                                                                          |
| U5  | A capture path on a known-value subject carries the envelope twice (`cbor(/@x(*)/)` on `'isA'` → `x=[env, env]`); reproduced, since the conversion is the reference's.          |
| U6  | `date'/'` panics (R7).                                                                                                                                                          |
| U7  | `inf` and `-inf` display does not re-parse (D1).                                                                                                                                |
| U8  | Nesting of a few thousand levels aborts the process; `NestingTooDeep` here.                                                                                                     |
| U9  | `[1, 2] -> text` is unparseable on both sides: an array pattern consumes the rest of the text, so array patterns only parse through the whole-input dCBOR fallback. Reproduced. |
| U10 | `1e5` is rejected by the envelope lexer and accepted by dcbor-pattern's; `1e5 -> text` fails while `1e5` alone parses through the fallback. Reproduced.                         |
| U11 | `tagged(tag, p)` collapses every content path and capture to the envelope, unlike `cbor(/tagged(…)/)`. Reproduced.                                                              |
| U12 | Bare `Unknown` errors and body-relative spans (S1/S2 above).                                                                                                                    |

## 6. Inherited from dcbor-pattern

Every `cbor(/…/)` leaf and every dCBOR value form (`/regex/`, `h'…'`,
`date'…'`, `'…'`, `[…]`, `{…}`, `tagged(…)`) is matched and displayed by
`@blockchaincommons/dcbor-pattern`; its regex dialect residues (X1–X3),
number display, date parsing and search de-duplication apply here as
recorded in that package's `RUST_DIVERGENCES.md`.

## Maintenance

When the upstream reference moves:

1. Review the diff via the link in the `upstream.yml` tracking issue.
2. Port the relevant changes.
3. Update `.github/versions.yml` with the new version and commit.
4. Update the tracked version at the top of this file.
5. Regenerate the vectors (`bun run vectors:generate`), replay them
   (`cargo run --release -- ../vectors/vectors.json` in
   `tests/rust-validation`) and update the result line and the entries
   above as the port requires.
