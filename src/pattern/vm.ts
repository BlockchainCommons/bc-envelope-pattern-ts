/**
 * The matcher: every pattern compiles once to byte code for a small
 * back-tracking VM that walks the envelope tree, and every match runs that
 * code. Compiled programs are cached per pattern object.
 */
import type { Envelope } from "@blockchaincommons/envelope";
import { type Quantifier, Reluctance } from "@blockchaincommons/dcbor-pattern";
import { type Path, pathKey, pushAll } from "./path";
import type { Pattern } from "./types";
import { dcborCaptureNames, leafPatternPathsWithCaptures } from "./leaf";
import { type StructureOps, structurePatternPaths } from "./structure";

/** An edge of the envelope tree a thread can descend. */
export type Axis = "Subject" | "Assertion" | "Predicate" | "Object" | "Wrapped";

/** One instruction of a compiled pattern. */
export type Instr =
  | { readonly op: "MatchPredicate"; readonly literal: number }
  | { readonly op: "MatchStructure"; readonly literal: number }
  | { readonly op: "Split"; readonly a: number; readonly b: number }
  | { readonly op: "Jump"; readonly to: number }
  | { readonly op: "PushAxis"; readonly axis: Axis }
  | { readonly op: "Pop" }
  | { readonly op: "Save" }
  | { readonly op: "Accept" }
  | {
      readonly op: "Search";
      readonly literal: number;
      readonly captureMap: readonly (readonly [string, number])[];
    }
  | { readonly op: "ExtendTraversal" }
  | { readonly op: "CombineTraversal" }
  | { readonly op: "NavigateSubject" }
  | { readonly op: "NotMatch"; readonly literal: number }
  | { readonly op: "Repeat"; readonly literal: number; readonly quantifier: Quantifier }
  | { readonly op: "CaptureStart"; readonly id: number }
  | { readonly op: "CaptureEnd"; readonly id: number };

/** A compiled pattern. */
export interface Program {
  /** The instructions. */
  readonly code: readonly Instr[];
  /** The sub-patterns the instructions refer to by index. */
  readonly literals: readonly Pattern[];
  /** The capture slot names; a name repeats when the pattern captures it twice. */
  readonly captureNames: readonly string[];
}

interface Thread {
  pc: number;
  env: Envelope;
  path: Envelope[];
  savedPaths: Envelope[][];
  captures: Path[][];
  captureStack: number[][];
  seen: Set<string>;
}

const cloneThread = (th: Thread): Thread => ({
  pc: th.pc,
  env: th.env,
  path: [...th.path],
  savedPaths: th.savedPaths.map((p) => [...p]),
  captures: th.captures.map((c) => [...c]),
  captureStack: th.captureStack.map((s) => [...s]),
  seen: new Set(th.seen),
});

const sameEnvelope = (a: Envelope, b: Envelope): boolean => a.digest().equals(b.digest());

// region: compile

