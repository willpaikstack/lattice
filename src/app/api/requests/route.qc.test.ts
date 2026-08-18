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
    getAccountSettings: vi.fn(async () => ({})),
    getCurrentSession: vi.fn(async () => state.session),
    listOperatorRequests: vi.fn(async () => [{ id: "req_admin_queue" }]),
    state,
  };
});

vi.mock("@/lib/request-repository", () => ({
  createSubmittedRequest: mocks.createSubmittedRequest,
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
    buyerCompany: "Amogy Manufacturing",
    dueDate: "2026-07-01",
    files: [{ name: "bracket.step", sizeBytes: 2048, type: "model/step" }],
    lineItems: [{ material: "6061-T6 Aluminum", partName: "Bracket", quantity: 4 }],
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
    mocks.createSubmittedRequest.mockClear();
    mocks.listOperatorRequests.mockClear();
    mocks.getCurrentSession.mockClear();
    mocks.contactSnapshotFromAccountSettings.mockClear();
    mocks.getAccountSettings.mockClear();
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
      { buyerCompanyId: "company_test" },
    );
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
    await expect(responseJson(response)).resolves.toEqual({ error: "Invalid local file storage key" });
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
