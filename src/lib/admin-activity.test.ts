import { describe, expect, it } from "vitest";

import { applyOperatorStatusUpdate, buildDraftRequest, submitDraftRequest, type LatticeRequest } from "./request-model";
import { buildAdminActivitySummary } from "./admin-activity";

function makeRequest(overrides: Partial<LatticeRequest> = {}) {
  const submitted = submitDraftRequest(
    buildDraftRequest({
      buyerCompany: "Amogy Manufacturing",
      requesterName: "William Paik",
      title: "Hydrogen skid bracket RFQ",
      process: "CNC milling",
      dueDate: "2026-06-20",
      lineItems: [
        {
          partName: "Mounting bracket",
          quantity: 24,
          material: "6061-T6 Aluminum",
          generalTolerance: "ISO 2768 Medium (m)",
          surfaceFinish: "As machined",
        },
      ],
      files: [{ name: "mounting-bracket.step", sizeBytes: 2048, type: "model/step" }],
    }),
  );

  return { ...submitted, ...overrides };
}

describe("admin activity summary", () => {
  it("summarizes platform activity for the administrator control surface", () => {
    const submitted = makeRequest({ id: "req_submitted", updatedAt: "2026-05-20T10:00:00.000Z" });
    const needsInfo = applyOperatorStatusUpdate(makeRequest({ id: "req_needs_info" }), {
      status: "NEEDS_INFO",
      assignedOwner: "Adam",
      internalNotes: "Missing tolerance callout.",
      supplierPackageNotes: "",
    });
    const readyForSupplier = applyOperatorStatusUpdate(makeRequest({ id: "req_ready" }), {
      status: "READY_FOR_SUPPLIER_RFQ",
      assignedOwner: "Adam",
      supplierPackageNotes: "Send to vetted CNC milling shops.",
    });
    const quoted = applyOperatorStatusUpdate(makeRequest({ id: "req_quoted" }), {
      status: "QUOTED",
      assignedOwner: "Adam",
      estimatedPriceCents: 125000,
      leadTimeDays: 14,
      quoteSummary: "Quoted and ready for buyer approval.",
    });
    const purchased = { ...quoted, id: "req_purchased", status: "PURCHASED" as const };

    const summary = buildAdminActivitySummary([submitted, needsInfo, readyForSupplier, quoted, purchased], new Date("2026-05-26T12:00:00.000Z"));

    expect(summary.metrics.totalRequests).toBe(5);
    expect(summary.metrics.needsAdminAction).toBe(2);
    expect(summary.metrics.supplierReady).toBe(1);
    expect(summary.metrics.ordersInFlight).toBe(1);
    expect(summary.metrics.unassignedRequests).toBe(1);
    expect(summary.metrics.averageQuoteCents).toBe(125000);
    expect(summary.statusCounts).toMatchObject({
      SUBMITTED: 1,
      NEEDS_INFO: 1,
      QUOTED: 1,
      PURCHASED: 1,
    });
    expect(summary.nextActions.map((action) => action.requestId)).toEqual(["req_needs_info", "req_submitted", "req_ready", "req_quoted"]);
    expect(summary.nextActions[0]).toMatchObject({
      label: "Resolve missing buyer info",
      tone: "warning",
      href: "/operator/requests/req_needs_info",
    });
    expect(summary.ownerWorkloads[0]).toMatchObject({
      owner: "Adam",
      totalRequests: 4,
    });
    expect(summary.supplierMonitors[0]).toMatchObject({
      requestId: "req_purchased",
      status: "AWAITING_ACKNOWLEDGMENT",
    });
    expect(summary.recentEvents.length).toBeGreaterThan(0);
  });
});
