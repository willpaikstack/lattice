import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminCustomerManagement } from "./admin-customer-management";

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
});
