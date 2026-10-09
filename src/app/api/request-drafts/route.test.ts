import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  drafts: { findMany: vi.fn(), findUnique: vi.fn(), createMany: vi.fn(), updateMany: vi.fn(), upsert: vi.fn() },
}));
vi.mock("@/lib/session", () => ({ getCurrentSession: mocks.session }));
vi.mock("@/lib/prisma", () => ({ getPrismaClient: async () => ({ customerRequestDraft: mocks.drafts }) }));
import { DELETE, GET, POST } from "./route";

const draft = { id: "local_draft_example", request: { status: "DRAFT" }, updatedAt: "2026-10-08T12:00:00Z" };
const post = (body: unknown) => new Request("https://latticeos.co/api/request-drafts", { method: "POST", body: JSON.stringify(body) });
describe("company draft persistence and deletion", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.session.mockResolvedValue({ user: { role: "customer", companyId: "company_a", id: "user_a" } });
    mocks.drafts.findMany.mockResolvedValue([]);
    mocks.drafts.findUnique.mockResolvedValue(null);
  });
  it.each([null, { user: { role: "supplier", companyId: "company_a" } }, { user: { role: "customer", companyId: null } }])("denies sessions without draft membership", async (session) => {
    mocks.session.mockResolvedValue(session);
    expect((await GET()).status).toBe(403);
    expect((await POST(post([draft]))).status).toBe(403);
    expect(mocks.drafts.findMany).not.toHaveBeenCalled();
    expect(mocks.drafts.createMany).not.toHaveBeenCalled();
  });
  it("returns only this company's drafts and deletion markers", async () => {
    mocks.drafts.findMany.mockResolvedValue([{ id: "company_a:local_draft_example", contents: draft }, { id: "company_a:local_draft_removed", contents: { deleted: true } }]);
    expect(await (await GET()).json()).toEqual({ drafts: [draft], deletedIds: ["local_draft_removed"] });
    expect(mocks.drafts.findMany.mock.calls[0][0].where).toEqual({ ownerScope: "company_a" });
  });
  it("namespaces an identical browser id separately for each company", async () => {
    await POST(post([draft]));
    mocks.session.mockResolvedValue({ user: { role: "customer", companyId: "company_b", id: "user_b" } });
    await POST(post([draft]));
    expect(mocks.drafts.createMany.mock.calls.map(([arg]) => arg.data[0].id)).toEqual(["company_a:local_draft_example", "company_b:local_draft_example"]);
  });
  it("prevents stale browsers from resurrecting a deleted draft", async () => {
    mocks.drafts.findUnique.mockResolvedValue({ contents: { deleted: true } });
    expect((await POST(post([draft]))).status).toBe(200);
    expect(mocks.drafts.createMany).not.toHaveBeenCalled();
    expect(mocks.drafts.updateMany).not.toHaveBeenCalled();
  });
  it("guards an update against a newer edit or concurrent deletion", async () => {
    await POST(post([draft]));
    expect(mocks.drafts.updateMany.mock.calls[0][0].where).toMatchObject({ ownerScope: "company_a", editedAt: { lte: new Date(draft.updatedAt) }, contents: { path: ["request", "status"], equals: "DRAFT" } });
  });
  it("deletion persists a company-scoped tombstone", async () => {
    await DELETE(new Request("https://latticeos.co/api/request-drafts?id=local_draft_example", { method: "DELETE" }));
    expect(mocks.drafts.upsert.mock.calls[0][0]).toMatchObject({ where: { id: "company_a:local_draft_example" }, create: { ownerScope: "company_a", contents: { deleted: true } }, update: { contents: { deleted: true } } });
  });
  it.each([{ ...draft, id: "company_b:local_draft_example" }, { ...draft, request: { status: "PURCHASED" } }, { ...draft, updatedAt: "invalid" }])("rejects invalid draft packages before writes", async (invalid) => {
    expect((await POST(post([invalid]))).status).toBe(400);
    expect(mocks.drafts.createMany).not.toHaveBeenCalled();
  });
});
