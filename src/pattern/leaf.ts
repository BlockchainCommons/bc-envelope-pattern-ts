/**
 * Leaf patterns: a dCBOR pattern applied to the subject's CBOR. Every
 * matcher here is a pure function over the frozen pattern data; the dCBOR
 * matching itself is dcbor-pattern's.
 */
import { Envelope } from "@blockchaincommons/envelope";
import { type Cbor, cborEquals } from "@blockchaincommons/dcbor";
import { diagnostic } from "@blockchaincommons/dcbor/diagnostic";
import {
  type Pattern as DcborPattern,
  display as dcborDisplay,
  pathsWithCaptures as dcborPathsWithCaptures,
  patternEquals as dcborPatternEquals,
} from "@blockchaincommons/dcbor-pattern";
import * as D from "@blockchaincommons/dcbor-pattern/patterns";
import type { Path } from "./path";
import type { CborPattern, LeafPattern } from "./types";

/** The subject's CBOR when the subject is a leaf. */
const subjectLeaf = (env: Envelope): Cbor | undefined => {
  const c = env.subject().case;
  return c.type === "leaf" ? c.cbor : undefined;
};

/** The subject's CBOR when the subject is a known value. */
const subjectKnownValue = (env: Envelope): Cbor | undefined => {
  const c = env.subject().case;
  return c.type === "knownValue" ? c.value.toCbor() : undefined;
};

const none = (): [Path[], Map<string, Path[]>] => [[], new Map<string, Path[]>()];
const self = (env: Envelope): [Path[], Map<string, Path[]>] => [[[env]], new Map<string, Path[]>()];

/** A dCBOR path under the envelope, the base value dropped when it leads. */
const extend = (env: Envelope, base: Cbor | undefined, dcborPath: readonly Cbor[]): Path => {
  const first = dcborPath[0];
  const skipFirst = base !== undefined && first !== undefined && cborEquals(first, base);
  const path: Envelope[] = [env];
  for (const element of skipFirst ? dcborPath.slice(1) : dcborPath)
    path.push(Envelope.leaf(element));
  return path;
};

const convertCaptures = (
  captures: ReadonlyMap<string, readonly (readonly Cbor[])[]>,
  env: Envelope,
  base: Cbor | undefined,
): Map<string, Path[]> => {
  const out = new Map<string, Path[]>();
  for (const [name, paths] of captures)
    out.set(
      name,
      paths.map((p) => extend(env, base, p)),
    );
  return out;
};

const cborPatternPathsWithCaptures = (
  pattern: CborPattern,
  env: Envelope,
): [Path[], Map<string, Path[]>] => {
  const known = subjectKnownValue(env);
  if (known !== undefined) {
    switch (pattern.variant) {
      case "Any":
        return self(env);
      case "Value":
        return cborEquals(known, pattern.cbor) ? self(env) : none();
      case "Pattern": {
        const r = dcborPathsWithCaptures(pattern.pattern, known);
        if (r.paths.length === 0) return none();
        // a known value's own CBOR always leads the dCBOR path; the envelope replaces it
        const paths = r.paths.map((p) => extend(env, p[0], p));
        return [paths, convertCaptures(r.captures, env, subjectLeaf(env))];
      }
    }
  }
  const leaf = subjectLeaf(env);
  if (leaf === undefined) return none();
  switch (pattern.variant) {
    case "Any":
      return self(env);
    case "Value":
      return cborEquals(leaf, pattern.cbor) ? self(env) : none();
    case "Pattern": {
      const r = dcborPathsWithCaptures(pattern.pattern, leaf);
      if (r.paths.length === 0) return none();
      return [r.paths.map((p) => extend(env, leaf, p)), convertCaptures(r.captures, env, leaf)];
    }
  }
};

