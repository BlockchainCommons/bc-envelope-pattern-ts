/**
 * Parses patterns, matches them against an envelope, formats the paths and
 * captures, builds a pattern programmatically, and shows a parse error.
 *
 *   bun examples/patterns.ts
 */
import { Envelope } from "@blockchaincommons/envelope";
import { registerTags } from "@blockchaincommons/envelope/format";
import {
  EnvelopePatternError,
  and,
  anyNode,
  capture,
  display,
  matches,
  parseEnvelopePattern,
  paths,
  pathsWithCaptures,
  search,
  text,
  tryParseEnvelopePattern,
} from "@blockchaincommons/envelope-pattern";
import { formatPaths } from "@blockchaincommons/envelope-pattern/format";

// digests render as URs and known values by name once the envelope tags are registered
registerTags();

const alice = Envelope.from("Alice").addAssertion("knows", "Bob").addAssertion("knows", "Carol");

// A pattern parsed from text, then matched.
const pattern = parseEnvelopePattern('search(assertpred("knows") -> obj(@who(text)))');
console.log(display(pattern)); // search(assertpred("knows") -> obj(@who(text)))
console.log(matches(pattern, alice)); // true
console.log(paths(pattern, alice).length); // 2

// The same match with its captures, formatted one element per line.
const { paths: found, captures } = pathsWithCaptures(pattern, alice);
console.log(formatPaths(found, { captures }));

// A pattern built programmatically; `&` runs its operands in sequence from the same position.
const built = and(anyNode(), search(capture("name", text("Bob"))));
console.log(display(built)); // node & search(@name("Bob"))
console.log(pathsWithCaptures(built, alice).captures.get("name")?.length); // 1

// A rejected pattern: the error names the code and where it was found.
const rejected = tryParseEnvelopePattern("subj(text");
if (!rejected.ok) {
  console.log(rejected.error.code); // ExpectedCloseParen
  console.log(rejected.error.span); // { start: 9, end: 9 }
}
try {
  parseEnvelopePattern("text $");
} catch (e) {
  // the message with the source line and a caret under the span
  if (EnvelopePatternError.isEnvelopePatternError(e)) console.log(e.fullMessage("text $"));
}
