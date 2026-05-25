import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Home dashboard", () => {
  it("matches the Bubble home page structure with KPIs, inbox, transactions, and orders", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: "Hi" })).toBeInTheDocument();
    expect(screen.getByText("Active RFQs")).toBeInTheDocument();
    expect(screen.getByText("43 unread quotes")).toBeInTheDocument();
    expect(screen.getByText("Shipped")).toBeInTheDocument();
    expect(screen.getByText("Alerts")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Inbox" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Star inbox" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Transactions" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View All/ })).toHaveAttribute("href", "/quotes");
    expect(screen.getByRole("heading", { name: "Orders" })).toBeInTheDocument();
    expect(screen.getByText("william.paik@amogy.co")).toBeInTheDocument();
  });
});
