import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LandingPage from "./page";

describe("Landing page", () => {
  it("keeps unauthenticated entry points limited to login and the header quote action", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", {
        name: "Additional capacity when you need it.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Request an account" })).toHaveAttribute("href", "/waiting-list");
    expect(screen.queryByRole("link", { name: "Get a quote" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Explore capabilities" })).not.toBeInTheDocument();
    expect(screen.getByText("Access Lattice's qualified global CNC machining and fabrication network for overflow and cyclical demand—without disrupting your schedule. We coordinate production, documentation, and delivery so you can protect lead times and stay responsive to customers.")).toBeInTheDocument();
    for (const label of ["Capabilities", "Materials", "Quality"]) {
      expect(screen.queryByRole("link", { name: label })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: label })).not.toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: "See how Lattice delivers" })).toHaveAttribute("href", "/how-it-works");
    expect(screen.queryByRole("link", { name: "How it works" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Start your quote" })).not.toBeInTheDocument();
    expect(screen.queryByText("No account required")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Quality you can verify." })).toBeInTheDocument();
    expect(screen.queryByText("QUALITY YOU CAN VERIFY")).not.toBeInTheDocument();
    expect(screen.getByText("Requested inspection reports and material documentation are uploaded to Lattice for your review before shipment.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Capability across demanding industries." })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Industries represented by documented partner capabilities" })).toHaveTextContent("Automotive & mobility");
    expect(screen.getByRole("list", { name: "Industries represented by documented partner capabilities" })).toHaveTextContent("Semiconductors");
    expect(screen.getByText("Industry coverage reflects public supplier capability information. Production fit and availability are confirmed for each job.")).toBeInTheDocument();
  });
});
