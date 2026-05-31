import { describe, expect, it } from "vitest";

import { applyOperatorStatusUpdate, buildDraftRequest, submitDraftRequest } from "./request-model";
import { buildCustomerNotifications } from "./customer-notifications";

function makeSubmittedRequest() {
  return submitDraftRequest(
    buildDraftRequest({
      buyerCompany: "Amogy Manufacturing",
      dueDate: "2026-06-20",
      files: [{ name: "mounting-bracket.step", sizeBytes: 2048, type: "model/step" }],
      lineItems: [{ material: "6061-T6 Aluminum", partName: "Mounting bracket", quantity: 24 }],
      process: "CNC milling",
      requesterName: "William Paik",
      title: "Hydrogen skid bracket RFQ",
    }),
  );
}

describe("customer notifications", () => {
  it("creates quote-ready and needs-info notifications from request state", () => {
    const needsInfo = applyOperatorStatusUpdate(makeSubmittedRequest(), {
      internalNotes: "Please confirm thread callout.",
      status: "NEEDS_INFO",
    });
    const quoted = {
      ...applyOperatorStatusUpdate(makeSubmittedRequest(), {
        estimatedPriceCents: 182500,
        leadTimeDays: 15,
        quoteSummary: "Ready for buyer review.",
        status: "QUOTED",
      }),
      customerQuotes: [
        {
          assumptions: "CAD is latest revision.",
          clarifications: "",
          customerCompany: "Amogy Manufacturing",
          customerContact: "William Paik",
          filesReviewed: "mounting-bracket.step",
          id: "customer_quote_1",
          issuedAt: "2026-06-02T12:00:00.000Z",
          leadTime: "15 business days",
          lineItems: [],
          markdown: "# Quote LQ-1001",
          notes: "Ready for review.",
          preparedBy: "Lattice",
          projectName: "Hydrogen skid bracket RFQ",
          quoteDate: "2026-06-02",
          quoteNumber: "LQ-1001",
          shipping: "Billed at actual",
          tax: "Not included",
          totalCents: 182500,
          validUntil: "2026-06-16",
          versionNumber: 1,
        },
      ],
    };

    expect(buildCustomerNotifications([needsInfo, quoted])).toMatchObject([
      {
        href: `/quotes/${quoted.id}`,
        title: "LQ-1001 is ready for review",
        unread: true,
      },
      {
        detail: "Please confirm thread callout.",
        href: `/quotes/${needsInfo.id}`,
        title: "Hydrogen skid bracket RFQ needs more information",
        unread: true,
      },
    ]);
  });
});
