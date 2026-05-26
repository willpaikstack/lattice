import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CustomerQuoteBuilder } from "./customer-quote-builder";

describe("CustomerQuoteBuilder", () => {
  it("renders editable quote inputs and generated customer preview", () => {
    render(<CustomerQuoteBuilder />);

    expect(screen.getByLabelText("Quote number")).toHaveDisplayValue("LQ-2026-0142");
    expect(screen.getByLabelText("Customer company")).toHaveDisplayValue("Apex Robotics");
    expect(screen.getByText("$2,300.00")).toBeInTheDocument();
    expect(screen.getByDisplayValue(/# Quote LQ-2026-0142/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "50" } });

    expect(screen.getByText("$4,600.00")).toBeInTheDocument();
    expect(screen.getByDisplayValue(/50 \| \$92.00 \| \$4,600.00/)).toBeInTheDocument();
  });

  it("adds a second line item", () => {
    render(<CustomerQuoteBuilder />);

    fireEvent.click(screen.getByRole("button", { name: "Add line" }));

    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });
});