const compileInto = (
  pattern: Pattern,
  code: Instr[],
  literals: Pattern[],
  captures: string[],
): void => {
  switch (pattern.kind) {
    case "Leaf": {
      if (pattern.pattern.type === "Cbor" && pattern.pattern.pattern.variant === "Pattern") {
        const names: string[] = [];
        dcborCaptureNames(pattern.pattern.pattern.pattern, names);
        for (const name of names) if (!captures.includes(name)) captures.push(name);
      }
      literals.push(pattern);
      code.push({ op: "MatchPredicate", literal: literals.length - 1 });
      return;
    }
    case "Structure": {
      const s = pattern.pattern;
      switch (s.type) {
        case "Subject":
          code.push({ op: "NavigateSubject" });
          if (s.pattern.variant === "Pattern") {
            code.push({ op: "ExtendTraversal" });
            compileInto(s.pattern.pattern, code, literals, captures);
            code.push({ op: "CombineTraversal" });
          }
          return;
        case "Predicate":
        case "Object":
        case "Assertions":
          literals.push(pattern);
          code.push({ op: "MatchStructure", literal: literals.length - 1 });
          return;
        case "Wrapped":
          if (s.pattern.variant === "Any") {
            literals.push(pattern);
            code.push({ op: "MatchStructure", literal: literals.length - 1 });
          } else {
            literals.push({
              kind: "Structure",
              pattern: { type: "Wrapped", pattern: { variant: "Any" } },
            });
            code.push({ op: "MatchStructure", literal: literals.length - 1 });
            code.push({ op: "PushAxis", axis: "Wrapped" });
            compileInto(s.pattern.pattern, code, literals, captures);
          }
          return;
        case "Leaf":
        case "Node":
        case "Obscured":
        case "Digest":
          literals.push(pattern);
          code.push({ op: "MatchPredicate", literal: literals.length - 1 });
          return;
      }
    }
    // eslint-disable-next-line no-fallthrough -- every type above returns
    case "Meta": {
      const m = pattern.pattern;
      switch (m.type) {
        case "Any":
          literals.push(pattern);
          code.push({ op: "MatchPredicate", literal: literals.length - 1 });
          return;
        case "And":
          for (const p of m.patterns) compileInto(p, code, literals, captures);
          return;
        case "Or": {
          if (m.patterns.length === 0) return;
          if (m.patterns.length === 1) {
            compileInto(m.patterns[0], code, literals, captures);
            return;
          }
          const jumps: number[] = [];
          for (let i = 0; i < m.patterns.length - 1; i++) {
            const split = code.length;
            code.push({ op: "Split", a: 0, b: 0 });
            const start = code.length;
            compileInto(m.patterns[i], code, literals, captures);
            jumps.push(code.length);
            code.push({ op: "Jump", to: 0 });
            code[split] = { op: "Split", a: start, b: code.length };
          }
          compileInto(m.patterns[m.patterns.length - 1], code, literals, captures);
          for (const j of jumps) code[j] = { op: "Jump", to: code.length };
          return;
        }
        case "Not":
          literals.push(m.pattern);
          code.push({ op: "NotMatch", literal: literals.length - 1 });
          return;
        case "Search": {
          literals.push(m.pattern);
          const names: string[] = [];
          collectCaptureNames(m.pattern, names);
          const captureMap: [string, number][] = names.map((name) => {
            let at = captures.indexOf(name);
            if (at < 0) {
              at = captures.length;
              captures.push(name);
            }
            return [name, at];
          });
          code.push({ op: "Search", literal: literals.length - 1, captureMap });
          return;
        }
        case "Traverse": {
          const [first, ...rest] = m.patterns;
          if (first === undefined) return;
          compileInto(first, code, literals, captures);
          if (rest.length > 0) {
            code.push({ op: "ExtendTraversal" });
            compileInto(
              { kind: "Meta", pattern: { type: "Traverse", patterns: rest } },
              code,
              literals,
              captures,
            );
            code.push({ op: "CombineTraversal" });
          }
          return;
        }
        case "Group":
          literals.push(m.pattern);
          code.push({ op: "Repeat", literal: literals.length - 1, quantifier: m.quantifier });
          return;
        case "Capture": {
          const id = captures.length;
          captures.push(m.name);
          code.push({ op: "CaptureStart", id });
          compileInto(m.pattern, code, literals, captures);
          code.push({ op: "CaptureEnd", id });
          return;
        }
      }
    }
  }
};

/** The capture names of a pattern, in first-appearance order, appended to `out` once each. */
export const collectCaptureNames = (pattern: Pattern, out: string[]): void => {
  switch (pattern.kind) {
    case "Leaf":
      if (pattern.pattern.type === "Cbor" && pattern.pattern.pattern.variant === "Pattern") {
        dcborCaptureNames(pattern.pattern.pattern.pattern, out);
      }
      return;
    case "Structure": {
      const s = pattern.pattern;
      switch (s.type) {
        case "Subject":
        case "Predicate":
        case "Object":
          if (s.pattern.variant === "Pattern") collectCaptureNames(s.pattern.pattern, out);
          return;
        case "Assertions":
          if (s.pattern.variant !== "Any") collectCaptureNames(s.pattern.pattern, out);
          return;
        case "Wrapped":
          if (s.pattern.variant === "Unwrap") collectCaptureNames(s.pattern.pattern, out);
          return;
        default:
          return;
      }
    }
    case "Meta": {
      const m = pattern.pattern;
      switch (m.type) {
        case "Any":
          return;
        case "And":
        case "Or":
        case "Traverse":
          for (const p of m.patterns) collectCaptureNames(p, out);
          return;
        case "Not":
        case "Search":
        case "Group":
          collectCaptureNames(m.pattern, out);
          return;
        case "Capture":
          if (!out.includes(m.name)) out.push(m.name);
          collectCaptureNames(m.pattern, out);
          return;
      }
    }
  }
};

const programs = new WeakMap<Pattern, Program>();

