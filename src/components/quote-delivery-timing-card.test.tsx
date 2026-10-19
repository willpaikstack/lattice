import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QuoteDeliveryTimingCard } from "./quote-delivery-timing-card";

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("viewing-date delivery estimate", () => {
  it("advances on local midnight and refreshes when a suspended tab regains focus", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 18, 23, 59, 59));
    render(<QuoteDeliveryTimingCard productionDays={20} shippingDays={5} initialViewingDate="2026-10-18" />);
    expect(screen.getByText("Nov 20, 2026")).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(2000); });
    expect(screen.getByText("Nov 23, 2026")).toBeInTheDocument();
    vi.setSystemTime(new Date(2026, 9, 26, 12));
    fireEvent.focus(window);
    expect(screen.getByText("Nov 30, 2026")).toBeInTheDocument();
  });

  it("shows a pending estimate when shipping is not specified", () => {
    render(<QuoteDeliveryTimingCard productionDays={20} shippingDays={null} initialViewingDate="2026-10-18" />);
    expect(screen.getByText("Shipping duration has not been specified.")).toBeInTheDocument();
    expect(screen.getAllByText("Pending")).toHaveLength(2);
  });
});