/** Every path a leaf pattern matches in `env`, with the captures of an embedded dCBOR pattern. */
export const leafPatternPathsWithCaptures = (
  pattern: LeafPattern,
  env: Envelope,
): [Path[], Map<string, Path[]>] => {
  switch (pattern.type) {
    case "Cbor":
      return cborPatternPathsWithCaptures(pattern.pattern, env);
    case "KnownValue": {
      const known = subjectKnownValue(env);
      if (known === undefined) return none();
      return [
        D.knownValuePatternPaths(pattern.pattern, known).map((): Path => [env]),
        new Map<string, Path[]>(),
      ];
    }
    case "Tagged": {
      const leaf = subjectLeaf(env);
      if (leaf === undefined) return none();
      const [paths, captures] = D.taggedPatternPathsWithCaptures(pattern.pattern, leaf);
      const out = new Map<string, Path[]>();
      for (const [name, list] of captures)
        out.set(
          name,
          list.map(() => [env]),
        );
      return [paths.map(() => [env]), out];
    }
    case "Array": {
      const leaf = subjectLeaf(env);
      return leaf !== undefined && D.arrayPatternMatches(pattern.pattern, leaf)
        ? self(env)
        : none();
    }
    case "Map": {
      const leaf = subjectLeaf(env);
      return leaf !== undefined && D.mapPatternMatches(pattern.pattern, leaf) ? self(env) : none();
    }
    case "Null": {
      const leaf = subjectLeaf(env);
      return leaf !== undefined && D.nullPatternMatches(pattern.pattern, leaf) ? self(env) : none();
    }
    case "Number": {
      const leaf = subjectLeaf(env);
      return leaf !== undefined && D.numberPatternPaths(pattern.pattern, leaf).length > 0
        ? self(env)
        : none();
    }
    case "Text": {
      const leaf = subjectLeaf(env);
      return leaf !== undefined && D.textPatternPaths(pattern.pattern, leaf).length > 0
        ? self(env)
        : none();
    }
    case "ByteString": {
      const leaf = subjectLeaf(env);
      return leaf !== undefined && D.byteStringPatternPaths(pattern.pattern, leaf).length > 0
        ? self(env)
        : none();
    }
    case "Date": {
      const leaf = subjectLeaf(env);
      return leaf !== undefined && D.datePatternPaths(pattern.pattern, leaf).length > 0
        ? self(env)
        : none();
    }
    case "Bool": {
      const leaf = subjectLeaf(env);
      return leaf !== undefined && D.boolPatternPaths(pattern.pattern, leaf).length > 0
        ? self(env)
        : none();
    }
  }
};

/** The canonical text of a leaf pattern. */
export const leafPatternDisplay = (pattern: LeafPattern): string => {
  switch (pattern.type) {
    case "Cbor":
      switch (pattern.pattern.variant) {
        case "Any":
          return "cbor";
        case "Value":
          return `cbor(${diagnostic(pattern.pattern.cbor, { flat: true })})`;
        case "Pattern":
          return `cbor(/${dcborDisplay(pattern.pattern.pattern)}/)`;
      }
    // eslint-disable-next-line no-fallthrough -- every variant above returns
    case "Number":
      // a negative zero keeps its sign
      return pattern.pattern.variant === "Value" && Object.is(pattern.pattern.value, -0)
        ? "-0"
        : D.numberPatternDisplay(pattern.pattern);
    case "Text":
      return D.textPatternDisplay(pattern.pattern);
    case "ByteString":
      return D.byteStringPatternDisplay(pattern.pattern);
    case "Tagged":
      return D.taggedPatternDisplay(pattern.pattern, dcborDisplay).replace(",  ", ", ");
    case "Array":
      return D.arrayPatternDisplay(pattern.pattern, dcborDisplay);
    case "Map":
      return D.mapPatternDisplay(pattern.pattern, dcborDisplay);
    case "Bool":
      return D.boolPatternDisplay(pattern.pattern);
    case "Null":
      return D.nullPatternDisplay(pattern.pattern);
    case "Date":
      return D.datePatternDisplay(pattern.pattern);
    case "KnownValue":
      return D.knownValuePatternDisplay(pattern.pattern);
  }
};

