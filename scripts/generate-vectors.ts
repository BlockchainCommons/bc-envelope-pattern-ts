/**
 * Golden vector generator. `bun scripts/generate-vectors.ts`.
 * Materialises the golden recipe subset with the WORKING TREE and writes
 * tests/vectors/vectors.json. With VECTORS_FROM=baseline it materialises
 * with the frozen bundle instead, the way the file was first created.
 * Regenerating is a deliberate, reviewed act.
 *
 * The known-values directory configuration is pinned to no directories
 * before anything runs, as the test setup file pins it, so no vector reads
 * this machine's `~/.known-values`.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DirectoryConfig, setDirectoryConfig } from "@blockchaincommons/known-values";

// pinned before the corpus builds its known-value haystacks
setDirectoryConfig(new DirectoryConfig());
const { materialize, recipeName, baselineAdapterFor, adapterFor } =
  await import("../tests/vectors/recipes.ts");
const { goldenRecipes } = await import("../tests/corpus/corpus.ts");
const { currentDeps } = await import("../tests/vectors/deps.ts");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const api =
  process.env["VECTORS_FROM"] === "baseline"
    ? baselineAdapterFor(await import("../tests/baseline/envelope-pattern-baseline.mjs"))
    : adapterFor(
        { ...(await import("../src/index.ts")), ...(await import("../src/format.ts")) },
        currentDeps,
      );
const vectors: { name: string; recipe: unknown; expect: string }[] = [];
for (const recipe of goldenRecipes())
  vectors.push({ name: recipeName(recipe), recipe, expect: materialize(api, recipe) });
writeFileSync(
  join(root, "tests/vectors/vectors.json"),
  JSON.stringify({ count: vectors.length, vectors }, null, 1) + "\n",
);
console.log(
  `wrote ${vectors.length} vectors from ${process.env["VECTORS_FROM"] === "baseline" ? "the frozen baseline" : "working tree"}`,
);
