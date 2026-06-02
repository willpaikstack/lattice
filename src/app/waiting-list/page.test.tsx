import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import WaitingListPage from "./page";

describe("Waiting list page", () => {
  it("presents a waiting list request form", async () => {
    render(await WaitingListPage({}));

    expect(screen.getByRole("heading", { name: "Request access to Lattice" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Waiting list request form" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveAttribute("name", "name");
    expect(screen.getByLabelText("Work email")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Company")).toHaveAttribute("name", "company");
    expect(screen.getByLabelText("Procurement needs")).toHaveAttribute("name", "procurementNeeds");
    expect(screen.getByRole("button", { name: "Submit request" })).toHaveAttribute("type", "submit");
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
  });

  it("tells exact duplicate requesters that they already requested access", async () => {
    render(await WaitingListPage({ searchParams: Promise.resolve({ status: "already-requested" }) }));

    expect(screen.getByText("You already requested access.")).toBeInTheDocument();
    expect(screen.getByText(/That email is already on the Lattice waiting list/)).toBeInTheDocument();
  });

  it("tells same-domain requesters to check email for the current contact", async () => {
    render(await WaitingListPage({ searchParams: Promise.resolve({ status: "domain-already-requested" }) }));

    expect(screen.getByText("Your company is already represented.")).toBeInTheDocument();
    expect(screen.getByText(/current waitlist contact for your company/)).toBeInTheDocument();
  });

  it("shows a confirmation page after a successful request", async () => {
    render(await WaitingListPage({ searchParams: Promise.resolve({ status: "joined" }) }));

    expect(screen.getByRole("heading", { name: "Request received" })).toBeInTheDocument();
    expect(screen.queryByRole("form", { name: "Waiting list request form" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("link", { name: "Log in" })).not.toBeInTheDocument();
  });
});
