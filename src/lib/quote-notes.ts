function localDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return dateOnlyMatch ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3])) : new Date(value);
}

export function addDaysIso(value: string, days: number) {
  const date = localDate(value);

  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }

  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatQuoteNoteDate(value: string | null | undefined) {
  const date = localDate(value);

  if (!date || Number.isNaN(date.getTime())) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function buildStandardQuoteNotes(quoteDate: string, shipBy: string | null) {
  return [
    `[1] Order by 3 PM PST on ${formatQuoteNoteDate(addDaysIso(quoteDate, 1))} to ship your parts by ${formatQuoteNoteDate(shipBy)}. Parts ship together at the slowest production speed in your quote.`,
    "[2] Customs clearance information is required for shipments across country borders.",
  ].join("\n");
}
