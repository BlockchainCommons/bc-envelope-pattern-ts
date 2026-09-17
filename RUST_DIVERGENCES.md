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

1. **Behavioural divergences** - the same input produces a different outcome, by design or by a limit of the platform.
2. **JS-only input domain** - inputs that have no Rust analog, so there is nothing to diverge from.
3. **Mapping equivalences** - rules of the reference reproduced through a different mechanism, validated through the bytes and errors they produce.
4. **Port-right rows** - inputs where this library follows the documented behaviour and the reference does not.
5. **Upstream items** - reference behaviours this library reproduces on purpose while they are open.
6. **Inherited** - what reaches this package through dcbor-pattern.

Every entry is checked by `tests/rust-validation`, a Rust program that
builds `bc-envelope-pattern` at the tracked release from crates.io and
replays `tests/vectors/vectors.json`: every pattern of the corpus parsed and
displayed, matched against a fixed set of envelope haystacks (leaves of
every kind, decoded known values, containers as subjects, tagged containers,
nodes, wrapped, elided, compressed, encrypted, salted, signed, the
reference's credential) with `paths_with_captures` and `matches`, and
formatted, plus the JavaScript-only domain rows. It compares displays, path
elements as envelope digests, captures, formatted output and error
variants and spans, and classifies every difference into one of the classes
below. The current run:

**14 502 vectors - 13 819 match, 683 expected divergence, 0 mismatches.**

The divergences are 5 R1, 54 R2, 6 R3, 66 R4, 37 R5, 23 R7, 318 U-relative,
172 U-unknown and 2 D1. The 75 JavaScript-only rows have nothing to compare
and are counted with the matches.

A mismatch is a bug on one side, never a new class. A JavaScript-only input
becomes a domain row, not an entry here.

## 1. Behavioural divergences

### D1. Infinite number patterns display as `Infinity` (2 vectors)

`Infinity` and `-Infinity` parse on both sides; the reference displays them
through Rust's `f64` formatting (`inf`, `-inf`), which its own parser does
not accept (U7). This library displays the parseable spelling, so
`parse(display(p))` round-trips.

### Errors (U-relative 318, U-unknown 172)

Both sides reject the same strings with the same variants, at the
reference's extents: a `date'…'` error spans the body between the quotes, a
`digest(…)` error points just after the hex or the UR, a `cbor(/…/)` error
spans the dCBOR pattern, an unterminated `[…]` is `ExpectedCloseBracket` at
the end of the source. Two things differ, both defects of the reference
(U12):

- The reference reports the span of an error raised while parsing a
  `date'…'`, `digest(…)`, `cbor(…)`, `tagged(…)` or `[…]` body *relative to
  that body*; this library reports the same extent from the start of the
  source. The harness adds the body's offset before comparing
  (`U-relative`).
- Where an inner construct meets text the lexer cannot read, the reference
  raises its bare `Unknown`, an error with no position; this library
  raises `UnrecognizedToken`, `InvalidPattern` or the construct's own code
  with the span (`U-unknown`).

Spans are UTF-16 code units here; the harness transcodes the reference's
byte offsets.

### Truncation

`maxLength` counts UTF-16 code units. The reference slices bytes
(`&s[0..max_len - 1]`) and panics when the cut lands inside a multi-byte
character (U13); a byte count that stops on a boundary would be a third
behaviour, so the code-unit count stays.

### Stack depth

Neither side limits nesting. The reference aborts the process near 3 200
nested groups, 3 600 `subj(` or 3 700 `search(` (U8); this library throws the
engine's `RangeError` at a depth that depends on the engine and on the
caller's own stack (Node 24 near 3 500 groups, 2 800 `subj(` or 3 300
`search(`; Bun near 5 200, 4 700 and 6 100), so it can give up earlier or
later than the reference. `ParseOptions.maxDepth` sets a limit when one is
wanted, and rejects deeper text with `NestingTooDeep`, a code the reference
does not have; the limit also applies to the dCBOR patterns embedded in
`cbor(/…/)`, `[…]` and `tagged(…)`.

## 2. JS-only input domain

- **Argument guards (75 domain rows).** A haystack that is not an
  `Envelope`, a pattern that is not a `Pattern`, a non-string source or a
  wrong argument type is a `TypeError`; `number(NaN)`, an inverted range, a
  capture name that is not an identifier, a tag name that is not a bare
  word, an invalid ISO-8601 date, a digest prefix over 32 bytes, an empty
  `and()` or `or()`, or a `maxDepth` that is not a positive integer is a
  `RangeError`. The reference's type system rules these inputs out.

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
- An array pattern's body is read as `[…]` on both sides, so a well-formed
  `[…]` fails in the envelope grammar and parses through the whole-input
  dCBOR fallback (U9); `[text` is `ExpectedCloseBracket` at the end of the
  source on both.
