import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getDemoRequests } from "@/lib/demo-requests";

import { BuyerQuotes } from "./buyer-quotes";

describe("BuyerQuotes", () => {
  it("filters quotes by search text and status", () => {
    render(<BuyerQuotes requests={getDemoRequests()} />);

    expect(screen.getByText("Hydrogen skid bracket RFQ")).toBeInTheDocument();
    expect(screen.getByText("Pump housing prototype")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Search RFQ, part, material..."), {
      target: { value: "sensor" },
    });

    expect(screen.getByText("Sensor enclosure production run")).toBeInTheDocument();
    expect(screen.queryByText("Hydrogen skid bracket RFQ")).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Search RFQ, part, material..."), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Needs info" }));

    expect(screen.getByText("Hydrogen skid bracket RFQ")).toBeInTheDocument();
    expect(screen.queryByText("Pump housing prototype")).not.toBeInTheDocument();
  });
});
