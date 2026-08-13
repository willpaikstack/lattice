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
    for (const label of ["Capabilities", "Materials", "Quality", "How it works"]) {
      expect(screen.getByRole("button", { name: label })).toBeDisabled();
      expect(screen.queryByRole("link", { name: label })).not.toBeInTheDocument();
    }
    expect(screen.queryByRole("link", { name: "Start your quote" })).not.toBeInTheDocument();
    expect(screen.queryByText("No account required")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Quality you can verify." })).toBeInTheDocument();
    expect(screen.getByText("Requested inspection reports and material documentation are uploaded to Lattice for your review before shipment.")).toBeInTheDocument();
  });
});
