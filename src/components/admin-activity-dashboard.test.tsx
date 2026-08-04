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
  it("renders a focused quote request overview for the most critical admin signals", () => {
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
    const summary = buildAdminActivitySummary(
      [makeRequest({ id: "req_submitted" }), needsInfo, ready],
      new Date("2026-06-10T12:00:00.000Z"),
    );

    render(<AdminActivityDashboard summary={summary} />);

    expect(screen.getByRole("heading", { name: "Quote request overview" })).toBeInTheDocument();
    expect(screen.getByText("Active quote requests")).toBeInTheDocument();
    expect(screen.getByText("Needs action")).toBeInTheDocument();
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.getByText("Open quoted value")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Critical quote queue" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Assign owner and review/ })).toHaveAttribute("href", "/admin/quotes?requestId=req_submitted");
    expect(screen.getByRole("link", { name: /Resolve missing buyer info/ })).toHaveAttribute("href", "/admin/quotes?requestId=req_needs_info");
    expect(screen.getByRole("link", { name: /Send supplier RFQ package/ })).toHaveAttribute("href", "/admin/quotes?requestId=req_ready");
    expect(screen.queryByRole("heading", { name: "Quote pipeline" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Recent quote requests" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Customers" })).not.toBeInTheDocument();
    expect(screen.queryByText("Orders in flight")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Activity by status" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Owner workload" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Supplier execution" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Platform timeline" })).not.toBeInTheDocument();
  });
});
