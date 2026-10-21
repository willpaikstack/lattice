import {buildDraftRequest} from "@/lib/request-model";
import { privateMarker, privateRequestFixture } from "@/test-fixtures/customer-request";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  drafts: { findMany: vi.fn(), findUnique: vi.fn(), createMany: vi.fn(), updateMany: vi.fn(), upsert: vi.fn() },
}));
vi.mock("@/lib/session", () => ({ getCurrentSession: mocks.session }));
vi.mock("@/lib/prisma", () => ({ getPrismaClient: async () => ({ customerRequestDraft: mocks.drafts }) }));
import { DELETE, GET, POST } from "./route";

const draft = { id: "local_draft_example", request: {...buildDraftRequest({title:"QA",lineItems:[{material:"Aluminum",quantity:1}],files:[]}),id:"local_draft_example"}, initialState:{}, updatedAt: "2026-10-08T12:00:00Z" };
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
    const response = await (await GET()).json();
    expect(response).toMatchObject({ drafts: [{ id: draft.id, request: { id: draft.id, status: "DRAFT", title: "QA" } }], invalidIds: [], deletedIds: ["local_draft_removed"] });
    expect(response.drafts[0].request).not.toHaveProperty("supplierQuotes");
    expect(response.drafts[0].request).not.toHaveProperty("supplierQuoteFiles");
    expect(mocks.drafts.findMany.mock.calls[0][0].where).toEqual({ ownerScope: "company_a" });
  });
  it("namespaces an identical browser id separately for each company", async () => {
    await POST(post([draft]));
    mocks.session.mockResolvedValue({ user: { role: "customer", companyId: "company_b", id: "user_b" } });
    await POST(post([draft]));
    expect(mocks.drafts.createMany.mock.calls.map(([arg]) => arg.data[0].id)).toEqual(["company_a:local_draft_example", "company_b:local_draft_example"]);
  });
  it("strips legacy internal fields from saved draft requests, envelopes and nested form state", async () => {
    const legacy = {
      id: "local_draft_legacy", updatedAt: draft.updatedAt, futureInternalField: privateMarker,
      request: { ...privateRequestFixture(), id: "local_draft_legacy", status: "DRAFT", billingSnapshot: null, purchasePayment: { ...draft.request.purchasePayment, futureInternalField: privateMarker } },
      initialState: { projectName: "Customer draft", surfaceFinishColor: "Blue", futureInternalField: privateMarker,
        lineItems: [{ material: "al_6061_t6", drawingSpecificTolerances: true, notes: "Keep this customer requirement.", futureInternalField: privateMarker,
          cadPreview: { status: "ready", fileName: "part.step", urn: "customer-urn", futureInternalField: privateMarker } }] },
    };
    mocks.drafts.findMany.mockResolvedValue([{ id: "company_a:local_draft_legacy", contents: legacy }]);
    const response = await GET();
    const contents = await response.json();
    expect(JSON.stringify(contents)).not.toContain(privateMarker);
    expect(contents.drafts[0].initialState).toMatchObject({ projectName: "Customer draft", surfaceFinishColor: "Blue", lineItems: [{ drawingSpecificTolerances: true, notes: "Keep this customer requirement.", cadPreview: { urn: "customer-urn" } }] });
    expect((await POST(post([legacy]))).status).toBe(200);
    expect(JSON.stringify(mocks.drafts.createMany.mock.calls)).not.toContain(privateMarker);
    expect(JSON.stringify(mocks.drafts.updateMany.mock.calls)).not.toContain(privateMarker);
  });
  it("quarantines malformed nested legacy records without exposing or deleting them", async () => {
    const malformed = { ...draft, request: { ...draft.request, customerQuotes: [{ internalNotes: privateMarker }] } };
    mocks.drafts.findMany.mockResolvedValue([{ id: `company_a:${draft.id}`, contents: malformed }]);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ drafts: [], invalidIds: [draft.id], deletedIds: [] });
    expect((await POST(post([malformed]))).status).toBe(400);
    expect(mocks.drafts.createMany).not.toHaveBeenCalled();
    expect(mocks.drafts.updateMany).not.toHaveBeenCalled();
    expect(mocks.drafts.upsert).not.toHaveBeenCalled();
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

it('rejects malformed drafts before writing and quarantines stored malformed records on read', async()=>{
 mocks.session.mockResolvedValue({user:{role:'customer',companyId:'company_a'}});
 const invalid={id:'local_draft_broken',updatedAt:'2026-10-14T12:00:00Z',request:{status:'DRAFT'}};
 mocks.drafts.createMany.mockClear();expect((await POST(post([invalid]))).status).toBe(400);expect(mocks.drafts.createMany).not.toHaveBeenCalled();
 mocks.drafts.findMany.mockResolvedValue([{id:'company_a:local_draft_broken',contents:invalid}]);
 expect(await(await GET()).json()).toMatchObject({drafts:[],invalidIds:['local_draft_broken']});
});
