import { describe, expect, it } from "vitest";

import { formatCustomerId } from "./customer-id-repository";

describe("customer ID repository", () => {
  it("formats sequential customer IDs", () => {
    expect(formatCustomerId(1)).toBe("CUST-000001");
    expect(formatCustomerId(42)).toBe("CUST-000042");
    expect(formatCustomerId(1000000)).toBe("CUST-1000000");
  });

  it("rejects invalid customer ID sequence inputs", () => {
    expect(() => formatCustomerId(0)).toThrow("Customer ID sequence");
    expect(() => formatCustomerId(-1)).toThrow("Customer ID sequence");
  });
});
