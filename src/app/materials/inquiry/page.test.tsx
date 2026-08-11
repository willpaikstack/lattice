import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentSession: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getCurrentSession: mocks.getCurrentSession,
}));

import MaterialInquiryPage from "./page";

describe("MaterialInquiryPage", () => {
  beforeEach(() => {
    mocks.getCurrentSession.mockResolvedValue({
      user: {
        email: "buyer@forgeworks.com",
        id: "buyer-1",
        name: "Avery Chen",
        role: "customer",
      },
    });
  });

  it("collects the details needed to review an unlisted material", async () => {
    render(await MaterialInquiryPage({}));

    expect(screen.getByRole("heading", { name: "Request an unlisted material" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Unlisted material inquiry form" })).toBeInTheDocument();
    expect(screen.getByLabelText("Material name or family")).toBeRequired();
    expect(screen.getByLabelText("Company")).toBeRequired();
    expect(screen.getByLabelText("Application and requirements")).toBeRequired();
    expect(screen.getByRole("button", { name: "Submit inquiry" })).toHaveAttribute("type", "submit");
    expect(screen.getByText(/Submitting as Avery Chen/)).toBeInTheDocument();
  });

  it("shows a clear confirmation after submission", async () => {
    render(await MaterialInquiryPage({ searchParams: Promise.resolve({ status: "submitted" }) }));

    expect(screen.getByRole("heading", { name: "Material inquiry received" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to materials" })).toHaveAttribute("href", "/materials");
    expect(screen.getByRole("link", { name: "Submit another inquiry" })).toHaveAttribute("href", "/materials/inquiry");
  });
});
