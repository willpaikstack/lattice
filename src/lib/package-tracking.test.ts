import { describe, expect, it } from "vitest";

import { packageTrackingLink } from "./package-tracking";

describe("packageTrackingLink", () => {
  it("builds UPS tracking links from 1Z numbers", () => {
    expect(packageTrackingLink(" 1Z999AA10123456784 ")).toEqual({
      carrier: "UPS",
      href: "https://www.ups.com/track?tracknum=1Z999AA10123456784",
      trackingNumber: "1Z999AA10123456784",
    });
  });

  it("returns null when no tracking number is available", () => {
    expect(packageTrackingLink("   ")).toBeNull();
    expect(packageTrackingLink(null)).toBeNull();
  });

  it("falls back to a carrier search for unknown tracking formats", () => {
    expect(packageTrackingLink("SF123")).toEqual({
      carrier: "Carrier tracking",
      href: "https://www.google.com/search?q=SF123%20package%20tracking",
      trackingNumber: "SF123",
    });
  });
});
