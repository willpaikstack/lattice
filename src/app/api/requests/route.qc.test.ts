import { restrictionPolicyVersion } from "@/lib/rfq-manufacturing";
import { File } from "node:buffer";

import { describe, expect, it, vi, beforeEach } from "vitest";

import type { DraftRequestInput } from "@/lib/request-model";

const mocks = vi.hoisted(() => {
  const state = {
    session: null as null | {
      user: {
        email: string;
        id: string;
        name: string;
        role: "admin" | "customer" | "supplier";
        companyId?: string | null;
        companyName?: string | null;
      };
    },
  };

  return {
    contactSnapshotFromAccountSettings: vi.fn(() => ({})),
    createSubmittedRequest: vi.fn(async (input: DraftRequestInput) => ({
      id: "req_created",
      files: input.files,
    })),
    getRequestById: vi.fn<(id: string) => Promise<null | { id: string }>>(async () => null),
    getAccountSettings: vi.fn(async () => ({})),
    getCurrentSession: vi.fn(async () => state.session),
    listOperatorRequests: vi.fn(async () => [{ id: "req_admin_queue" }]),
    state,
  };
});

vi.mock("@/lib/local-file-storage",()=>({
  isDraftUploadStorageKey:()=>false,
  inspectStoredUpload:async()=>({name:"bracket.step",sizeBytes:2048,type:"model/step"}),
  saveLocalUpload:async(file:File)=>({name:file.name,sizeBytes:file.size,type:file.type,storageKey:"rfq/test/bracket.step"}),
}));
vi.mock("@/lib/request-access-policy",()=>({canCurrentSessionAccessStorageKey:async()=>({authorized:true})}));
vi.mock("@/lib/request-repository", () => ({
  createSubmittedRequest: mocks.createSubmittedRequest,
  getRequestById: mocks.getRequestById,
  listOperatorRequests: mocks.listOperatorRequests,
}));

vi.mock("@/lib/account-settings", () => ({
  contactSnapshotFromAccountSettings: mocks.contactSnapshotFromAccountSettings,
  getAccountSettings: mocks.getAccountSettings,
}));

vi.mock("@/lib/session", () => ({
  getCurrentSession: mocks.getCurrentSession,
}));

function session(role: "admin" | "customer" | "supplier") {
  return {
    user: {
      email: `${role}@example.com`,
      id: `${role}_1`,
      name: role,
      role,
      companyId: role === "customer" ? "company_test" : null,
      companyName: role === "customer" ? "Test Company" : null,
    },
  };
}

function validInput(overrides: Partial<DraftRequestInput> = {}): DraftRequestInput {
  return {
    intakeDeclaration: { restrictionStatus: "unrestricted", policyVersion: restrictionPolicyVersion, endUse: "commercial", endUseNotes: "" },
    buyerCompany: "Amogy Manufacturing",
    dueDate: "2026-07-01",
    files: [{ name: "bracket.step", sizeBytes: 2048, type: "model/step",storageKey:"rfq/test/bracket.step" }],
    lineItems: [{ material: "6061-T6 Aluminum", partName: "Bracket", quantity: 4, surfaceFinish: "As machined (Ra 3.2 um / Ra 126 uin)", manufacturingDetails: { process: "cnc_milling", customerPartNumber: "", cadRevision: "", drawingRevision: "", materialKey: "al_6061_t6", finishKey: "as_machined_ra_3_2", fileHistory: [] } }],
    process: "CNC machining",
    requesterName: "Buyer Ops",
    title: "Bracket RFQ",
    ...overrides,
  };
}

async function responseJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

