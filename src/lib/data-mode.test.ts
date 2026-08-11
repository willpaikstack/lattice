import { afterEach, describe, expect, it, vi } from "vitest";

import { getLatticeDataMode } from "./data-mode";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getLatticeDataMode", () => {
  it("defaults local development to mock mode", () => {
    delete process.env.LATTICE_DATA_MODE;
    vi.stubEnv("NODE_ENV", "development");

    expect(getLatticeDataMode()).toBe("mock");
  });

  it("defaults production to customer mode", () => {
    delete process.env.LATTICE_DATA_MODE;
    vi.stubEnv("NODE_ENV", "production");

    expect(getLatticeDataMode()).toBe("customer");
  });

  it("rejects mock mode in production", () => {
    vi.stubEnv("LATTICE_DATA_MODE", "mock");
    vi.stubEnv("NODE_ENV", "production");

    expect(() => getLatticeDataMode()).toThrow("Mock data mode cannot run in production.");
  });
});
