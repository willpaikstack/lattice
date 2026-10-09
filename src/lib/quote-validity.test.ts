import { describe, it, expect } from "vitest";
import { quoteValidUntil, quoteHasExpired } from "./quote-validity";
import { buildDraftRequest } from "./request-model";
const request = buildDraftRequest({ buyerCompany: "Test", requesterName: "Tester", title: "Part", process: "CNC", dueDate: "2026-11-01", lineItems: [{ partName: "Part", material: "Aluminum", quantity: 1 }], files: [] });
describe("quote validity", () => {
  it("counts weekdays across weekends and year boundaries", () => {
    expect(quoteValidUntil("2026-10-08")).toBe("2026-10-29");
    expect(quoteValidUntil("2026-12-18")).toBe("2027-01-08");
  });
  it("rejects impossible calendar dates", () => { expect(() => quoteValidUntil("2026-02-30")).toThrow("Invalid quote issue date"); });
  it("allows the saved expiration day and expires the following day", () => {
    const quote = { ...request, quote: { ...request.quote, quoteValidUntil: "2026-10-29" } };
    expect(quoteHasExpired(quote, new Date("2026-10-29T23:59:59Z"))).toBe(false);
    expect(quoteHasExpired(quote, new Date("2026-10-30T00:00:00Z"))).toBe(true);
    expect(quoteHasExpired(request)).toBe(true);
  });
});
