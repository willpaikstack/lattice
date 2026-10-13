/** Purge obsolete intake values while retaining the RFQ and its operational structure. */
export function purgeLegacyRfqValues(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(purgeLegacyRfqValues);
  if (!value || typeof value !== "object") return value;
  const original = value as Record<string, unknown>;
  const record = typeof original.title === "string" && Array.isArray(original.lineItems);
  const part = typeof original.quantity !== "undefined" && typeof original.material === "string";
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(original)) {
    if (key === "customerPo") continue;
    if (key === "requesterName" || key === "dueDate") { if (record) result[key] = ""; continue; }
    if (key === "partName") { if (part) result[key] = ""; continue; }
    if (key === "process" && (Array.isArray(original.lineItems) || "projectName" in original)) { if (record) result[key] = ""; continue; }
    if (key === "notes" && typeof item === "string") {
      result[key] = item.split(/\r?\n/).filter(line => !/^\s*Customer PO#:/i.test(line)).join("\n");
    } else result[key] = purgeLegacyRfqValues(item);
  }
  return result;
}

export function purgeBrowserLegacyRfqValues() {
  const report = { scannedStores: 0, changedStores: 0, unreadableStores: 0 };
  if (typeof window === "undefined") return report;
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key?.startsWith("lattice.incompleteRfqs")) continue;
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;
    report.scannedStores++;
    try {
      const cleaned = JSON.stringify(purgeLegacyRfqValues(JSON.parse(raw)));
      if (cleaned !== raw) { window.localStorage.setItem(key, cleaned); report.changedStores++; }
    } catch { report.unreadableStores++; /* Malformed storage is retained, never erased. */ }
  }
  return report;
}
