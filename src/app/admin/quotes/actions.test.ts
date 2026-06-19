import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(),
  requireActionRole: vi.fn(),
  updateAdminRfqDecision: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/route-authorization", () => ({
  requireActionRole: mocks.requireActionRole,
}));

vi.mock("@/lib/request-repository", () => ({
  getRequestById: vi.fn(),
  saveCustomerQuoteForRequest: vi.fn(),
  updateAdminRfqDecision: mocks.updateAdminRfqDecision,
  updateGuestQuoteAccess: vi.fn(),
}));

vi.mock("@/lib/guest-quote-access", () => ({
  createGuestQuoteAccess: vi.fn(),
  guestQuoteHref: vi.fn(),
  isGuestSimpleQuoteRequest: vi.fn(() => false),
}));

vi.mock("@/lib/guest-quote-email", () => ({
  sendGuestQuoteReadyEmail: vi.fn(),
}));

vi.mock("@/lib/quote-file", () => ({
  buildCustomerQuoteMarkdown: vi.fn(() => "# Quote"),
}));

import { updateAdminRfqDecisionAction } from "./actions";

function decisionForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("requestId", "req_123");
  formData.set("status", "NEEDS_INFO");
  formData.set("customerNote", "Please upload a drawing with thread callouts.");

  Object.entries(overrides).forEach(([key, value]) => formData.set(key, value));

  return formData;
}

describe("updateAdminRfqDecisionAction", () => {
  beforeEach(() => {
    mocks.redirect.mockReset();
    mocks.requireActionRole.mockReset();
    mocks.updateAdminRfqDecision.mockReset();
    mocks.redirect.mockImplementation(() => {
      throw new Error("redirected");
    });
  });

  it("rejects missing request IDs", async () => {
    await expect(updateAdminRfqDecisionAction(decisionForm({ requestId: "" }))).rejects.toThrow("Request ID is required");
    expect(mocks.updateAdminRfqDecision).not.toHaveBeenCalled();
  });

  it("rejects unsupported statuses", async () => {
    await expect(updateAdminRfqDecisionAction(decisionForm({ status: "QUOTED" }))).rejects.toThrow("Unsupported RFQ decision");
    expect(mocks.updateAdminRfqDecision).not.toHaveBeenCalled();
  });

  it("rejects empty customer-facing notes", async () => {
    await expect(updateAdminRfqDecisionAction(decisionForm({ customerNote: " " }))).rejects.toThrow("Customer-facing note is required");
    expect(mocks.updateAdminRfqDecision).not.toHaveBeenCalled();
  });

  it("updates the RFQ decision and returns to the same drawer", async () => {
    await expect(updateAdminRfqDecisionAction(decisionForm({ status: "CLOSED", customerNote: "Unable to quote this RFQ." }))).rejects.toThrow("redirected");

    expect(mocks.requireActionRole).toHaveBeenCalledWith(["admin"]);
    expect(mocks.updateAdminRfqDecision).toHaveBeenCalledWith("req_123", {
      customerNote: "Unable to quote this RFQ.",
      status: "CLOSED",
    });
    expect(mocks.redirect).toHaveBeenCalledWith("/admin/quotes?requestId=req_123");
  });
});
