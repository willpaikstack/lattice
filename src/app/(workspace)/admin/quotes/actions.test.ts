import { describe, expect, it, vi, beforeEach } from "vitest";
import { buildDraftRequest, submitDraftRequest, type LatticeRequest } from "@/lib/request-model";

const mocks = vi.hoisted(() => ({
  requireActionRole: vi.fn(),
  updateAdminRfqDecision: vi.fn(),
  getRequestById: vi.fn(),
  saveCustomerQuoteForRequest: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/route-authorization", () => ({ requireActionRole: mocks.requireActionRole }));
vi.mock("@/lib/request-repository", () => ({
  getRequestById: mocks.getRequestById,
  saveCustomerQuoteForRequest: mocks.saveCustomerQuoteForRequest,
  updateAdminRfqDecision: mocks.updateAdminRfqDecision,
}));
vi.mock("@/lib/quote-file", () => ({ buildCustomerQuoteMarkdown: vi.fn(() => "# Quote") }));

import { updateAdminRfqDecisionAction, updateAdminQuoteStatusAction } from "./actions";

function request() {
  return submitDraftRequest(buildDraftRequest({
    title: "Test bracket", buyerCompany: "Test company", process: "CNC milling",
    lineItems: [{ partName: "Bracket", quantity: 3, material: "6061-T6 Aluminum" }],
    files: [{ name: "bracket.step", sizeBytes: 2048, type: "model/step" }],
  }));
}
function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}
let current: LatticeRequest;
function quoteForm(overrides: Record<string, string> = {}) {
  return form({ requestId: current.id, status: "QUOTED", quoteCreatedDate: "2026-10-13",
    shippingMethod: "International", shippingTerms: "DDP", shippingCost: "12.25",
    [`unitPrice:${current.lineItems[0].id}`]: "10.25", [`leadTimeDays:${current.lineItems[0].id}`]: "7", ...overrides });
}
function decisionForm(overrides: Record<string, string> = {}) {
  return form({ requestId: current.id, status: "NEEDS_INFO", customerNote: "Please upload a drawing with thread callouts.", ...overrides });
}

beforeEach(() => {
  vi.resetAllMocks();
  current = request();
  mocks.getRequestById.mockResolvedValue(current);
});

describe("admin quote issuance", () => {
  it.each(["", "-1", "10usd", "1.234", "Infinity", "1e3"])("rejects invalid unit price %s without saving", async (value) => {
    expect(await updateAdminQuoteStatusAction(quoteForm({ [`unitPrice:${current.lineItems[0].id}`]: value }))).toEqual({ error: expect.stringContaining("unit price") });
    expect(mocks.saveCustomerQuoteForRequest).not.toHaveBeenCalled();
  });
  it.each(["0", "-3", "2.5", "7days"])("rejects invalid lead time %s", async (value) => {
    expect(await updateAdminQuoteStatusAction(quoteForm({ [`leadTimeDays:${current.lineItems[0].id}`]: value }))).toEqual({ error: expect.stringContaining("Lead times") });
    expect(mocks.saveCustomerQuoteForRequest).not.toHaveBeenCalled();
  });
  it.each(["DRAFT", "CLOSED", "PURCHASED"] as const)("rejects %s RFQs", async (status) => {
    mocks.getRequestById.mockResolvedValue({ ...current, status });
    expect(await updateAdminQuoteStatusAction(quoteForm())).toEqual({ error: expect.stringContaining("Only active") });
    expect(mocks.saveCustomerQuoteForRequest).not.toHaveBeenCalled();
  });
  it("rejects archived RFQs", async () => {
    mocks.getRequestById.mockResolvedValue({ ...current, isArchived: true });
    expect(await updateAdminQuoteStatusAction(quoteForm())).toEqual({ error: expect.stringContaining("Only active") });
  });
  it.each<Record<string, string>>([{ shippingCost: "-1" }, { shippingMethod: "Unknown" }, { quoteCreatedDate: "2026-02-30" }, { estimatedDeliveryDate: "bad date" }])("rejects invalid commercial fields %j", async (overrides) => {
    expect(await updateAdminQuoteStatusAction(quoteForm(overrides))).toHaveProperty("error");
    expect(mocks.saveCustomerQuoteForRequest).not.toHaveBeenCalled();
  });
  it("saves correct totals, shipping and fifteen-weekday validity then refreshes customer routes", async () => {
    expect(await updateAdminQuoteStatusAction(quoteForm())).toEqual({ success: true });
    expect(mocks.requireActionRole).toHaveBeenCalledWith(["admin"]);
    expect(mocks.saveCustomerQuoteForRequest).toHaveBeenCalledWith(current.id, expect.objectContaining({
      estimatedPriceCents: 3075, shippingCostCents: 1225, leadTimeDays: 7, validUntil: "2026-11-03",
      selectedSupplierQuote: expect.objectContaining({ priceCents: 4300, leadTimeDays: 12 }),
      lineItems: [expect.objectContaining({ unitPrice: 10.25, quantity: 3 })],
    }), { requireDatabase: true });
    expect(mocks.revalidatePath).toHaveBeenCalledWith(`/quotes/${current.id}`);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard");
  });
  it("keeps blank shipping and lead times optional, and accepts an explicit zero price", async () => {
    expect(await updateAdminQuoteStatusAction(quoteForm({ shippingCost: "", [`leadTimeDays:${current.lineItems[0].id}`]: "", [`unitPrice:${current.lineItems[0].id}`]: "0" }))).toEqual({ success: true });
    expect(mocks.saveCustomerQuoteForRequest).toHaveBeenCalledWith(current.id, expect.objectContaining({ estimatedPriceCents: 0, shippingCostCents: null, leadTimeDays: null }), { requireDatabase: true });
  });
  it("returns a recoverable error on persistence failure without leaking internals", async () => {
    mocks.saveCustomerQuoteForRequest.mockRejectedValue(new Error("private database credentials"));
    expect(await updateAdminQuoteStatusAction(quoteForm())).toEqual({ error: "Unable to save this RFQ. Your edits are retained; please try again." });
  });
  it("does not swallow authorization failures", async () => {
    mocks.requireActionRole.mockRejectedValue(new Error("Unauthorized"));
    await expect(updateAdminQuoteStatusAction(quoteForm())).rejects.toThrow("Unauthorized");
    expect(mocks.getRequestById).not.toHaveBeenCalled();
  });
});

describe("admin customer-facing decisions", () => {
  it.each<Record<string, string>>([{ requestId: "" }, { status: "QUOTED" }, { customerNote: " " }])("rejects invalid decision %j", async (overrides) => {
    expect(await updateAdminRfqDecisionAction(decisionForm(overrides))).toHaveProperty("error");
    expect(mocks.updateAdminRfqDecision).not.toHaveBeenCalled();
  });
  it("records no quote with its customer note", async () => {
    expect(await updateAdminRfqDecisionAction(decisionForm({ status: "CLOSED", customerNote: "Unable to quote this RFQ." }))).toEqual({ success: true });
    expect(mocks.updateAdminRfqDecision).toHaveBeenCalledWith(current.id, { customerNote: "Unable to quote this RFQ.", status: "CLOSED" }, { requireDatabase: true });
  });
  it("rejects decisions on purchased orders", async () => {
    mocks.getRequestById.mockResolvedValue({ ...current, status: "PURCHASED" });
    expect(await updateAdminRfqDecisionAction(decisionForm())).toHaveProperty("error");
    expect(mocks.updateAdminRfqDecision).not.toHaveBeenCalled();
  });
});
