import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  const state = {
    session: null as null | { user: { role: "admin" | "customer" | "supplier" } },
  };

  return {
    getCurrentSession: vi.fn(async () => state.session),
    state,
  };
});

vi.mock("./session", () => ({
  getCurrentSession: mocks.getCurrentSession,
}));

import { requireRouteRole } from "./route-authorization";

describe("route authorization QC", () => {
  beforeEach(() => {
    mocks.state.session = null;
    mocks.getCurrentSession.mockClear();
  });

  it("returns 401 when a sensitive route has no session", async () => {
    const response = await requireRouteRole(["admin"]);

    expect(response?.status).toBe(401);
    await expect(response?.json()).resolves.toEqual({ error: "Authentication required." });
  });

  it("returns 403 when the session role is not allowed", async () => {
    mocks.state.session = { user: { role: "customer" } };

    const response = await requireRouteRole(["admin"]);

    expect(response?.status).toBe(403);
    await expect(response?.json()).resolves.toEqual({ error: "Access denied." });
  });

  it("allows matching roles through without a blocking response", async () => {
    mocks.state.session = { user: { role: "supplier" } };

    await expect(requireRouteRole(["supplier"])).resolves.toBeNull();
  });
});
