/**
 * Structure patterns: elements of the envelope tree. The direct matchers
 * here serve the VM's `MatchStructure` and `MatchPredicate` instructions;
 * they recurse through the operations they are handed.
 */
import type { Envelope } from "@blockchaincommons/envelope";
import type { Path } from "./path";
import type { Pattern, StructurePattern } from "./types";

/** The operations a structure matcher recurses through. */
export interface StructureOps {
  /** Whether a pattern matches an envelope. */
  readonly matches: (pattern: Pattern, env: Envelope) => boolean;
  /** Every path a pattern matches in an envelope. */
  readonly paths: (pattern: Pattern, env: Envelope) => Path[];
}

const latin1 = (bytes: Uint8Array): string => {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return s;
};

/** Every path a structure pattern matches in `env`, without descending through the VM. */
export const structurePatternPaths = (
  pattern: StructurePattern,
  env: Envelope,
  ops: StructureOps,
): Path[] => {
  switch (pattern.type) {
    case "Leaf":
      return env.isLeaf() || env.isKnownValue() ? [[env]] : [];
    case "Assertions": {
      const out: Path[] = [];
      for (const assertion of env.assertions()) {
        const p = pattern.pattern;
        if (p.variant === "Any") {
          out.push([assertion]);
        } else if (p.variant === "WithPredicate") {
          const predicate = assertion.asPredicate();
          if (predicate !== undefined && ops.matches(p.pattern, predicate)) out.push([assertion]);
        } else {
          const object = assertion.asObject();
          if (object !== undefined && ops.matches(p.pattern, object)) out.push([assertion]);
        }
      }
      return out;
    }
    case "Digest": {
      const digest = env.digest();
      const p = pattern.pattern;
      let hit: boolean;
      switch (p.variant) {
        case "Digest":
          hit = p.digest.equals(digest);
          break;
        case "Prefix": {
          const data = digest.bytes;
          hit = p.prefix.length <= data.length && p.prefix.every((byte, i) => data[i] === byte);
          break;
        }
        case "BinaryRegex":
          hit = p.regex.regex.test(latin1(digest.bytes));
          break;
      }
      return hit ? [[env]] : [];
    }
    case "Node": {
      if (!env.isNode()) return [];
      const p = pattern.pattern;
      const hit = p.variant === "Any" || p.interval.contains(env.assertions().length);
      return hit ? [[env]] : [];
    }
    case "Object": {
      const object = env.asObject();
      if (object === undefined) return [];
      const p = pattern.pattern;
      return p.variant === "Any" || ops.matches(p.pattern, object) ? [[object]] : [];
    }
    case "Obscured": {
      let hit: boolean;
      switch (pattern.pattern.variant) {
        case "Any":
          hit = env.isObscured();
          break;
        case "Elided":
          hit = env.isElided();
          break;
        case "Encrypted":
          hit = env.isEncrypted();
          break;
        case "Compressed":
          hit = env.isCompressed();
          break;
      }
      return hit ? [[env]] : [];
    }
    case "Predicate": {
      const predicate = env.asPredicate();
      if (predicate === undefined) return [];
      const p = pattern.pattern;
      return p.variant === "Any" || ops.matches(p.pattern, predicate) ? [[predicate]] : [];
    }
    case "Subject": {
      const subject = env.subject();
      const p = pattern.pattern;
      return p.variant === "Any" || ops.matches(p.pattern, subject) ? [[subject]] : [];
    }
    case "Wrapped": {
      const subject = env.subject();
      if (!subject.isWrapped()) return [];
      const p = pattern.pattern;
      if (p.variant === "Any") return [[env]];
      return ops.paths(p.pattern, subject.unwrap()).map((path) => [env, ...path]);
    }
  }
};

