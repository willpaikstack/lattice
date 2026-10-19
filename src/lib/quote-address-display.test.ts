import { describe, expect, it } from "vitest";
import { quoteTimingPreviewRequest } from "./quote-timing-preview-fixture";
import { quoteWithDisplayAddresses } from "./quote-address-display";

const shipping = { name: "Buyer", company: "Shop", address1: "350 Fifth Avenue", address2: "", city: "New York", state: "NY", zipCode: "10118", phone: "2125550100" };
const billing = { address: { ...shipping, name: "Accounts Payable" }, contact: { email: "billing@example.com", invoiceRoutingNotes: "" } };

describe("quote display address defaults", () => {
  it("shows saved account addresses when quote snapshots are incomplete without mutating the quote", () => {
    const request = { ...quoteTimingPreviewRequest(), shipToAddress1: "", billingSnapshot: null };
    const before = structuredClone(request);
    const display = quoteWithDisplayAddresses(request, shipping, billing);
    expect(display.shipToAddress1).toBe(shipping.address1);
    expect(display.shipToName).toBe(shipping.name);
    expect(display.billingSnapshot).toEqual(billing);
    expect(request).toEqual(before);
  });

  it("preserves complete quote snapshots even when company defaults change", () => {
    const request = quoteWithDisplayAddresses({ ...quoteTimingPreviewRequest(), shipToAddress1: "", billingSnapshot: null }, shipping, billing);
    const display = quoteWithDisplayAddresses(request, { ...shipping, address1: "Different street" }, { ...billing, address: { ...shipping, address1: "Different street" } });
    expect(display.shipToAddress1).toBe(shipping.address1);
    expect(display.billingSnapshot).toEqual(billing);
  });

  it("keeps purchased snapshots and rejects incomplete defaults", () => {
    const request = { ...quoteTimingPreviewRequest(), shipToAddress1: "", billingSnapshot: null };
    expect(quoteWithDisplayAddresses({ ...request, status: "PURCHASED" }, shipping, billing).shipToAddress1).toBe("");
    const display = quoteWithDisplayAddresses(request, { ...shipping, city: "" }, { ...billing, address: { ...shipping, zipCode: "" } });
    expect(display.shipToAddress1).toBe("");
    expect(display.billingSnapshot).toBeNull();
  });
});
