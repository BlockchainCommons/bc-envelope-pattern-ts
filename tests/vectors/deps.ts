/**
 * The working tree's envelope decoder for haystacks. Registers envelope's
 * tags and summarisers, as the reference's tests and harness call
 * `bc_envelope::register_tags()`, so digests render as URs.
 */
import { Envelope } from "@blockchaincommons/envelope";
import { registerTags } from "@blockchaincommons/envelope/format";
import type { CurrentDeps } from "./recipes";

registerTags();

export const currentDeps: CurrentDeps = {
  envelopeFromBytes: (bytes) => Envelope.fromBytes(bytes),
};
