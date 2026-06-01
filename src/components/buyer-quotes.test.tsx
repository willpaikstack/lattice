import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getDemoRequests } from "@/lib/demo-requests";

import { BuyerQuotes } from "./buyer-quotes";

describe("BuyerQuotes", () => {
  it("filters quotes by search text", () => {
    render(<BuyerQuotes requests={getDemoRequests()} />);

    expect(screen.getByText("Motor plate draft")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit incomplete quote for Motor plate draft" })).toHaveAttribute("href", "/requests/new?draft=demo_incomplete");
    expect(screen.getAllByText("Configuring Quote").length).toBeGreaterThan(0);
    expect(screen.getByText("Hydrogen skid bracket RFQ")).toBeInTheDocument();
    expect(screen.getByText("Pump housing prototype")).toBeInTheDocument();
    expect(screen.queryByLabelText("Quote status filters")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Needs info" })).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Search RFQ, part, or material..."), {
      target: { value: "sensor" },
    });

    expect(screen.getByText("Sensor enclosure production run")).toBeInTheDocument();
    expect(screen.queryByText("Hydrogen skid bracket RFQ")).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Search RFQ, part, or material..."), {
      target: { value: "" },
    });

    expect(screen.getByText("Hydrogen skid bracket RFQ")).toBeInTheDocument();
    expect(screen.getByText("Pump housing prototype")).toBeInTheDocument();
  });
});
