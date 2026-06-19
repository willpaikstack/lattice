import { afterEach, describe, expect, it, vi } from "vitest";

import { buildDraftRequest, submitDraftRequest, type LatticeRequest } from "./request-model";
import { buildGuestQuoteAcknowledgementEmail, buildGuestQuoteReadyEmail } from "./guest-quote-email";

function guestRequest(): LatticeRequest {
  const submitted = submitDraftRequest(
    buildDraftRequest({
      buyerCompany: "Apex Fluidics",
      contact: {
        requesterEmail: "avery@apexfluidics.com",
        requesterPhone: "555-0142",
      },
      dueDate: "2026-07-01",
      files: [{ name: "manifold.step", sizeBytes: 2048, type: "model/step" }],
      guestAccessTokenExpiresAt: "2026-07-18T00:00:00.000Z",
      guestAccessTokenHash: "hashed-token",
      lineItems: [{ material: "6061-T6 Aluminum", partName: "Manifold", quantity: 2 }],
      process: "CNC machining",
      requesterName: "Avery Chen",
      requestOrigin: "GUEST_SIMPLE_QUOTE",
      title: "Prototype manifold",
    }),
  );

  return {
    ...submitted,
    id: "req_guest_12345678",
    customerQuotes: [
      {
        assumptions: "CAD package is latest revision.",
        clarifications: "",
        customerCompany: "Apex Fluidics",
        customerContact: "Avery Chen",
        filesReviewed: "manifold.step",
        id: "customer_quote_1",
        issuedAt: "2026-06-18T12:00:00.000Z",
        leadTime: "12 business days",
        lineItems: [
          {
            description: "Manifold",
            finish: "As machined",
            id: submitted.lineItems[0].id,
            material: "6061-T6 Aluminum",
            process: "CNC machining",
            quantity: 2,
            unitPrice: 245,
          },
        ],
        markdown: "# Quote",
        notes: "Ready for review.",
        preparedBy: "Lattice",
        projectName: "Prototype manifold",
        quoteDate: "2026-06-18",
        quoteNumber: "LQ-2042",
        shipping: "International / DDP - $85.00",
        tax: "Excluded",
        totalCents: 49000,
        validUntil: "2026-07-18",
        versionNumber: 1,
      },
    ],
  };
}

describe("guest quote emails", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("builds an acknowledgement email for account-free RFQs", () => {
    const email = buildGuestQuoteAcknowledgementEmail(guestRequest());

    expect(email.to).toBe("avery@apexfluidics.com");
    expect(email.subject).toBe("We received your Lattice quote request");
    expect(email.text).toContain("Hi Avery,");
    expect(email.text).toContain("Prototype manifold");
    expect(email.text).toContain("You do not need to create an account");
  });

  it("builds quote-ready email with an absolute private review link", () => {
    vi.stubEnv("APP_BASE_URL", "https://latticeos.co/");

    const email = buildGuestQuoteReadyEmail(guestRequest(), "/simple-quote/req_guest_12345678?token=private-token");

    expect(email.to).toBe("avery@apexfluidics.com");
    expect(email.subject).toBe("LQ-2042 is ready for review");
    expect(email.text).toContain("Review and pay by credit card here: https://latticeos.co/simple-quote/req_guest_12345678?token=private-token");
    expect(email.text).toContain("This private link only opens this quote. No account is required.");
  });
});
