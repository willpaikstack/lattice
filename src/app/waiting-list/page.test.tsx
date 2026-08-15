import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import WaitingListPage from "./page";

describe("Waiting list page", () => {
  it("presents a waiting list request form", async () => {
    render(await WaitingListPage({}));

    expect(screen.getByRole("heading", { name: "Request access to Lattice" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Waiting list request form" })).toBeInTheDocument();
    expect(screen.getByLabelText("Full name")).toHaveAttribute("name", "name");
    expect(screen.getByLabelText("Work email")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Company")).toHaveAttribute("name", "company");
    expect(screen.getByLabelText("What kind of work do you need support with?")).toHaveAttribute("name", "procurementNeeds");
    expect(screen.getByRole("button", { name: "Request access" })).toHaveAttribute("type", "submit");
    expect(screen.getAllByRole("link", { name: "Log in" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Log in" })[0]).toHaveAttribute("href", "/login");
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
    expect(screen.getByRole("link", { name: "Return to Lattice" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "See how Lattice works" })).toHaveAttribute("href", "/how-it-works");
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
  });
});
