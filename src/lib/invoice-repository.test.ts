import { describe, expect, it } from "vitest";

import { formatInvoiceNumber } from "./invoice-repository";

describe("invoice repository", () => {
  it("formats annual sequential invoice IDs", () => {
    expect(formatInvoiceNumber(2026, 1)).toBe("INV-2026-000001");
    expect(formatInvoiceNumber(2026, 42)).toBe("INV-2026-000042");
    expect(formatInvoiceNumber(2027, 1000000)).toBe("INV-2027-1000000");
  });

  it("rejects invalid invoice sequence inputs", () => {
    expect(() => formatInvoiceNumber(1999, 1)).toThrow("Invoice year");
    expect(() => formatInvoiceNumber(2026, 0)).toThrow("Invoice sequence");
  });
});
