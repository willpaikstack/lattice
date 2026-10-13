import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getRequestById: vi.fn(), requireActionRole: vi.fn(), notFound: vi.fn(() => { throw new Error("not found"); }) }));
vi.mock("@/lib/request-repository", () => ({ getRequestById: mocks.getRequestById }));
vi.mock("@/lib/route-authorization", () => ({ requireActionRole: mocks.requireActionRole }));
vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("@/components/admin-rfq-detail", () => ({ AdminRfqDetail: () => null }));
import Page from "./page";
beforeEach(() => { vi.clearAllMocks(); });
describe("admin RFQ detail route", () => {
  it("loads the selected RFQ from the database after admin authorization", async () => {
    mocks.getRequestById.mockResolvedValue({ id: "req_saved" });
    const result = await Page({ params: Promise.resolve({ requestId: "req_saved" }) });
    expect(mocks.requireActionRole).toHaveBeenCalledWith(["admin"]);
    expect(mocks.getRequestById).toHaveBeenCalledWith("req_saved", { requireDatabase: true });
    expect(result.props.request.id).toBe("req_saved");
  });
  it("returns a real not-found state for nonexistent database records", async () => {
    mocks.getRequestById.mockResolvedValue(null);
    await expect(Page({ params: Promise.resolve({ requestId: "missing" }) })).rejects.toThrow("not found");
  });
});