- A `date'…'` body is read as written on both sides: `date' 2023-06-15'`
  is `InvalidDateFormat`.

## 4. Port-right rows

- **R1 (5).** The reference reads a `"…"` literal byte by byte and pushes
  each byte as a character, so `"é"` becomes `"Ã©"` and never matches;
  this library reads text (U1).
- **R2 (54).** `h'/é/'` and `'/é/'` are rejected by the reference (a byte
  index used as a character index misses the closing quote); this library
  accepts them (U2).
- **R3 (6).** `tagged(date, *)` and `tagged(/^d/, *)` match decoded data
  here, as the syntax document promises; the reference's `Tag::name()` does
  not consult the tags store on decoded data, so it matches nothing. Kept
  deliberately, as in dcbor-pattern (its R1); the mirror is one line.
- **R4 (66).** Three or more `|` alternatives: the reference's `or` lays
  its splits out so that only the first two alternatives ever run
  (`"a" | "b" | "Alice"` fails on Alice, `* | * | *` yields two paths).
  This library explores every alternative (U3).
- **R5 (37).** Captures under a structure pattern inside `search`
  (`search(subj(@c(text)))`, `search(@o(unwrap(@c(*))))`) are reported
  here; the reference's capture-name collector descends meta patterns only,
  so its `Search` drops them (U4).
- **R7 (23).** `date'/'` panics the reference; this library reports
  `InvalidDateFormat` over the body (U6).

## 5. Upstream items

| #   | Item                                                                                                                                                                                                      |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| U1  | `"…"` literals decoded byte by byte (R1).                                                                                                                                                                 |
| U2  | Non-ASCII regex bodies lose their closing quote (R2).                                                                                                                                                     |
| U3  | `or` with three or more alternatives runs the first two (R4).                                                                                                                                             |
| U4  | `collect_capture_names` skips structure patterns (R5).                                                                                                                                                    |
| U5  | A capture path on a known-value subject carries the envelope twice (`cbor(/@x(*)/)` on `'isA'` → `x=[env, env]`); reproduced, since the conversion is the reference's.                                    |
| U6  | `date'/'` panics (R7).                                                                                                                                                                                    |
| U7  | `inf` and `-inf` display does not re-parse (D1).                                                                                                                                                          |
| U8  | Nesting of a few thousand levels aborts the process (§1).                                                                                                                                                 |
| U9  | `[1, 2] -> text` is unparseable on both sides: an array pattern's body is read as `[…]` and consumes the rest of the text, so array patterns only parse through the whole-input dCBOR fallback. Reproduced. |
| U10 | `1e5` is rejected on both sides (`UnrecognizedToken` at the `e`): the envelope lexer has no exponent form, and the dCBOR fallback runs only when the envelope grammar accepted nothing. Reproduced.        |
| U11 | `tagged(tag, p)` collapses every content path and capture to the envelope, unlike `cbor(/tagged(…)/)`. Reproduced.                                                                                        |
| U12 | Bare `Unknown` errors and body-relative spans (§1).                                                                                                                                                       |
| U13 | `truncate_with_ellipsis` slices bytes and panics inside a multi-byte character (§1).                                                                                                                      |
| U14 | `tagged(name, …)` and `tagged(/re/, …)` never match decoded data (R3).                                                                                                                                    |

## 6. Inherited from dcbor-pattern

Every `cbor(/…/)` leaf and every dCBOR value form (`/regex/`, `h'…'`,
`date'…'`, `'…'`, `[…]`, `{…}`, `tagged(…)`) is matched and displayed by
`@blockchaincommons/dcbor-pattern`; its regex dialect translation and
residue, number display, date parsing and search de-duplication apply here
as recorded in that package's `RUST_DIVERGENCES.md`.

## Maintenance

When the upstream reference moves:

1. Review the diff via the link in the `upstream.yml` tracking issue.
2. Port the relevant changes.
3. Update `.github/versions.yml` with the new version and commit, and the
   pin in `tests/rust-validation/Cargo.toml`.
4. Update the tracked version at the top of this file.
5. Regenerate the vectors (`bun run vectors:generate`), replay them
   (`cargo run --release -- ../vectors/vectors.json` in
   `tests/rust-validation`) and update the result line and the entries
   above as the port requires. A `MISMATCH` is a bug on one side, never a
   new class; when an item of §5 is fixed upstream, the port follows and
   the row goes.
