import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware: (handler: (auth: unknown, request: NextRequest) => unknown) => (request: NextRequest) => handler(mocks.auth, request),
}));

import proxy from "./proxy";

describe("proxy", () => {
  it("sends unauthenticated protected requests through the Lattice login route", async () => {
    mocks.auth.mockResolvedValue({ isAuthenticated: false });
    const request = new NextRequest("https://latticeos.co/quotes?filter=open");
    const response = await proxy(request, {} as Parameters<typeof proxy>[1]);

    expect(response?.headers.get("location")).toBe("https://latticeos.co/login?redirect_url=%2Fquotes%3Ffilter%3Dopen");
  });
});
