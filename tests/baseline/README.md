# Frozen baseline build

`envelope-pattern-baseline.mjs` is the self-contained ESM bundle of `@blockchaincommons/envelope-pattern` built from
commit `4661ed22ed5116e2ed0cebfe8a38b09b378d8206`, the pre-redesign wire-format reference. Sibling
`@blockchaincommons/*` packages are INLINED from their own frozen baseline
bundles (@blockchaincommons/crypto, @blockchaincommons/rand, @blockchaincommons/envelope, @blockchaincommons/lifehash, @blockchaincommons/dcbor-parse, @blockchaincommons/sskr, @blockchaincommons/tags, @blockchaincommons/dcbor-pattern, @blockchaincommons/known-values, @blockchaincommons/components, @blockchaincommons/uniform-resources, @blockchaincommons/shamir), so this bundle keeps the
pre-redesign behaviour of its dependencies after they change.
`envelope-pattern-baseline.d.mts` is the public surface at that commit.

`tests/differential.test.ts` runs every corpus recipe through this bundle and
the working tree and asserts identical outcomes; it pins the sha256 below so
an accidental rebuild cannot turn the differential into a self-comparison.

Baseline commit: 4661ed22ed5116e2ed0cebfe8a38b09b378d8206
Baseline sha256: 869796f9a68d7142a4f654ca2075386db9f13a681bcba5307d9e08d5fbb7bea1
