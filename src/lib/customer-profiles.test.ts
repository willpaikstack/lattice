import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  getPrismaClient: vi.fn(async () => ({ company: { findMany: mocks.findMany } })),
  listLocalRequests: vi.fn(async () => []),
}));

vi.mock("./prisma", () => ({ getPrismaClient: mocks.getPrismaClient }));
vi.mock("./local-request-store", () => ({ listLocalRequests: mocks.listLocalRequests }));

import { listCustomerProfiles } from "./customer-profiles";

describe("customer profiles production data source", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetAllMocks();
  });

  it("fails closed instead of returning local profiles when Production database reads fail", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("LATTICE_DATA_MODE", "customer");
    mocks.findMany.mockRejectedValue(new Error("database unavailable"));

    await expect(listCustomerProfiles()).rejects.toThrow("database unavailable");
    expect(mocks.listLocalRequests).not.toHaveBeenCalled();
  });
});
