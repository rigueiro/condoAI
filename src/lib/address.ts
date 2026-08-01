import type { Condominium } from "@/types";

/** Formats a Portuguese structured address as a single display line. */
export function formatPortugueseAddress(
  address: Condominium["address"],
): string {
  return `${address.street}, ${address.postalCode} ${address.parish}, ${address.municipality}`;
}
