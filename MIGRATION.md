# Migrating to the redesigned `@blockchaincommons/envelope-pattern`

The pattern language and the paths a match yields are the reference's,
proven against a frozen pre-redesign bundle (`tests/differential.test.ts`,
14 501 golden vectors, every behaviour change a named tombstone) and
against `bc-envelope-pattern-rust` 0.14.0 (`tests/rust-validation`: 13 794
of 14 501 vectors byte-identical, the rest the documented classes in
`RUST_DIVERGENCES.md`). §0 lists the changes of the current tree; §1
onwards describes the earlier move from the `Result`-based API.

## 0. Checklist for the current API

The pattern language and the paths a match yields are the reference's; the
matcher, the parser and the surface around them changed. The differential
suite (`tests/differential.test.ts`, 14 501 vectors against a frozen
bundle) records each change as a named row. Work through the list:

- [ ] Every pattern runs on the VM: `a & b` is sequential composition (`b`
      continues where `a` ended and keeps its captures and extended paths),
      `a | b` yields the paths of every matching alternative (`* | *` yields two
      paths), and `(p){1}` is a repeat that must move, so `(*){1}` never
      matches. A bare `(p)` is still `p`.
- [ ] Map patterns keep their contents: `{"a": 1}` matches only maps with
      that entry and displays as written.
- [ ] `tagged(tag, p)` matches the envelope only; its paths and captures no
      longer extend into the tagged content. `cbor(/tagged(…)/)` still does.
- [ ] The lexer rejects what it used to skip: `text $`, `-text`, `1.`,
      `.5`, `1e3`, `007`, `@(text)` are errors (`UnrecognizedToken`,
      `ExtraData`). `tagged(1)`, `tagged(date)` and `tagged(/re/)` parse as
      `tagged(…, *)`. `'+5'` is `'5'`; `-0.0` displays as `-0`.
- [ ] `parseEnvelopePatternPrefix` and `tryParseEnvelopePatternPrefix` are
      gone.
- [ ] `parseEnvelopePattern` and `tryParseEnvelopePattern` take an optional
      `{ maxDepth }` and reject deeper text with `NestingTooDeep`; there is
      no default limit, as in the reference.
- [ ] Error spans follow the reference's extents, made absolute: a
      `date'…'` error spans the body between the quotes, a `digest(…)` error
      points just after the hex or the UR, and `[text` (an unterminated
      array) is `ExpectedCloseBracket` at the end of the source. A
      `date'…'` body is read as written, without trimming.
- [ ] `ParseResult<T>` is `DcborResult<T, EnvelopePatternError>`.
- [ ] `error.details.span` is `error.span`; `error.details` is a
      discriminated union by `code` (`kind` and `text` for `UnexpectedToken`,
      `cause` for `InvalidUr`, `name` for `InvalidCaptureGroupName`, `maxDepth`
      for `NestingTooDeep`). `error.message` no longer carries positions; use
      `error.fullMessage(source)`. `EnvelopePatternError` has no public
      constructor; the `Unknown` and `DCBORPatternError` codes are gone.
