import { describe, expect, it } from "vitest";
import { addBusinessDays, estimatedDeliveryOn, partProductionDays, quoteDeliveryTiming, shippingBusinessDays } from "./quote-delivery-timing";
import { quoteTimingPreviewRequest } from "./quote-timing-preview-fixture";

describe("quote delivery timing", () => {
  it("uses the longest part, not the sum of parts, then adds shipping once", () => {
    const request = quoteTimingPreviewRequest(2);
    expect(quoteDeliveryTiming(request)).toEqual({ productionDays: 20, shippingDays: 5 });
    expect(estimatedDeliveryOn("2026-10-18", 20, 5)).toBe("2026-11-20");
    expect(estimatedDeliveryOn("2026-10-19", 20, 5)).toBe("2026-11-23");
  });

  it.each([["2026-10-16", 1, "2026-10-19"], ["2026-10-17", 1, "2026-10-19"], ["2026-10-18", 5, "2026-10-23"], ["2026-10-30", 3, "2026-11-04"], ["2026-12-31", 1, "2027-01-01"]] as const)("counts weekdays from %s across weekends, DST and year boundaries", (date, days, expected) => {
    expect(addBusinessDays(date, days)).toBe(expected);
  });

  it("does not invent missing part or shipping timing", () => {
    const request = quoteTimingPreviewRequest(2);
    request.customerQuotes[0].lineItems[1].leadTimeDays = null;
    expect(quoteDeliveryTiming(request).productionDays).toBeNull();
    expect(shippingBusinessDays("Custom freight")).toBeNull();
    expect(estimatedDeliveryOn("2026-10-18", 20, null)).toBeNull();
    expect(shippingBusinessDays("Domestic")).toBe(2);
  });

  it("uses a legacy overall duration only for a single part", () => {
    const request = quoteTimingPreviewRequest();
    request.customerQuotes[0].lineItems[0].leadTimeDays = null;
    expect(partProductionDays(request, request.lineItems[0])).toBe(20);
    request.quote.leadTimeDays = null;
    expect(partProductionDays(request, request.lineItems[0])).toBeNull();
  });

  it("rejects invalid dates and unsafe durations", () => {
    expect(addBusinessDays("2026-02-30", 5)).toBeNull();
    expect(addBusinessDays("2026-10-18", -1)).toBeNull();
    expect(addBusinessDays("2026-10-18", 1.5)).toBeNull();
    expect(addBusinessDays("2026-10-18", Number.MAX_SAFE_INTEGER)).toBeNull();
  });
});
