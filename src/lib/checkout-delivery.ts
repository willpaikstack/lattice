/** The initial card checkout supports finalized Lattice-managed DDP delivery. */
export function hasFinalLandedDeliveryTerms(terms: string | null | undefined) {
  return /^DDP(?:$|[\s-])/i.test((terms || "").trim());
}