- [ ] The pattern object is plain frozen data: `pattern.kind` is `"Leaf"`,
      `"Structure"` or `"Meta"` (it was `pattern.type`), `pattern.pattern.type`
      names the form and `pattern.pattern.pattern` (or the form's own fields)
      holds the payload. There are no classes, `new()` or method accessors.
      Compare with `patternEquals`.
- [ ] `Path` is `readonly Envelope[]`, `pathsWithCaptures` returns a frozen
      `MatchResult`.
- [ ] `repeat(p, quantifier)` takes a `Quantifier`; `tagged(tag, p)` takes a
      `Tag`, a number, a bigint or a registered name; `knownValue` takes a
      `KnownValue`, a number, a bigint or a name; `date` takes a `CborDate`.
- [ ] New constructors: `numberGreaterThanOrEqual`, `numberLessThanOrEqual`,
      `numberNaN`, `byteStringBinaryRegex`, `knownValueNamed`, `knownValueRegex`,
      `dateIso8601`, `taggedName`, `taggedRegex`, `digestBinaryRegex`,
      `arrayWithRange`, `arrayWithCount`, `mapWithRange`, `mapWithCount`,
      `nodeWithAssertionsRange`, `nodeWithAssertionsCount`, `patternEquals`.
- [ ] Wrong arguments throw: a non-`Pattern` or non-`Envelope` argument to
      `paths`, `matches`, `display`, `pathsWithCaptures` or `patternEquals` is a
      `TypeError`; `number(NaN)`, `capture("a b", …)`, `and()`, `or()`, a
      digest prefix over 32 bytes and an inverted range are `RangeError`s.
      `traverse()` is `!*`.
- [ ] `/format`: the option is `elementFormat` (it was `element`); a
      malformed option is a `RangeError`, a non-path argument a `TypeError`.
      Known values format by their registered name once `registerTags()` has
      run; `cbor([[1, 2]])` displays on one line.

## 1. Entries

| Entry     | Contents                                                                                                                                                                                              |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| root      | `parseEnvelopePattern`/`tryParseEnvelopePattern`, the constructors, `paths`, `matches`, `display`, `pathsWithCaptures`, `patternEquals`, `Interval`/`Quantifier`/`Reluctance`, `EnvelopePatternError` |
| `/format` | `formatPaths`, `formatPath`, `FormatPathsOptions`, `PathElementFormat`, `envelopeSummary`                                                                                                             |

The pattern classes, the VM, the dispatch registries and the per-kind
parsers are no longer exported; `VERSION` is gone.

## 2. Parsing: throw, or `try…`

| Before                                                                                                                                                | After                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `parse(src): Result<Pattern>`                                                                                                                         | `parseEnvelopePattern(src)` (throws `EnvelopePatternError`) or `tryParseEnvelopePattern(src): DcborResult<Pattern, EnvelopePatternError>` |
| `parsePartial(src): Result<[Pattern, number]>`                                                                                                        | dropped: there is no partial parse                                                                                                        |
| `Result`, `ok`, `err`, `isOk`, `isErr`, `unwrap`, `unwrapOr`, `map`, `formatError`, the twenty error factories, the bare `EnvelopePatternError` union | `EnvelopePatternError { code, details, span, fullMessage(source) }`, `EnvelopePatternErrorCode`, `DcborResult<T, E>`                      |
| `result.error.type` / `result.error.span`                                                                                                             | `result.error.code` / `result.error.span`                                                                                                 |

Spans stay UTF-16 code-unit offsets.

## 3. Runners and constructors

| Before                                                                                                                                      | After                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `patternPaths(p, e)` / `patternMatches(p, e)` / `patternToString(p)`                                                                        | `paths(p, e)` / `matches(p, e)` / `display(p)`         |
| `patternPathsWithCaptures(p, e)` → `[paths, captures]`                                                                                      | `pathsWithCaptures(p, e)` → `{ paths, captures }`      |
| `and([a, b])` / `or([a, b])` / `traverse([a, b])`                                                                                           | `and(a, b)` / `or(a, b)` / `traverse(a, b)` (variadic) |
| `cborValue(v)` / `cborPattern(dcborPattern)`                                                                                                | `cbor(v)` / `cbor(dcborPattern)`                       |
| `unwrapEnvelope()` / `unwrapMatching(p)`                                                                                                    | `unwrap()` / `unwrap(p)`                               |
| `nullPattern()`                                                                                                                             | `nullValue()`                                          |
| `patternLeaf`, `patternStructure`, `patternMeta`, `patternCompile`, `patternIsComplex`, `patternCollectCaptureNames`, `XxxPattern.new(...)` | internal                                               |

Every other constructor (`text`, `textRegex`, `number…`, `date…`,
`knownValue`, `subject`, `predicate`, `object`, `anyAssertion`,
`assertionWithPredicate`, `wrapped`, `elided`, `search`, `capture`,
`repeat`, `group`, …) keeps its name.

## 4. Formatting (`/format`)

| Before                                                                                                                                                  | After                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `formatPaths(paths)` / `formatPathsOpt(paths, opts)` / `formatPathsWithCaptures(paths, captures)` / `formatPathsWithCapturesOpt(paths, captures, opts)` | `formatPaths(paths, { captures?, indent?, element?, maxLength?, lastElementOnly? })` |
| `formatPath(path)` / `formatPathOpt(path, opts)`                                                                                                        | `formatPath(path, options?)`                                                         |
| `formatPathsOpts().indent(false).build()`, `defaultFormatPathsOpts()`, `FormatPathsOptsBuilder`                                                         | the options object; every field optional with the same defaults                      |
| `summaryFormat(max)` / `envelopeURFormat()` / `digestURFormat()`                                                                                        | `element: "summary" \| "envelopeUR" \| "digestUR"`, `maxLength`                      |

## 5. Behaviour fixed towards the reference

- Structure patterns run on the VM: `subj` on a node reports the path
  `[node, subject]` (it reported `[subject]`), and a structure's
  alternatives come out in the reference's stack order.
- Inherited from dcbor-pattern: `[]` is any array, a parenthesised group
  outside an array matches, tag-1 leaves format as dates.

## 6. Dependencies

`@blockchaincommons/dcbor-compat` and `rand` are gone; `dcbor` and
`uniform-resources` are declared. The leaf patterns build on
`@blockchaincommons/dcbor-pattern/internal`.

## Appendix: migrating from `@bcts/envelope-pattern`

`@blockchaincommons/envelope-pattern` is the canonical home of this library. It was extracted from the
[`paritytech/bcts`](https://github.com/paritytech/bcts) monorepo, where it was
published as `@bcts/envelope-pattern`, into its own Blockchain Commons repository at
[`BlockchainCommons/bc-envelope-pattern-ts`](https://github.com/BlockchainCommons/bc-envelope-pattern-ts).

For the extraction release, **`1.0.0-beta.1`, the public API is unchanged.** The
migration is a rename. `@bcts/envelope-pattern` remains published for one beta cycle as a
thin re-export of this package, so nothing breaks the moment you update.

### TL;DR checklist

- [ ] Replace the `@bcts/envelope-pattern` dependency with `@blockchaincommons/envelope-pattern`.
- [ ] Rewrite import specifiers: `@bcts/envelope-pattern` becomes `@blockchaincommons/envelope-pattern`.
- [ ] Raise your Node floor to **22.12**.
- [ ] Ensure TypeScript **>= 5.7** to consume the published types.
- [ ] If you relied on the `browser` field or a global-script build, switch to the ESM or CJS entry point.

### 1. Package name and imports

```diff
- import { /* ... */ } from "@bcts/envelope-pattern";
+ import { /* ... */ } from "@blockchaincommons/envelope-pattern";
```

```diff
  "dependencies": {
-   "@bcts/envelope-pattern": "^1.0.0-beta.6"
+   "@blockchaincommons/envelope-pattern": "^1.0.0-beta.1"
  }
```

### 2. Version numbering restarts

`@bcts/envelope-pattern` versions moved in lockstep with every other package in the
monorepo, which is why it reached `1.0.0-beta.6`. Each extracted package now
versions independently and starts again at `1.0.0-beta.1`. A lower version
number here does **not** mean older code.

### 3. Node and TypeScript floors moved up

|                        | `@bcts/envelope-pattern` | `@blockchaincommons/envelope-pattern` |
| ---------------------- | ------------------------ | ------------------------------------- |
| Node                   | `>= 18`                  | `>= 22.12`                            |
| TypeScript (consumers) | 6.x                      | `>= 5.7`                              |

### 4. The IIFE / global-script build is gone

`@bcts/envelope-pattern` shipped an additional IIFE bundle exposed through the `browser`
field. That build is dropped: IIFE entry points cannot share chunks, which forks
module-level singletons across entry points. Use the ESM entry (`import`) or the
CJS entry (`require`); both are declared in `exports` and validated in CI by
`publint` and `@arethetypeswrong/cli`.

### 5. Peer packages renamed too

Every sibling library moved from the `@bcts` scope to `@blockchaincommons`. If
you depend on more than one, rename them together so a single copy of each
shared type is resolved:

| Old            | New                         |
| -------------- | --------------------------- |
| `@bcts/dcbor`  | `@blockchaincommons/dcbor`  |
| `@bcts/<name>` | `@blockchaincommons/<name>` |

### 6. What did not change

- The public API: every exported name, signature and type is identical.
- The wire format. Encodings produced by `@bcts/envelope-pattern` decode here, and the reverse.
- Parity with the Rust reference implementation. See [`RUST_DIVERGENCES.md`](./RUST_DIVERGENCES.md).
