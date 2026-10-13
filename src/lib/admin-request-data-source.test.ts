import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildDraftRequest, submitDraftRequest } from "./request-model";
const mocks = vi.hoisted(() => ({ findMany: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), listLocalRequests: vi.fn(), getLocalRequestById: vi.fn(), saveLocalRequest: vi.fn() }));
vi.mock("./prisma", () => ({ getPrismaClient: async () => ({ request: { findMany: mocks.findMany, create: mocks.create, findUnique: mocks.findUnique, update: mocks.update } }) }));
vi.mock("./local-request-store", () => ({ listLocalRequests: mocks.listLocalRequests, getLocalRequestById: mocks.getLocalRequestById, saveLocalRequest: mocks.saveLocalRequest, deleteLocalRequest: vi.fn() }));
vi.mock("./request-persistence", async (original) => ({ ...await original<typeof import("./request-persistence")>(), mapStoredRequest: (value: unknown) => value }));
vi.mock("./customer-lifecycle-email", () => ({ queueCustomerLifecycleEmail: vi.fn() }));
import { createSubmittedRequest, getRequestById, listAdminRequests, listOperatorRequests, updateAdminRfqDecision, addSupplierQuoteFile } from "./request-repository";
beforeEach(() => { vi.resetAllMocks(); vi.stubEnv("NODE_ENV", "development"); });
afterEach(() => vi.unstubAllEnvs());
function request() { return { ...submitDraftRequest(buildDraftRequest({ title: "Database RFQ", lineItems: [{ partName: "A", quantity: 1, material: "Steel" }], files: [{ name: "A.step", type: "model/step", sizeBytes: 10 }] })), id: "req_database" }; }
describe("admin database source of truth", () => {
  it("lists only database RFQs without merging local records or demos", async () => {
    const stored = request();
    mocks.findMany.mockResolvedValue([stored, { ...stored, id: "demo_local" }]);
    expect(await listAdminRequests()).toEqual([stored]);
    expect(mocks.listLocalRequests).not.toHaveBeenCalled();
  });
  it("fails visibly on database unavailability even in local development", async () => {
    mocks.findMany.mockRejectedValue(new Error("database unavailable"));
    await expect(listAdminRequests()).rejects.toThrow("database unavailable");
    await expect(listOperatorRequests()).rejects.toThrow("database unavailable");
    expect(mocks.listLocalRequests).not.toHaveBeenCalled();
  });
  it("does not reopen a missing database RFQ from local storage", async () => {
    mocks.findUnique.mockResolvedValue(null);
    expect(await getRequestById("req_missing", { requireDatabase: true })).toBeNull();
    expect(mocks.getLocalRequestById).not.toHaveBeenCalled();
  });
  it("does not report a submission saved locally when the database is unavailable", async () => {
    mocks.create.mockRejectedValue(new Error("write failed"));
    await expect(createSubmittedRequest({ title: "Customer RFQ", lineItems: [{ partName: "A", quantity: 1, material: "Steel" }], files: [{ name: "A.step", type: "model/step", sizeBytes: 10 }] }, { requireDatabase: true })).rejects.toThrow("write failed");
    expect(mocks.saveLocalRequest).not.toHaveBeenCalled();
  });
  it("does not create a local decision when the database write fails", async () => {
    mocks.findUnique.mockResolvedValue(request());
    mocks.update.mockRejectedValue(new Error("write failed"));
    await expect(updateAdminRfqDecision("req_database", { status: "NEEDS_INFO", customerNote: "Confirm threads." }, { requireDatabase: true })).rejects.toThrow("write failed");
    expect(mocks.saveLocalRequest).not.toHaveBeenCalled();
  });
  it("does not create local supplier evidence when its database write fails", async () => {
    mocks.findUnique.mockResolvedValue(request());
    mocks.update.mockRejectedValue(new Error("write failed"));
    await expect(addSupplierQuoteFile("req_database", { name: "shop.pdf", type: "application/pdf", sizeBytes: 10 }, { requireDatabase: true })).rejects.toThrow("write failed");
    expect(mocks.saveLocalRequest).not.toHaveBeenCalled();
  });
});
