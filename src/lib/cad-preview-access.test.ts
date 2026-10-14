// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: vi.fn(), read: vi.fn(), write: vi.fn(), company: vi.fn() }));
vi.mock("./session", () => ({ getCurrentSession: mocks.session }));
vi.mock("./local-file-storage", () => ({ readPrivateStorageRecord: mocks.read, writePrivateStorageRecord: mocks.write }));
vi.mock("./request-access-policy", () => ({ customerCompanyForStorageKey: mocks.company }));
import { canCurrentSessionAccessCadPreview, registerCadPreview, registeredCadPreviewForSource } from "./cad-preview-access";
const records = new Map<string, Record<string, unknown>>();
const customer = (companyId: string | null) => ({ user: { role: "customer", companyId, id: "buyer" } });
beforeEach(() => { vi.clearAllMocks(); records.clear(); mocks.read.mockImplementation(async key => records.get(key) ?? null); mocks.write.mockImplementation(async (key, value) => { records.set(key, value); }); mocks.session.mockResolvedValue(customer("A")); });
describe("server-created CAD model ownership", () => {
  it("allows company colleagues and operators but denies a different company and anonymous users", async () => {
    await registerCadPreview("created-model", "rfq-drafts/owned/part.step");
    expect(await canCurrentSessionAccessCadPreview("created-model")).toBe(true);
    mocks.session.mockResolvedValue(customer("B"));
    expect(await canCurrentSessionAccessCadPreview("created-model")).toBe(false);
    expect(await registeredCadPreviewForSource("rfq-drafts/owned/part.step")).toBeNull();
    mocks.session.mockResolvedValue({ user: { role: "admin", id: "operator" } });
    expect(await canCurrentSessionAccessCadPreview("created-model")).toBe(true);
    mocks.session.mockResolvedValue(null);
    expect(await canCurrentSessionAccessCadPreview("created-model")).toBe(false);
  });
  it("cannot gain model access just by knowing an unregistered URN", async () => {
    expect(await canCurrentSessionAccessCadPreview("forged-customer-file-urn")).toBe(false);
    expect(await registeredCadPreviewForSource("unknown-source")).toBeNull();
  });
  it("keeps customer ownership when an operator regenerates their submitted file", async () => {
    mocks.session.mockResolvedValue({ user: { role: "admin", id: "operator" } });
    mocks.company.mockResolvedValue("A");
    await registerCadPreview("regenerated-model", "rfq/owned/part.step");
    mocks.session.mockResolvedValue(customer("A"));
    expect(await canCurrentSessionAccessCadPreview("regenerated-model")).toBe(true);
    mocks.session.mockResolvedValue(customer("B"));
    expect(await canCurrentSessionAccessCadPreview("regenerated-model")).toBe(false);
  });
  it("does not mint successful access when private storage fails", async () => {
    mocks.read.mockRejectedValue(new Error("storage unavailable"));
    await expect(canCurrentSessionAccessCadPreview("model")).rejects.toThrow("storage unavailable");
  });
});
