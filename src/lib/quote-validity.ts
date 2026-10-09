import type { LatticeRequest } from "./request-model";

/** Fifteen weekdays from issue date; holidays are not subtracted. */
export function quoteValidUntil(issuedOn: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(issuedOn)) throw new Error("A quote issue date is required.");
  const date = new Date(`${issuedOn}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== issuedOn) throw new Error("Invalid quote issue date.");
  let remaining = 15;
  while (remaining > 0) {
    date.setUTCDate(date.getUTCDate() + 1);
    if (date.getUTCDay() !== 0 && date.getUTCDay() !== 6) remaining--;
  }
  return date.toISOString().slice(0, 10);
}

export function quoteHasExpired(request: LatticeRequest, now = new Date()) {
  const expiry = request.customerQuotes.at(-1)?.validUntil || request.quote.quoteValidUntil;
  return !expiry || expiry < now.toISOString().slice(0, 10);
}

export function assertQuoteCanBePurchased(request: LatticeRequest) {
  if (request.status !== "QUOTED") throw new Error("Only priced quotes can be purchased.");
  if (quoteHasExpired(request)) throw new Error("This quote has expired. Contact support@latticeos.co to request a renewed quote.");
}
