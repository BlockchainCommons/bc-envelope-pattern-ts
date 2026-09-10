/**
 * Argument checks at the public boundary: a `TypeError` for a value that is
 * not what the signature says, before any matcher runs on it.
 */
import { Envelope } from "@blockchaincommons/envelope";
import type { Pattern } from "./types";

const isPattern = (value: unknown): value is Pattern =>
  typeof value === "object" &&
  value !== null &&
  "kind" in value &&
  (value.kind === "Leaf" || value.kind === "Structure" || value.kind === "Meta") &&
  "pattern" in value &&
  typeof value.pattern === "object" &&
  value.pattern !== null;

/** @throws {TypeError} when `value` is not a `Pattern` */
export const requirePattern = (value: unknown, what = "pattern"): Pattern => {
  if (!isPattern(value)) throw new TypeError(`${what} must be a Pattern`);
  return value;
};

/** @throws {TypeError} when any operand is not a `Pattern` */
export const requirePatterns = (values: readonly unknown[], what: string): Pattern[] =>
  values.map((v, i) => requirePattern(v, `${what} operand ${i}`));

/** @throws {TypeError} when `value` is not an `Envelope` */
export const requireEnvelope = (value: unknown, what = "haystack"): Envelope => {
  if (!(value instanceof Envelope)) throw new TypeError(`${what} must be an Envelope`);
  return value;
};

/** @throws {TypeError} when `value` is not a string */
export const requireString = (value: unknown, what: string): string => {
  if (typeof value !== "string") throw new TypeError(`${what} must be a string`);
  return value;
};

/** @throws {TypeError} when `value` is not a number */
export const requireNumber = (value: unknown, what: string): number => {
  if (typeof value !== "number") throw new TypeError(`${what} must be a number`);
  return value;
};

/** @throws {TypeError} when `value` is not a `Uint8Array` */
export const requireBytes = (value: unknown, what: string): Uint8Array => {
  if (!(value instanceof Uint8Array)) throw new TypeError(`${what} must be a Uint8Array`);
  return value;
};