/** The compiled program of a pattern, compiled once per pattern object. */
export const compile = (pattern: Pattern): Program => {
  const cached = programs.get(pattern);
  if (cached !== undefined) return cached;
  const code: Instr[] = [];
  const literals: Pattern[] = [];
  const captureNames: string[] = [];
  compileInto(pattern, code, literals, captureNames);
  code.push({ op: "Accept" });
  const program: Program = Object.freeze({
    code: Object.freeze(code),
    literals: Object.freeze(literals),
    captureNames: Object.freeze(captureNames),
  });
  programs.set(pattern, program);
  return program;
};

// endregion

// region: run

const ops: StructureOps = {
  matches: (pattern, env) => vmPaths(pattern, env).length > 0,
  paths: (pattern, env) => vmPaths(pattern, env),
};

const axisChildren = (axis: Axis, env: Envelope): Envelope[] => {
  const c = env.case;
  switch (axis) {
    case "Subject":
      return c.type === "node" ? [c.subject] : [];
    case "Assertion":
      return c.type === "node" ? [...c.assertions] : [];
    case "Predicate":
      return c.type === "assertion" ? [c.assertion.predicate()] : [];
    case "Object":
      return c.type === "assertion" ? [c.assertion.object()] : [];
    case "Wrapped":
      if (c.type === "node") return c.subject.isWrapped() ? [c.subject.unwrap()] : [];
      return c.type === "wrapped" ? [c.envelope] : [];
  }
};

const walkChildren = (env: Envelope): Envelope[] => {
  const c = env.case;
  switch (c.type) {
    case "node":
      return [c.subject, ...c.assertions];
    case "wrapped":
      return [c.envelope];
    case "assertion":
      return [c.assertion.predicate(), c.assertion.object()];
    default:
      return [];
  }
};

/** The paths and captures of an atomic literal: a leaf, a structure or `*`. */
const atomicPathsWithCaptures = (p: Pattern, env: Envelope): [Path[], Map<string, Path[]>] => {
  switch (p.kind) {
    case "Leaf":
      return leafPatternPathsWithCaptures(p.pattern, env);
    case "Structure":
      return [structurePatternPaths(p.pattern, env, ops), new Map<string, Path[]>()];
    case "Meta":
      return [[[env]], new Map<string, Path[]>()];
  }
};

const repeatPaths = (
  pat: Pattern,
  env: Envelope,
  path: Envelope[],
  quantifier: Quantifier,
): [Envelope, Envelope[]][] => {
  const states: [Envelope, Envelope[]][][] = [[[env, [...path]]]];
  const bound = quantifier.max ?? Number.MAX_SAFE_INTEGER;
  for (let i = 0; i < bound; i++) {
    const next: [Envelope, Envelope[]][] = [];
    for (const [e, pth] of states[states.length - 1]) {
      for (const subPath of vmPaths(pat, e)) {
        const last = subPath[subPath.length - 1];
        if (last === undefined || sameEnvelope(last, e)) continue;
        const combined = [...pth];
        const first = subPath[0];
        combined.push(
          ...(first !== undefined && sameEnvelope(first, e) ? subPath.slice(1) : subPath),
        );
        next.push([last, combined]);
      }
    }
    if (next.length === 0) break;
    states.push(next);
  }
  const hasZeroRep = quantifier.min === 0;
  const zeroRep: [Envelope, Envelope[]][] = hasZeroRep ? [[env, [...path]]] : [];
  const maxAllowed = Math.min(bound, states.length - 1);
  if (maxAllowed < quantifier.min && quantifier.min > 0) return [];
  const minCount = quantifier.min === 0 ? 1 : quantifier.min;
  if (maxAllowed < minCount) return zeroRep;
  const maxCount = maxAllowed;
  const counts: number[] = [];
  switch (quantifier.reluctance) {
    case Reluctance.Greedy:
      for (let c = maxCount; c >= minCount; c--) counts.push(c);
      break;
    case Reluctance.Lazy:
      for (let c = minCount; c <= maxCount; c++) counts.push(c);
      break;
    case Reluctance.Possessive:
      counts.push(maxCount);
      break;
  }
  const out: [Envelope, Envelope[]][] = [];
  if (quantifier.reluctance === Reluctance.Greedy) {
    for (const c of counts) pushAll(out, states[c] ?? []);
    if (hasZeroRep && out.length === 0) out.push([env, [...path]]);
  } else {
    if (hasZeroRep) out.push([env, [...path]]);
    for (const c of counts) pushAll(out, states[c] ?? []);
  }
  return out;
};

