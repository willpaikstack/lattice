import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  getPrismaClient: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock("./prisma", () => ({ getPrismaClient: mocks.getPrismaClient }));

import { deliverCustomerInvitation } from "./customer-invitation-delivery";

const previousEnvironment = { ...process.env };
const recipient = {
  companyId: "company_1",
  companyName: "Acme Machining",
  email: "carmen@acme.example",
  expiresAt: new Date("2026-08-24T12:00:00.000Z"),
  name: "Carmen Pascuito",
  temporaryPassword: "Lattice-example-password",
  userId: "user_1",
};

describe("customer invitation delivery", () => {
  beforeEach(() => {
    process.env = { ...previousEnvironment, APP_BASE_URL: "https://latticeos.co", RESEND_API_KEY: "test-key", WAITLIST_EMAIL_FROM: "Lattice OS <support@latticeos.co>" };
    mocks.create.mockResolvedValue({ id: "invite_1" });
    mocks.getPrismaClient.mockResolvedValue({
      customerInvitation: {
        create: mocks.create,
        update: mocks.update,
        updateMany: mocks.updateMany,
      },
    });
    mocks.update.mockResolvedValue({});
    mocks.updateMany.mockResolvedValue({ count: 0 });
  });

  afterEach(() => {
    process.env = { ...previousEnvironment };
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("records a sent invitation without persisting the plaintext password", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "resend_1" }), { status: 200 })));

    await expect(deliverCustomerInvitation(recipient)).resolves.toEqual({ invitationId: "invite_1", status: "sent" });

    expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "REVOKED" }),
      where: expect.objectContaining({ userId: "user_1" }),
    }));
    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        companyId: "company_1",
        expiresAt: recipient.expiresAt,
        recipientEmail: "carmen@acme.example",
        userId: "user_1",
      }),
    });
    expect(JSON.stringify(mocks.create.mock.calls)).not.toContain(recipient.temporaryPassword);
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ providerMessageId: "resend_1", status: "SENT" }),
    }));
  });

  it("records a safe failure when Resend is not configured", async () => {
    delete process.env.RESEND_API_KEY;

    await expect(deliverCustomerInvitation(recipient)).resolves.toEqual({
      failureCategory: "email-not-configured",
      invitationId: "invite_1",
      status: "failed",
    });

    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ failureCategory: "email-not-configured", status: "FAILED" }),
    }));
  });

  it("records an invalid-recipient failure without returning the password", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 422 })));

    await expect(deliverCustomerInvitation(recipient)).resolves.toEqual({
      failureCategory: "invalid-recipient",
      invitationId: "invite_1",
      status: "failed",
    });

    expect(JSON.stringify(mocks.update.mock.calls)).not.toContain(recipient.temporaryPassword);
  });
});
