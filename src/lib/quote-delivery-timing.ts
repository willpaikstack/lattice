import { quotedLineForRequestItem, type LatticeRequest, type RequestLineItem } from "./request-model";

function positiveDays(value: number | null | undefined) {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
}

/** Existing operator shipping presets, shown separately from production. */
export function shippingBusinessDays(method: string) {
  switch (method.trim().toLowerCase()) {
    case "domestic": return 2;
    case "international": return 5;
    default: return null;
  }
}

export function partProductionDays(request: LatticeRequest, item: RequestLineItem) {
  const line = quotedLineForRequestItem(request.customerQuotes.at(-1)?.lineItems, item);
  const days = positiveDays(line?.leadTimeDays);
  // A single-part legacy quote can use its quoted overall production duration.
  return days ?? (request.lineItems.length === 1 ? positiveDays(request.quote.leadTimeDays) : null);
}

export function quoteDeliveryTiming(request: LatticeRequest) {
  const parts = request.lineItems.map(item => partProductionDays(request, item));
  // An unknown part could be the longest one, so do not promise a partial estimate.
  const productionDays = parts.length && parts.every((days): days is number => days !== null)
    ? Math.max(...parts) : null;
  return { productionDays, shippingDays: shippingBusinessDays(request.quote.shippingMethod) };
}

export function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Add weekdays after the viewing date. Holiday calendars are not available yet. */
export function addBusinessDays(viewedOn: string, days: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(viewedOn) || !Number.isSafeInteger(days) || days < 0) return null;
  const date = new Date(`${viewedOn}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== viewedOn) return null;
  let remaining = days;
  if (remaining && (date.getUTCDay() === 0 || date.getUTCDay() === 6)) {
    date.setUTCDate(date.getUTCDate() + (date.getUTCDay() === 6 ? 2 : 1));
    remaining--;
  }
  const weeks = Math.floor(remaining / 5);
  date.setUTCDate(date.getUTCDate() + weeks * 7);
  remaining %= 5;
  while (remaining > 0 && Number.isFinite(date.getTime())) {
    date.setUTCDate(date.getUTCDate() + 1);
    if (date.getUTCDay() !== 0 && date.getUTCDay() !== 6) remaining--;
  }
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : null;
}

export function estimatedDeliveryOn(viewedOn: string, productionDays: number | null, shippingDays: number | null) {
  if (productionDays === null || shippingDays === null) return null;
  return addBusinessDays(viewedOn, productionDays + shippingDays);
}

export function timingDateLabel(value: string, includeYear = true) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", ...(includeYear ? { year: "numeric" } : {}), timeZone: "UTC" })
    .format(new Date(`${value}T00:00:00.000Z`));
}