const addCaptures = (
  prog: Program,
  captures: Path[][],
  found: ReadonlyMap<string, readonly Path[]>,
): void => {
  for (const [name, paths] of found) {
    const at = prog.captureNames.indexOf(name);
    if (at >= 0 && at < captures.length) pushAll(captures[at], paths);
  }
};

const runThread = (prog: Program, start: Thread, out: [Path, Path[][]][]): boolean => {
  let produced = false;
  const stack: Thread[] = [start];
  while (stack.length > 0) {
    const th = stack.pop();
    if (th === undefined) break;
    let alive = true;
    while (alive) {
      const instr = prog.code[th.pc];
      switch (instr.op) {
        case "MatchPredicate": {
          const [paths, patternCaptures] = atomicPathsWithCaptures(
            prog.literals[instr.literal],
            th.env,
          );
          if (paths.length === 0) {
            alive = false;
            break;
          }
          th.pc += 1;
          // captures are distributed one per path when the counts agree, else all to the first
          const distributed = paths.map(() => new Map<string, Path[]>());
          for (const [name, capturePaths] of patternCaptures) {
            if (capturePaths.length === paths.length) {
              capturePaths.forEach((p, i) => {
                const existing = distributed[i].get(name) ?? [];
                existing.push(p);
                distributed[i].set(name, existing);
              });
            } else {
              const existing = distributed[0].get(name) ?? [];
              pushAll(existing, capturePaths);
              distributed[0].set(name, existing);
            }
          }
          const first = paths[0];
          if (!(first.length === 1 && sameEnvelope(first[0], th.env))) {
            th.path = [...first];
            th.env = first[first.length - 1];
          }
          addCaptures(prog, th.captures, distributed[0]);
          for (let i = paths.length - 1; i >= 1; i--) {
            const fork = cloneThread(th);
            for (const slot of fork.captures) slot.length = 0;
            const p = paths[i];
            fork.path = [...p];
            fork.env = p[p.length - 1];
            addCaptures(prog, fork.captures, distributed[i]);
            stack.push(fork);
          }
          break;
        }
        case "MatchStructure": {
          const literal = prog.literals[instr.literal];
          const structurePaths =
            literal.kind === "Structure" ? structurePatternPaths(literal.pattern, th.env, ops) : [];
          if (structurePaths.length === 0) {
            alive = false;
            break;
          }
          th.pc += 1;
          const first = structurePaths[0];
          th.path = [...first];
          th.env = first[first.length - 1];
          // forks in source order, so they pop last-first
          for (let i = 1; i < structurePaths.length; i++) {
            const fork = cloneThread(th);
            const p = structurePaths[i];
            fork.path = [...p];
            fork.env = p[p.length - 1];
            stack.push(fork);
          }
          break;
        }
        case "Split": {
          const fork = cloneThread(th);
          fork.pc = instr.a;
          stack.push(fork);
          th.pc = instr.b;
          break;
        }
        case "Jump":
          th.pc = instr.to;
          break;
        case "PushAxis": {
          th.pc += 1;
          for (const child of axisChildren(instr.axis, th.env)) {
            const fork = cloneThread(th);
            fork.env = child;
            fork.path.push(child);
            stack.push(fork);
          }
          alive = false; // the parent path stops here
          break;
        }
        case "Pop":
          th.path.pop();
          th.pc += 1;
          break;
        case "Save":
          out.push([[...th.path], th.captures.map((c) => [...c])]);
          produced = true;
          th.pc += 1;
          break;
        case "Accept":
          out.push([[...th.path], th.captures.map((c) => [...c])]);
          produced = true;
          alive = false;
          break;
        case "Search": {
          const [found, caps] = vmPathsWithCapturesRaw(prog.literals[instr.literal], th.env);
          if (found.length > 0) {
            produced = true;
            for (const foundPath of found) {
              const resultPath = [...th.path];
              const first = foundPath[0];
              resultPath.push(
                ...(first !== undefined && sameEnvelope(first, th.env)
                  ? foundPath.slice(1)
                  : foundPath),
              );
              const resultCaps = th.captures.map((c) => [...c]);
              for (const [name, at] of instr.captureMap) {
                const paths = caps.get(name);
                if (paths !== undefined) pushAll(resultCaps[at], paths);
              }
              const key = pathKey(resultPath);
              if (!th.seen.has(key)) {
                th.seen.add(key);
                out.push([resultPath, resultCaps]);
              }
            }
          }
          // every child is searched too, in tree order
          const children = walkChildren(th.env);
          for (let i = children.length - 1; i >= 0; i--) {
            const fork = cloneThread(th);
            fork.env = children[i];
            fork.path.push(children[i]);
            stack.push(fork);
          }
          alive = false;
          break;
        }
        case "ExtendTraversal": {
          const last = th.path[th.path.length - 1];
          if (last !== undefined) {
            th.savedPaths.push([...th.path]);
            th.env = last;
            th.path = [last];
          }
          th.pc += 1;
          break;
        }
        case "CombineTraversal": {
          const saved = th.savedPaths.pop();
          if (saved !== undefined) {
            const combined = [...saved];
            const savedLast = saved[saved.length - 1];
            const currentFirst = th.path[0];
            if (
              savedLast !== undefined &&
              currentFirst !== undefined &&
              sameEnvelope(savedLast, currentFirst)
            ) {
              combined.push(...th.path.slice(1));
            } else {
              combined.push(...th.path);
            }
            th.path = combined;
          }
          th.pc += 1;
          break;
        }
        case "NavigateSubject":
          if (th.env.isNode()) {
            const subject = th.env.subject();
            th.env = subject;
            th.path.push(subject);
          }
          th.pc += 1;
          break;
        case "NotMatch":
          if (vmPaths(prog.literals[instr.literal], th.env).length > 0) {
            alive = false;
          } else {
            th.pc += 1;
          }
          break;
        case "Repeat": {
          const results = repeatPaths(
            prog.literals[instr.literal],
            th.env,
            th.path,
            instr.quantifier,
          );
          const nextPc = th.pc + 1;
          // the first repetition count that lets the rest match wins
          for (const [envAfter, pathAfter] of results) {
            const fork = cloneThread(th);
            fork.pc = nextPc;
            fork.env = envAfter;
            fork.path = pathAfter;
            if (runThread(prog, fork, out)) {
              produced = true;
              break;
            }
          }
          alive = false;
          break;
        }
        case "CaptureStart":
          if (instr.id < th.captureStack.length) th.captureStack[instr.id].push(th.path.length - 1);
          th.pc += 1;
          break;
        case "CaptureEnd": {
          if (instr.id < th.captureStack.length) {
            const startIdx = th.captureStack[instr.id].pop();
            if (startIdx !== undefined && instr.id < th.captures.length) {
              let end = th.path.length;
              if (prog.code[th.pc + 1]?.op === "ExtendTraversal") end = Math.max(0, end - 1);
              th.captures[instr.id].push(th.path.slice(startIdx, end));
            }
          }
          th.pc += 1;
          break;
        }
      }
    }
  }
  return produced;
};

