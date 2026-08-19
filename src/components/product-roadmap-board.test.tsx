import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProductRoadmapBoard, type ProductRoadmapBoardItem } from "./product-roadmap-board";

const mocks = vi.hoisted(() => ({
  setRoadmapInterestAction: vi.fn(),
}));

vi.mock("@/app/(workspace)/roadmap/actions", () => ({
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

    expect(screen.getByRole("heading", { name: "What we’re building next." })).toBeInTheDocument();
    expect(screen.queryByText(/^\d+ customers?$/)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Assembly and Kitting" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove interest in Assembly and Kitting" }));

    await waitFor(() => {
      expect(mocks.setRoadmapInterestAction).toHaveBeenCalledWith("assembly-and-kitting", false);
    });

    expect(screen.getByRole("button", { name: "Flag interest in Assembly and Kitting" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByText(/^\d+ customers?$/)).not.toBeInTheDocument();
  });

  it("groups upcoming investments into Soon and Later wiki sections", () => {
    render(<ProductRoadmapBoard items={items} />);

    expect(screen.getByRole("heading", { name: "Soon" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Later" })).not.toBeInTheDocument();
    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Assembly and Kitting" })).toBeInTheDocument();
  });
});
