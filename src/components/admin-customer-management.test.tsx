import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { AdminCustomerManagement } from "./admin-customer-management";
import { AdminCustomerProfileDetail } from "./admin-customer-profile-detail";
import {
  customerProfileIcon,
  type CustomerProfile,
} from "@/lib/customer-profiles";
import { buildDraftRequest, submitDraftRequest } from "@/lib/request-model";

function makeCustomerProfile(
  overrides: Partial<CustomerProfile> = {},
): CustomerProfile {
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

beforeAll(() => {
  if (!HTMLDialogElement.prototype.showModal)
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute("open", "");
    };
  if (!HTMLDialogElement.prototype.close)
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute("open");
    };
});

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

    fireEvent.click(screen.getByRole("tab", { name: "Waiting list (1)" }));
    expect(
      screen.getByRole("heading", { name: "Waiting list" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1 joined")).toBeInTheDocument();
    expect(screen.getByText("Avery Chen")).toBeInTheDocument();
    expect(screen.getByText("avery@forgeworks.com")).toBeInTheDocument();
    expect(screen.getByText("ForgeWorks")).toBeInTheDocument();
    expect(
      screen.getByText("Recurring CNC RFQs and supplier follow-up."),
    ).toBeInTheDocument();
  });

  it("opens the customer-company provisioning workflow", () => {
    render(<AdminCustomerManagement customers={[]} />);

    fireEvent.click(screen.getByRole("button", { name: "Create customer" }));

    expect(
      screen.getByRole("heading", { name: "Create customer company" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Company name")).toBeRequired();
    expect(screen.getByLabelText("Full name")).toBeRequired();
    expect(screen.getByLabelText("Work email")).toBeRequired();
    expect(
      screen.getByRole("button", { name: "Create company and admin" }),
    ).toBeInTheDocument();
  });

  it("opens a customer profile from each customer company row", () => {
    render(<AdminCustomerManagement customers={[makeCustomerProfile()]} />);

    expect(
      screen.getByRole("link", {
        name: "Open customer profile for Apex Robotics",
      }),
    ).toHaveAttribute("href", "/admin/customers/company_123");
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
        lineItems: [
          {
            partName: "Arm bracket",
            quantity: 12,
            material: "6061-T6 Aluminum",
          },
        ],
        files: [
          { name: "arm-bracket.step", sizeBytes: 2048, type: "model/step" },
        ],
      }),
    );

    render(
      <AdminCustomerProfileDetail
        profile={makeCustomerProfile({ requests: [request] })}
        updateAction={vi.fn()}
      />,
    );

    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("heading", { name: "Business details" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Business name" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Business users" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open record: Robot arm bracket RFQ" }),
    ).toHaveAttribute("href", `/admin/quotes?requestId=${request.id}`);
    fireEvent.click(screen.getByRole("tab", { name: "RFQs & orders" }));
    expect(
      screen.getByRole("heading", { name: "RFQs and orders" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit company" }));
    expect(
      screen.getByRole("dialog", { name: "Edit company" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Business name" })).toHaveValue(
      "Apex Robotics",
    );
  });

  it("keeps sensitive user actions hidden until an operator chooses one", () => {
    render(<AdminCustomerProfileDetail profile={makeCustomerProfile()} />);
    expect(
      screen.queryByRole("button", { name: "Set password" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "New work email" }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Actions for Maya Chen" }),
    );
    fireEvent.click(
      screen.getByRole("menuitem", { name: "Verify email change" }),
    );
    expect(
      screen.getByRole("dialog", { name: "Verify email change" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "New work email" }),
    ).toBeRequired();
    expect(
      screen.getByRole("button", { name: "Send email verification" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remove user" }),
    ).not.toBeInTheDocument();
  });

  it("does not include inactive companies in the Active filter", () => {
    render(
      <AdminCustomerManagement
        customers={[
          makeCustomerProfile(),
          makeCustomerProfile({
            id: "inactive",
            name: "Inactive Company",
            accountStatus: "Inactive",
          }),
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Active" }));
    expect(
      screen.getByRole("link", {
        name: "Open customer profile for Apex Robotics",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", {
        name: "Open customer profile for Inactive Company",
      }),
    ).not.toBeInTheDocument();
  });
  it("keeps company edits available after a failed save", async () => {
    const updateAction = vi
      .fn()
      .mockRejectedValue(new Error("Database unavailable"));
    render(
      <AdminCustomerProfileDetail
        profile={makeCustomerProfile()}
        updateAction={updateAction}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Edit company" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Business name" }), {
      target: { value: "Updated Company" },
    });
    fireEvent.submit(
      screen
        .getByRole("button", { name: "Save customer profile" })
        .closest("form")!,
    );
    await waitFor(() =>
      expect(
        screen.getByText("The profile could not be saved. Please try again."),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole("textbox", { name: "Business name" })).toHaveValue(
      "Updated Company",
    );
    const data = updateAction.mock.calls[0][0] as FormData;
    expect(data.get("billingEmail")).toBe("ap@apex.example");
    expect(data.get("notes")).toBe("Prefers concise quote summaries.");
  });
});