/** The canonical text of a structure pattern. */
export const structurePatternDisplay = (
  pattern: StructurePattern,
  display: (p: Pattern) => string,
): string => {
  switch (pattern.type) {
    case "Leaf":
      return "leaf";
    case "Assertions": {
      const p = pattern.pattern;
      if (p.variant === "Any") return "assert";
      return p.variant === "WithPredicate"
        ? `assertpred(${display(p.pattern)})`
        : `assertobj(${display(p.pattern)})`;
    }
    case "Digest": {
      const p = pattern.pattern;
      switch (p.variant) {
        case "Digest":
          return `digest(${p.digest.toUR().toString()})`;
        case "Prefix":
          return `digest(${Array.from(p.prefix, (b) => b.toString(16).padStart(2, "0")).join("")})`;
        case "BinaryRegex":
          return `digest(/${p.regex.source}/)`;
      }
    }
    // eslint-disable-next-line no-fallthrough -- every variant above returns
    case "Node": {
      const p = pattern.pattern;
      return p.variant === "Any" ? "node" : `node(${p.interval.rangeNotation()})`;
    }
    case "Object": {
      const p = pattern.pattern;
      return p.variant === "Any" ? "obj" : `obj(${display(p.pattern)})`;
    }
    case "Obscured":
      switch (pattern.pattern.variant) {
        case "Any":
          return "obscured";
        case "Elided":
          return "elided";
        case "Encrypted":
          return "encrypted";
        case "Compressed":
          return "compressed";
      }
    // eslint-disable-next-line no-fallthrough -- every variant above returns
    case "Predicate": {
      const p = pattern.pattern;
      return p.variant === "Any" ? "pred" : `pred(${display(p.pattern)})`;
    }
    case "Subject": {
      const p = pattern.pattern;
      return p.variant === "Any" ? "subj" : `subj(${display(p.pattern)})`;
    }
    case "Wrapped": {
      const p = pattern.pattern;
      if (p.variant === "Any") return "wrapped";
      const inner = p.pattern;
      return inner.kind === "Meta" && inner.pattern.type === "Any"
        ? "unwrap"
        : `unwrap(${display(inner)})`;
    }
  }
};

/** Whether two structure patterns are the same pattern. */
export const structurePatternEquals = (
  a: StructurePattern,
  b: StructurePattern,
  equals: (p: Pattern, q: Pattern) => boolean,
): boolean => {
  if (a.type !== b.type) return false;
  switch (a.type) {
    case "Leaf":
      return true;
    case "Assertions": {
      const x = a.pattern;
      const y = (b as typeof a).pattern;
      if (x.variant !== y.variant) return false;
      return x.variant === "Any" || equals(x.pattern, (y as typeof x).pattern);
    }
    case "Digest": {
      const x = a.pattern;
      const y = (b as typeof a).pattern;
      if (x.variant !== y.variant) return false;
      switch (x.variant) {
        case "Digest":
          return x.digest.equals((y as typeof x).digest);
        case "Prefix": {
          const other = (y as typeof x).prefix;
          return x.prefix.length === other.length && x.prefix.every((v, i) => v === other[i]);
        }
        case "BinaryRegex":
          return x.regex.source === (y as typeof x).regex.source;
      }
    }
    // eslint-disable-next-line no-fallthrough -- every variant above returns
    case "Node": {
      const x = a.pattern;
      const y = (b as typeof a).pattern;
      if (x.variant !== y.variant) return false;
      return x.variant === "Any" || x.interval.equals((y as typeof x).interval);
    }
    case "Object":
    case "Predicate":
    case "Subject": {
      const x = a.pattern as { variant: "Any" } | { variant: "Pattern"; pattern: Pattern };
      const y = (b as typeof a).pattern as
        { variant: "Any" } | { variant: "Pattern"; pattern: Pattern };
      if (x.variant !== y.variant) return false;
      return x.variant === "Any" || equals(x.pattern, (y as typeof x).pattern);
    }
    case "Obscured":
      return a.pattern.variant === (b as typeof a).pattern.variant;
    case "Wrapped": {
      const x = a.pattern;
      const y = (b as typeof a).pattern;
      if (x.variant !== y.variant) return false;
      return x.variant === "Any" || equals(x.pattern, (y as typeof x).pattern);
    }
  }
};
