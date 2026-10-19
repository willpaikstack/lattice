import { estimatedDeliveryOn, shippingBusinessDays } from "./quote-delivery-timing";

type QuotePreparation = {
  lineItems: { partName: string; unitPrice: string; leadTimeDays: string }[];
  shippingCost: string;
  shippingMethod: string;
  shippingTerms: string;
  estimatedDeliveryDate: string;
  quoteCreatedDate: string;
  quoteValidUntil: string;
  customerNote: string;
};

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validQuoteAmount(value: string) {
  const normalized = value.trim();
  const cents = Math.round(Number(normalized) * 100);
  return /^\d+(?:\.\d{1,2})?$/.test(normalized) && Number.isSafeInteger(cents) && cents <= 2_147_483_647;
}

/** Use every part's production duration plus the selected shipping preset. */
export function calculatedQuoteDeliveryDate(issueDate: string, leadTimes: string[], shippingMethod: string) {
  if (!leadTimes.length || !leadTimes.every(value => /^\d+$/.test(value.trim()) && Number.isSafeInteger(Number(value)) && Number(value) > 0 && Number(value) <= 2_147_483_647)) return null;
  return estimatedDeliveryOn(issueDate, Math.max(...leadTimes.map(Number)), shippingBusinessDays(shippingMethod));
}

/** Shared by the workbench and issuance action, including reissued quotes. */
export function quotePreparationErrors(input: QuotePreparation): string[] {
  const errors: string[] = [];
  if (!input.lineItems.length) errors.push("Add at least one part to quote.");
  for (const item of input.lineItems) {
    if (!validQuoteAmount(item.unitPrice)) errors.push(`${item.partName}: enter a unit price with up to two decimal places.`);
    const leadTime = item.leadTimeDays.trim();
    if (!/^\d+$/.test(leadTime) || !Number.isSafeInteger(Number(leadTime)) || Number(leadTime) < 1 || Number(leadTime) > 2_147_483_647) {
      errors.push(`${item.partName}: enter a positive whole-number lead time in days.`);
    }
  }
  if (!validQuoteAmount(input.shippingCost)) errors.push("Enter a shipping cost (0 is allowed).");
  if (!["Domestic", "International"].includes(input.shippingMethod)) errors.push("Select a shipping speed.");
  if (!["EXW", "DDP", "Determined at Checkout", "DAP", "FOB"].includes(input.shippingTerms)) errors.push("Select shipping terms.");
  if (!validDate(input.estimatedDeliveryDate)) errors.push("Enter valid part lead times and shipping speed to calculate delivery.");
  if (!validDate(input.quoteCreatedDate)) errors.push("Select a valid quote issue date.");
  if (!validDate(input.quoteValidUntil)) errors.push("Select a valid quote expiration date.");
  else if (input.quoteValidUntil < input.quoteCreatedDate) errors.push("Quote expiration cannot be before the quote issue date.");
  return errors;
}
