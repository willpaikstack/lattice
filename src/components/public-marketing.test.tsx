import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
vi.mock("@/app/book-a-call/actions", () => ({ requestCallAction: vi.fn() }));
import LandingPage from "@/app/page";
import BookACallPage from "@/app/book-a-call/page";
import { PublicHowItWorks } from "./public-how-it-works";

describe("Public manufacturing site", () => {
  it("leads with an invite-only call path and keeps RFQ intake behind access", () => {
    render(<LandingPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Take on the work.",
    );
    expect(
      screen.getByText("An invite-only manufacturing network"),
    ).toBeInTheDocument();
    for (const link of screen.getAllByRole("link", { name: "Book a call" }))
      expect(link).toHaveAttribute("href", "/book-a-call");
    expect(screen.getByRole("link", { name: "Capabilities" })).toHaveAttribute(
      "href",
      "/#capabilities",
    );
    expect(document.querySelector('a[href="/requests/new"]')).toBeNull();
    const question = screen.getByText("Where are parts manufactured?");
    fireEvent.click(question);
    expect(question.closest("details")).toHaveAttribute("open");
  });
  it("offers a call request with required needs and optional scheduling details", () => {
    render(<BookACallPage />);
    expect(
      screen.getByRole("form", { name: "Call request form" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Work email")).toHaveAttribute(
      "type",
      "email",
    );
    expect(
      screen.getByLabelText("Where could you use support?"),
    ).toBeRequired();
    expect(screen.getByLabelText("Phone (optional)")).not.toBeRequired();
    expect(
      screen.getByRole("button", { name: "Request a call" }),
    ).toBeEnabled();
    expect(screen.getByText(/confirm a time by email/)).toBeInTheDocument();
  });
  it("explains the public workflow and overseas production without exposing an RFQ action", () => {
    render(<PublicHowItWorks />);
    expect(
      screen.getByRole("heading", { name: "First, we get to know your shop." }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/manufacturing partners in China/),
    ).toBeInTheDocument();
    expect(screen.getByText(/export-restricted jobs/)).toBeInTheDocument();
    expect(document.querySelector('a[href="/requests/new"]')).toBeNull();
  });
});