describe("requests API QC", () => {
  beforeEach(() => {
    mocks.state.session = null;
    mocks.getRequestById.mockReset().mockResolvedValue(null);
    mocks.createSubmittedRequest.mockClear();
    mocks.listOperatorRequests.mockClear();
    mocks.getCurrentSession.mockClear();
    mocks.contactSnapshotFromAccountSettings.mockClear();
    mocks.getAccountSettings.mockClear();
  });

  it("rejects restricted packages before creating an RFQ", async () => {
    mocks.state.session = session("customer");
    const { POST } = await import("./route");
    const input = validInput(); input.intakeDeclaration!.restrictionStatus = "restricted";
    const response = await POST(new Request("http://localhost/api/requests", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: expect.stringContaining("does not accept") });
    expect(mocks.createSubmittedRequest).not.toHaveBeenCalled();
  });

  it("returns a recoverable service error if the submission database write fails", async () => {
    mocks.state.session = session("customer");
    mocks.createSubmittedRequest.mockRejectedValueOnce(new Error("private database details"));
    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost/api/requests", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(validInput()) }));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "The RFQ could not be saved to the database. Your draft is retained; please try again." });
  });

  it("does not parse or create a retry when the idempotency lookup database is unavailable", async () => {
    mocks.state.session = session("customer");
    mocks.getRequestById.mockRejectedValueOnce(new Error("database unavailable"));
    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost/api/requests", { method: "POST", headers: { "Idempotency-Key": "local_draft_retry" }, body: "unparsed retry" }));
    expect(response.status).toBe(503);
    expect(mocks.createSubmittedRequest).not.toHaveBeenCalled();
  });

  it("returns the original RFQ before parsing a retried submission", async () => {
    mocks.state.session = session("customer");
    mocks.getRequestById.mockResolvedValue({ id: "rfq_existing" });
    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost/api/requests", {
      method: "POST", body: "lost-response-retry", headers: { "Idempotency-Key": "local_draft_retry" },
    }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ request: { id: "rfq_existing" } });
    expect(mocks.getRequestById).toHaveBeenCalledWith(expect.stringMatching(/^rfq_[a-f0-9]{40}$/), { requireDatabase: true });
    expect(mocks.createSubmittedRequest).not.toHaveBeenCalled();
  });

  it("scopes retry identifiers to the signed-in user", async () => {
    const { POST } = await import("./route");
    const retry = () => new Request("http://localhost/api/requests", {
      method: "POST", body: "invalid", headers: { "Idempotency-Key": "local_draft_retry" },
    });
    mocks.state.session = session("customer");
    await POST(retry());
    mocks.state.session.user.id = "customer_2";
    await POST(retry());
    expect(mocks.getRequestById.mock.calls[0][0]).not.toBe(mocks.getRequestById.mock.calls[1][0]);
  });

  it("keeps the request queue admin-only", async () => {
    const { GET } = await import("./route");

    let response = await GET();
    expect(response.status).toBe(401);
    await expect(responseJson(response)).resolves.toEqual({ error: "Admin access required." });

    mocks.state.session = session("customer");
    response = await GET();
    expect(response.status).toBe(403);

    mocks.state.session = session("admin");
    response = await GET();
    expect(response.status).toBe(200);
    await expect(responseJson(response)).resolves.toEqual({ requests: [{ id: "req_admin_queue" }] });
  });

  it("records the authenticated submitter rather than client-supplied identity", async () => {
    mocks.state.session = session("customer");
    const { POST } = await import("./route");
    const input = validInput({ requesterName: "Another user", contact: { requesterEmail: "other@example.com" } });
    const response = await POST(new Request("http://localhost/api/requests", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }));
    expect(response.status).toBe(201);
    expect(mocks.createSubmittedRequest).toHaveBeenCalledWith(expect.objectContaining({ requesterName: "customer", contact: expect.objectContaining({ requesterEmail: "customer@example.com" }) }), expect.anything());
  });

  it("allows only customer and admin sessions to submit RFQs", async () => {
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/requests", {
      body: JSON.stringify(validInput()),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    let response = await POST(request.clone());
    expect(response.status).toBe(401);
    await expect(responseJson(response)).resolves.toEqual({ error: "Customer or admin access required." });

    mocks.state.session = session("supplier");
    response = await POST(request.clone());
    expect(response.status).toBe(403);

    mocks.state.session = session("customer");
    response = await POST(request.clone());
    expect(response.status).toBe(201);
    expect(mocks.createSubmittedRequest).toHaveBeenCalledOnce();
    expect(mocks.createSubmittedRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        buyerCompany: "Test Company",
        contact: expect.objectContaining({ shipToCompany: "Test Company" }),
      }),
      { buyerCompanyId: "company_test", requireDatabase: true },
    );
  });

  it("uses current server-resolved shipping and billing defaults instead of stale or forged draft values", async () => {
    const { POST } = await import("./route");
    mocks.state.session = { user: { email: "buyer@test.example", id: "buyer_1", name: "Buyer", role: "customer", companyId: "company_test", companyName: "Test Company" } };
    mocks.contactSnapshotFromAccountSettings.mockReturnValueOnce({ shipToAddress1: "Updated shipping", shipToCompany: "Test Company", requesterPhone: "555-0102" });
    mocks.getAccountSettings.mockResolvedValueOnce({ billingAddress: { address1: "Updated billing" }, billing: { email: "ap@test.example", invoiceRoutingNotes: "Route to AP" } });
    const response = await POST(new Request("http://localhost/api/requests", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...validInput(), contact: { shipToAddress1: "Old draft shipping" }, billingSnapshot: { address: { address1: "Forged billing" }, contact: { email: "forged@test.example" } } }) }));
    expect(response.status).toBe(201);
    expect(mocks.createSubmittedRequest).toHaveBeenLastCalledWith(expect.objectContaining({ contact: expect.objectContaining({ shipToAddress1: "Updated shipping" }), billingSnapshot: expect.objectContaining({ address: expect.objectContaining({ address1: "Updated billing" }), contact: expect.objectContaining({ email: "ap@test.example" }) }) }), { buyerCompanyId: "company_test", requireDatabase: true });
  });

  it("does not let an unassigned customer submit an RFQ into an unowned company", async () => {
    const { POST } = await import("./route");
    mocks.state.session = {
      user: {
        companyId: null,
        companyName: null,
        email: "unassigned@example.com",
        id: "customer_unassigned",
        name: "Unassigned customer",
        role: "customer",
      },
    };

    const response = await POST(
      new Request("http://localhost/api/requests", {
        body: JSON.stringify(validInput()),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(403);
    await expect(responseJson(response)).resolves.toEqual({
      error: "Your account has not been assigned to a customer company yet. Contact Lattice to finish account setup.",
    });
    expect(mocks.createSubmittedRequest).not.toHaveBeenCalled();
  });

  it("rejects JSON submissions that only contain missing file references", async () => {
    const { POST } = await import("./route");
    mocks.state.session = session("customer");

    const response = await POST(
      new Request("http://localhost/api/requests", {
        body: JSON.stringify(validInput({ files: [{ name: "reference-only.step", sizeBytes: 0, type: "reference/name-only" }] })),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    await expect(responseJson(response)).resolves.toEqual({
      error: "reference-only.step must be uploaded again before submitting.",
    });
    expect(mocks.createSubmittedRequest).not.toHaveBeenCalled();
  });

  it("rejects unsafe stored file paths", async () => {
    const { POST } = await import("./route");
    mocks.state.session = session("customer");

    const response = await POST(
      new Request("http://localhost/api/requests", {
        body: JSON.stringify(validInput({ files: [{ name: "bad.step", sizeBytes: 2048, storageKey: "../bad.step", type: "model/step" }] })),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    await expect(responseJson(response)).resolves.toEqual({ error: "Invalid file storage key" });
    expect(mocks.createSubmittedRequest).not.toHaveBeenCalled();
  });

  it("rejects multipart submissions when the expected uploaded file is missing", async () => {
    const { POST } = await import("./route");
    mocks.state.session = session("customer");
    const formData = new FormData();
    formData.set("request", JSON.stringify(validInput({ files: [{ name: "missing.step", sizeBytes: 0, type: "model/step" }] })));

    const response = await POST(
      new Request("http://localhost/api/requests", {
        body: formData,
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    await expect(responseJson(response)).resolves.toEqual({
      error: "missing.step must be uploaded again before submitting.",
    });
    expect(mocks.createSubmittedRequest).not.toHaveBeenCalled();
  });

  it("rejects empty multipart files", async () => {
    const { POST } = await import("./route");
    mocks.state.session = session("customer");
    const formData = new FormData();
    formData.set("request", JSON.stringify(validInput({ files: [{ name: "empty.step", sizeBytes: 0, type: "model/step" }] })));
    formData.set("file-0", new File([""], "empty.step", { type: "model/step" }) as unknown as Blob);

    const response = await POST(
      new Request("http://localhost/api/requests", {
        body: formData,
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    await expect(responseJson(response)).resolves.toEqual({
      error: "empty.step must be uploaded again before submitting.",
    });
    expect(mocks.createSubmittedRequest).not.toHaveBeenCalled();
  });
});
