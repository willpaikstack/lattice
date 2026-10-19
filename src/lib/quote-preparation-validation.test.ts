import { describe, expect, it } from "vitest";
import { calculatedQuoteDeliveryDate } from "./quote-preparation-validation";

describe("calculated quote delivery", () => {
  it("adds shipping to the longest part using business days after issuance", () => {
    expect(calculatedQuoteDeliveryDate("2026-10-13", ["3", "7"], "International")).toBe("2026-10-29");
    expect(calculatedQuoteDeliveryDate("2026-10-13", ["7", "3"], "Domestic")).toBe("2026-10-26");
  });

  it.each([[], [""], ["7", ""], ["0"], ["2.5"], ["7days"], ["2147483648"]].map(leadTimes => ({ leadTimes })))("waits for valid durations for every part: $leadTimes", ({ leadTimes }) => {
    expect(calculatedQuoteDeliveryDate("2026-10-13", leadTimes, "Domestic")).toBeNull();
  });

  it("requires a known shipping duration and a valid issue date", () => {
    expect(calculatedQuoteDeliveryDate("2026-10-13", ["7"], "Unknown")).toBeNull();
    expect(calculatedQuoteDeliveryDate("2026-02-30", ["7"], "Domestic")).toBeNull();
  });
});
