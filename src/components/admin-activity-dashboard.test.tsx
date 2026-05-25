import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { buildAdminActivitySummary } from "../lib/admin-activity";
import { applyOperatorStatusUpdate, buildDraftRequest, submitDraftRequest, type LatticeRequest } from "../lib/request-model";

import { AdminActivityDashboard } from "./admin-activity-dashboard";

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

describe("AdminActivityDashboard", () => {
  it("renders an administrator management surface for application activity", () => {
    const needsInfo = applyOperatorStatusUpdate(makeRequest({ id: "req_needs_info", title: "Missing tolerance RFQ" }), {
      status: "NEEDS_INFO",
      assignedOwner: "Adam",
      internalNotes: "Missing tolerance callout.",
    });
    const ready = applyOperatorStatusUpdate(makeRequest({ id: "req_ready", title: "Supplier-ready RFQ" }), {
      status: "READY_FOR_SUPPLIER_RFQ",
      assignedOwner: "Adam",
      supplierPackageNotes: "Package ready for supplier outreach.",
    });
    const summary = buildAdminActivitySummary([makeRequest({ id: "req_submitted" }), needsInfo, ready]);

    render(<AdminActivityDashboard summary={summary} />);

    expect(screen.getByRole("heading", { name: "Administrator control center" })).toBeInTheDocument();
    expect(screen.getByText("Total RFQs")).toBeInTheDocument();
    expect(screen.getByText("Needs admin action")).toBeInTheDocument();
    expect(screen.getByText("Supplier ready")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Admin action queue" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Resolve missing buyer info/ })).toHaveAttribute("href", "/operator/requests/req_needs_info");
    expect(screen.getByRole("link", { name: /Send supplier RFQ package/ })).toHaveAttribute("href", "/operator/requests/req_ready");
    expect(screen.getByRole("heading", { name: "Activity by status" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recent application activity" })).toBeInTheDocument();
  });
});
