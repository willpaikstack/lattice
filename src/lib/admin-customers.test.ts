import { describe, expect, it } from "vitest";

import { applyOperatorStatusUpdate, buildDraftRequest, submitDraftRequest, type LatticeRequest } from "./request-model";
import { buildAdminCustomerSummaries } from "./admin-customers";

function makeRequest(overrides: Partial<LatticeRequest> = {}) {
  const submitted = submitDraftRequest(
    buildDraftRequest({
      buyerCompany: "Amogy Manufacturing",
      requesterName: "William Paik",
      title: "Hydrogen skid bracket RFQ",
      process: "CNC milling",
      dueDate: "2026-06-20",
      lineItems: [{ partName: "Mounting bracket", quantity: 24, material: "6061-T6 Aluminum" }],
      files: [{ name: "mounting-bracket.step", sizeBytes: 2048, type: "model/step" }],
    }),
  );

  return { ...submitted, ...overrides };
}

describe("admin customer summaries", () => {
  it("rolls customer activity up across requests, orders, contacts, and overseas shops", () => {
    const quoted = applyOperatorStatusUpdate(makeRequest({ id: "req_quoted", updatedAt: "2026-05-20T10:00:00.000Z" }), {
      status: "QUOTED",
      assignedOwner: "Adam",
      estimatedPriceCents: 125000,
      leadTimeDays: 14,
    });
    const purchased: LatticeRequest = {
      ...quoted,
      id: "req_purchased",
      status: "PURCHASED",
      updatedAt: "2026-05-24T10:00:00.000Z",
      supplierOrder: {
        ...quoted.supplierOrder,
        shopName: "Shenzhen Precision Manufacturing",
        contactName: "Li Wei",
      },
      supplierQuotes: [
        {
          id: "supplier_quote_1",
          shopName: "Shenzhen Precision Manufacturing",
          country: "China",
          contactName: "Li Wei",
          status: "SELECTED",
          priceCents: 90000,
          leadTimeDays: 12,
          notes: "Selected quote.",
          quotedAt: "2026-05-22T10:00:00.000Z",
          isSelected: true,
        },
      ],
    };
    const needsInfo = applyOperatorStatusUpdate(
      makeRequest({
        id: "req_needs_info",
        requesterName: "Maya Chen",
        updatedAt: "2026-05-21T10:00:00.000Z",
      }),
      {
        status: "NEEDS_INFO",
        assignedOwner: "Adam",
        internalNotes: "Missing drawing revision.",
      },
    );

    const summaries = buildAdminCustomerSummaries([quoted, purchased, needsInfo]);

    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({
      name: "Amogy Manufacturing",
      requesters: ["Maya Chen", "William Paik"],
      totalRequests: 3,
      activeQuoteRequests: 2,
      placedOrders: 1,
      blockedRequests: 1,
      quotedValueCents: 375000,
      orderValueCents: 125000,
      latestRequest: {
        id: "req_purchased",
        href: "/supplier/orders/req_purchased",
      },
      fabricationShops: [
        {
          name: "Shenzhen Precision Manufacturing",
          country: "China",
          quoteCount: 1,
          selectedOrderCount: 1,
        },
      ],
    });
  });
});
