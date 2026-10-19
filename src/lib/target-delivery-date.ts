import { addBusinessDays } from "./quote-delivery-timing";

/** Workspace policy: weekdays after today in the operating timezone; no holiday calendar applied. */
export function earliestTargetDeliveryDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find(value => value.type === type)!.value;
  return addBusinessDays(`${part("year")}-${part("month")}-${part("day")}`, 8)!;
}

export function targetDeliveryDateError(value: unknown, now = new Date()): string | null {
  if (value === undefined || value === "") return null;
  const minimum = earliestTargetDeliveryDate(now);
  if (typeof value !== "string" || addBusinessDays(value, 0) !== value || value < minimum) {
    return `Choose a target delivery date on or after ${minimum} (at least 8 business days from today), or clear the optional date.`;
  }
  return null;
}
