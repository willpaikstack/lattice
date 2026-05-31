import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Home dashboard", () => {
  it("matches the Bubble home page structure with KPIs, inbox, transactions, and orders", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: "Hi William Paik" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View Active RFQs/ })).toHaveAttribute("href", "/quotes");
    expect(screen.getByText("43 unread quotes")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View Orders/ })).toHaveAttribute("href", "/orders");
    expect(screen.getByRole("link", { name: /View Shipped/ })).toHaveAttribute("href", "/shipped");
    expect(screen.getByRole("link", { name: /View Alerts/ })).toHaveAttribute("href", "/notifications");
    expect(screen.getByRole("heading", { name: "Inbox" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Star inbox" })).not.toBeInTheDocument();
    expect(screen.getByText("Customer updates across RFQs, orders, and quality documentation")).toBeInTheDocument();
    expect(screen.getByText("Order PO-1042 moved to final inspection")).toBeInTheDocument();
    expect(screen.getByText("RFQ RFQ-1187 is ready for review")).toBeInTheDocument();
    expect(screen.getByText("Quality documents uploaded")).toBeInTheDocument();
    expect(screen.getByText("Drawing clarification requested")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Transactions" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View All/ })).toHaveAttribute("href", "/quotes");
    expect(screen.getByRole("heading", { name: "Orders" })).toBeInTheDocument();
    expect(screen.getByText("william.paik@amogy.co")).toBeInTheDocument();
  });
});
