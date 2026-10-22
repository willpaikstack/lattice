import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LandingPage from "./page";

describe("Landing page", () => {
  it("keeps public conversion focused on an invitation and introductory call", () => {
    render(<LandingPage />);
    expect(
      screen.getByRole("heading", { name: /Take on the work/ }),
    ).toBeInTheDocument();
    for (const link of screen.getAllByRole("link", { name: "Log in" }))
      expect(link).toHaveAttribute("href", "/login");
    for (const link of screen.getAllByRole("link", { name: "Book a call" }))
      expect(link).toHaveAttribute("href", "/book-a-call");
    for (const link of screen.getAllByRole("link", { name: "Request access" }))
      expect(link).toHaveAttribute("href", "/waiting-list");
    expect(
      screen.getByRole("link", { name: "See how it works" }),
    ).toHaveAttribute("href", "/how-it-works");
    expect(
      screen.getByRole("heading", { name: "CNC milling" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "CNC turning" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Sheet metal fabrication" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Requested inspection reports and material documentation",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /get a quote|start your quote/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("No account required")).not.toBeInTheDocument();
  });
});