const value = (v: D.ValuePattern): DcborPattern => ({ kind: "Value", pattern: v });

/** Whether two leaf patterns are the same pattern. */
export const leafPatternEquals = (a: LeafPattern, b: LeafPattern): boolean => {
  if (a.type !== b.type) return false;
  switch (a.type) {
    case "Cbor": {
      const other = (b as typeof a).pattern;
      if (a.pattern.variant !== other.variant) return false;
      switch (a.pattern.variant) {
        case "Any":
          return true;
        case "Value":
          return cborEquals(a.pattern.cbor, (other as typeof a.pattern).cbor);
        case "Pattern":
          return dcborPatternEquals(a.pattern.pattern, (other as typeof a.pattern).pattern);
      }
    }
    // eslint-disable-next-line no-fallthrough -- every variant above returns
    case "Number":
      return dcborPatternEquals(
        value(D.valueNumber(a.pattern)),
        value(D.valueNumber((b as typeof a).pattern)),
      );
    case "Text":
      return dcborPatternEquals(
        value(D.valueText(a.pattern)),
        value(D.valueText((b as typeof a).pattern)),
      );
    case "ByteString":
      return dcborPatternEquals(
        value(D.valueByteString(a.pattern)),
        value(D.valueByteString((b as typeof a).pattern)),
      );
    case "Tagged":
      return D.taggedPatternEquals(a.pattern, (b as typeof a).pattern, dcborPatternEquals);
    case "Array":
      return D.arrayPatternEquals(a.pattern, (b as typeof a).pattern, dcborPatternEquals);
    case "Map":
      return D.mapPatternEquals(a.pattern, (b as typeof a).pattern, dcborPatternEquals);
    case "Bool":
      return dcborPatternEquals(
        value(D.valueBool(a.pattern)),
        value(D.valueBool((b as typeof a).pattern)),
      );
    case "Null":
      return true;
    case "Date":
      return dcborPatternEquals(
        value(D.valueDate(a.pattern)),
        value(D.valueDate((b as typeof a).pattern)),
      );
    case "KnownValue":
      return dcborPatternEquals(
        value(D.valueKnownValue(a.pattern)),
        value(D.valueKnownValue((b as typeof a).pattern)),
      );
  }
};

/** The capture names inside a dCBOR pattern, in first-appearance order, appended to `out` once each. */
export const dcborCaptureNames = (pattern: DcborPattern, out: string[]): void => {
  switch (pattern.kind) {
    case "Value":
      return;
    case "Structure": {
      const s = pattern.pattern;
      switch (s.type) {
        case "Array":
          if (s.pattern.variant === "Elements") dcborCaptureNames(s.pattern.pattern, out);
          return;
        case "Map":
          if (s.pattern.variant === "Constraints") {
            for (const [k, v] of s.pattern.constraints) {
              dcborCaptureNames(k, out);
              dcborCaptureNames(v, out);
            }
          }
          return;
        case "Tagged":
          if (s.pattern.variant !== "Any") dcborCaptureNames(s.pattern.pattern, out);
          return;
      }
    }
    // eslint-disable-next-line no-fallthrough -- every type above returns
    case "Meta": {
      const m = pattern.pattern;
      switch (m.type) {
        case "Any":
          return;
        case "And":
        case "Or":
        case "Sequence":
          for (const p of m.pattern.patterns) dcborCaptureNames(p, out);
          return;
        case "Not":
        case "Search":
        case "Repeat":
          dcborCaptureNames(m.pattern.pattern, out);
          return;
        case "Capture":
          if (!out.includes(m.pattern.name)) out.push(m.pattern.name);
          dcborCaptureNames(m.pattern.pattern, out);
          return;
      }
    }
  }
};
