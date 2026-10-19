import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { quoteTimingPreviewRequest } from "@/lib/quote-timing-preview-fixture";
import { BuyerQuoteDetail } from "./buyer-quote-detail";

afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.useRealTimers(); });

describe("reversible sidebar timing layout", () => {
  it("shows part production lead times and one delivery card in the sidebar", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 18, 12));
    render(<BuyerQuoteDetail request={quoteTimingPreviewRequest(2)} timingLayout="sidebar" />);
    const timing = screen.getByRole("region", { name: "Quote delivery timing" });
    expect(within(timing).getByText("Nov 20, 2026")).toBeInTheDocument();
    expect(within(timing).getByText("25 business days")).toBeInTheDocument();
    expect(within(timing).getByText("Production — 20 business days")).toBeInTheDocument();
    expect(within(timing).getByText("Shipping — 5 business days")).toBeInTheDocument();
    expect(timing.closest("aside")).not.toBeNull();
    expect(screen.queryByText("Longest part 20 + Shipping 5")).not.toBeInTheDocument();
    expect(screen.getAllByText("Estimated delivery by")).toHaveLength(1);
    expect(screen.getByRole("columnheader", { name: "Production lead time" })).toBeInTheDocument();
  });

  it("restores the previous layout using the environment switch", () => {
    vi.stubEnv("LATTICE_QUOTE_TIMING_LAYOUT", "legacy");
    render(<BuyerQuoteDetail request={quoteTimingPreviewRequest()} />);
    expect(screen.queryByRole("region", { name: "Quote delivery timing" })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Lead time" })).toBeInTheDocument();
    expect(screen.queryByText("Production")).not.toBeInTheDocument();
  });
});