/** Runs a program from `root`: every `Save` and `Accept` yields the thread's path and captures. */
export const run = (prog: Program, root: Envelope): [Path, Map<string, Path[]>][] => {
  const out: [Path, Path[][]][] = [];
  runThread(
    prog,
    {
      pc: 0,
      env: root,
      path: [root],
      savedPaths: [],
      captures: prog.captureNames.map(() => []),
      captureStack: prog.captureNames.map(() => []),
      seen: new Set(),
    },
    out,
  );
  return out.map(([path, slots]) => {
    // a name captured twice keeps its last non-empty slot
    const map = new Map<string, Path[]>();
    slots.forEach((paths, i) => {
      if (paths.length > 0) map.set(prog.captureNames[i], paths);
    });
    return [path, map];
  });
};

const vmPathsWithCapturesRaw = (pattern: Pattern, env: Envelope): [Path[], Map<string, Path[]>] => {
  const paths: Path[] = [];
  const captures = new Map<string, Path[]>();
  for (const [path, caps] of run(compile(pattern), env)) {
    paths.push(path);
    for (const [name, list] of caps) captures.set(name, [...(captures.get(name) ?? []), ...list]);
  }
  return [paths, captures];
};

/** Every path a pattern matches in `env`, with the paths each capture name matched. */
export const vmPathsWithCaptures = (
  pattern: Pattern,
  env: Envelope,
): [Path[], Map<string, Path[]>] => vmPathsWithCapturesRaw(pattern, env);

/** Every path a pattern matches in `env`. */
export const vmPaths = (pattern: Pattern, env: Envelope): Path[] =>
  vmPathsWithCapturesRaw(pattern, env)[0];

// endregion
