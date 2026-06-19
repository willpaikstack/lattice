import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProductRoadmapBoard, type ProductRoadmapBoardItem } from "./product-roadmap-board";

const mocks = vi.hoisted(() => ({
  setRoadmapInterestAction: vi.fn(),
}));

vi.mock("@/app/roadmap/actions", () => ({
  setRoadmapInterestAction: mocks.setRoadmapInterestAction,
}));

const items: ProductRoadmapBoardItem[] = [
  {
    category: "Quoting",
    customerValue: "Fewer clarification loops before supplier pricing starts.",
    horizon: "Next",
    id: "instant-dfm-review",
    interested: false,
    interestedCount: 2,
    signals: ["Automatic drawing and CAD requirement checks", "Tolerance and material risk flags"],
    status: "Pilot",
    summary: "A faster manufacturability review for quote blockers.",
    title: "Instant DFM Review",
  },
  {
    category: "Services",
    customerValue: "One place to source production-ready assemblies.",
    horizon: "Soon",
    id: "assembly-and-kitting",
    interested: true,
    interestedCount: 1,
    signals: ["Multi-part kitting", "Basic assembly"],
    status: "Discovery",
    summary: "Post-machining assembly and kitting services.",
    title: "Assembly and Kitting",
  },
];

describe("ProductRoadmapBoard", () => {
  beforeEach(() => {
    mocks.setRoadmapInterestAction.mockReset();
    mocks.setRoadmapInterestAction.mockResolvedValue({
      createdAt: "2026-06-17T12:00:00.000Z",
      id: "interest_1",
      isInterested: true,
      roadmapItemId: "instant-dfm-review",
      updatedAt: "2026-06-17T12:00:00.000Z",
      userEmail: "buyer@example.com",
      userName: "Buyer",
    });
  });

  it("saves and reflects customer interest flags", async () => {
    render(<ProductRoadmapBoard items={items} />);

    expect(screen.getByRole("heading", { name: "Help prioritize what Lattice builds next" })).toBeInTheDocument();
    expect(screen.getByText("2 customers")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Assembly and Kitting" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Flag interest in Instant DFM Review" }));

    await waitFor(() => {
      expect(mocks.setRoadmapInterestAction).toHaveBeenCalledWith("instant-dfm-review", true);
    });

    expect(screen.getByRole("button", { name: "Remove interest in Instant DFM Review" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("3 customers")).toBeInTheDocument();
    expect(screen.getAllByText("Instant DFM Review").length).toBeGreaterThan(1);
  });

  it("filters roadmap items by category", () => {
    render(<ProductRoadmapBoard items={items} />);

    fireEvent.click(screen.getByRole("button", { name: "Services" }));

    expect(screen.queryByRole("heading", { name: "Instant DFM Review" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Assembly and Kitting" })).toBeInTheDocument();
  });
});
