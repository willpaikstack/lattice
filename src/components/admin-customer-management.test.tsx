import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminCustomerManagement } from "./admin-customer-management";
import { AdminCustomerProfileDetail } from "./admin-customer-profile-detail";
import { customerProfileIcon, type CustomerProfile } from "@/lib/customer-profiles";
import { buildDraftRequest, submitDraftRequest } from "@/lib/request-model";

function makeCustomerProfile(overrides: Partial<CustomerProfile> = {}): CustomerProfile {
  return {
    id: "company_123",
    icon: customerProfileIcon("Apex Robotics"),
    name: "Apex Robotics",
    website: "https://apex.example",
    industry: "Robotics",
    primaryContactName: "Maya Chen",
    primaryContactEmail: "maya@apex.example",
    billingEmail: "ap@apex.example",
    customerTier: "Standard",
    accountStatus: "Active",
    notes: "Prefers concise quote summaries.",
    users: [
      {
        id: "user_1",
        name: "Maya Chen",
        email: "maya@apex.example",
        pendingEmail: null,
        role: "CUSTOMER_ADMIN",
        passwordChangedAt: "2026-06-01T10:00:00.000Z",
        passwordEnabled: true,
        mustChangePassword: false,
        temporaryPasswordExpiresAt: null,
        createdAt: "2026-06-01T10:00:00.000Z",
        updatedAt: "2026-06-01T10:00:00.000Z",
      },
    ],
    metrics: {
      totalRequests: 1,
      activeQuoteRequests: 1,
      placedOrders: 0,
      blockedRequests: 0,
      quotedValueCents: 0,
      orderValueCents: 0,
    },
    latestActivityAt: "2026-06-02T10:00:00.000Z",
    latestRequest: null,
    requests: [],
    fabricationShops: [],
    ...overrides,
  };
}

describe("AdminCustomerManagement", () => {
  it("shows people who joined the waiting list", () => {
    render(
      <AdminCustomerManagement
        customers={[]}
        waitingListEntries={[
          {
            id: "wait-1",
            name: "Avery Chen",
            email: "avery@forgeworks.com",
            company: "ForgeWorks",
            procurementNeeds: "Recurring CNC RFQs and supplier follow-up.",
            joinedAt: "2026-05-27T14:30:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Waiting list" })).toBeInTheDocument();
    expect(screen.getByText("1 joined")).toBeInTheDocument();
    expect(screen.getByText("Avery Chen")).toBeInTheDocument();
    expect(screen.getByText("avery@forgeworks.com")).toBeInTheDocument();
    expect(screen.getByText("ForgeWorks")).toBeInTheDocument();
    expect(screen.getByText("Recurring CNC RFQs and supplier follow-up.")).toBeInTheDocument();
  });

  it("opens a customer profile from each customer company row", () => {
    render(<AdminCustomerManagement customers={[makeCustomerProfile()]} />);

    expect(screen.getByRole("link", { name: "Open customer profile for Apex Robotics" })).toHaveAttribute("href", "/admin/customers/company_123");
    expect(screen.getByText("AR")).toBeInTheDocument();
  });

  it("shows the customer's attached RFQ and order information on the profile page", () => {
    const request = submitDraftRequest(
      buildDraftRequest({
        buyerCompany: "Apex Robotics",
        requesterName: "Maya Chen",
        title: "Robot arm bracket RFQ",
        process: "CNC milling",
        dueDate: "2026-06-20",
        lineItems: [{ partName: "Arm bracket", quantity: 12, material: "6061-T6 Aluminum" }],
        files: [{ name: "arm-bracket.step", sizeBytes: 2048, type: "model/step" }],
      }),
    );

    render(<AdminCustomerProfileDetail profile={makeCustomerProfile({ requests: [request] })} />);

    expect(screen.getByText("AR")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Business name" })).toHaveValue("Apex Robotics");
    expect(screen.queryByRole("heading", { name: "Overseas fabrication shops" })).not.toBeInTheDocument();
    expect(screen.queryByText("Active quotes")).not.toBeInTheDocument();
    expect(screen.queryByText("Standard tier")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Business users" })).toBeInTheDocument();
    expect(screen.getByText("Show details")).toBeInTheDocument();
    expect(screen.getByText("Show details").closest("details")).not.toHaveAttribute("open");
    expect(screen.getByRole("heading", { name: "RFQs and orders" })).toBeInTheDocument();
    expect(screen.getByText("Robot arm bracket RFQ")).toBeInTheDocument();
    expect(screen.getByText("Arm bracket")).toBeInTheDocument();
    expect(screen.getByText("arm-bracket.step")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open record" })).toHaveAttribute("href", `/admin/quotes?requestId=${request.id}`);
  });
});
