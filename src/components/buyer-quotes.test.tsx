import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getDemoRequests } from "@/lib/demo-requests";
import { buildDraftRequest, submitDraftRequest } from "@/lib/request-model";

import { BuyerQuotes } from "./buyer-quotes";

vi.mock("@/app/quotes/actions", () => ({
  deleteBuyerQuoteAction: vi.fn(async () => undefined),
}));

describe("BuyerQuotes", () => {
  it("sorts quote rows by created date descending", () => {
    const olderButRecentlyUpdated = {
      ...submitDraftRequest(
        buildDraftRequest({
          buyerCompany: "Amogy Manufacturing",
          requesterName: "William Paik",
          title: "Older quote updated later",
          process: "CNC milling",
          dueDate: "2026-06-20",
          lineItems: [{ partName: "Older part", quantity: 1, material: "SS 304" }],
          files: [{ name: "older.step", sizeBytes: 1024, type: "model/step" }],
        }),
      ),
      createdAt: "2026-06-01T10:00:00.000Z",
      id: "req_older",
      updatedAt: "2026-06-03T10:00:00.000Z",
    };
    const newerButUpdatedEarlier = {
      ...submitDraftRequest(
        buildDraftRequest({
          buyerCompany: "Amogy Manufacturing",
          requesterName: "William Paik",
          title: "Newer quote created later",
          process: "CNC milling",
          dueDate: "2026-06-20",
          lineItems: [{ partName: "Newer part", quantity: 1, material: "SS 304" }],
          files: [{ name: "newer.step", sizeBytes: 1024, type: "model/step" }],
        }),
      ),
      createdAt: "2026-06-02T10:00:00.000Z",
      id: "req_newer",
      updatedAt: "2026-06-02T11:00:00.000Z",
    };

    render(<BuyerQuotes requests={[olderButRecentlyUpdated, newerButUpdatedEarlier]} />);

    const rows = screen.getAllByRole("link", { name: /Open quote detail for/ });
    expect(rows.map((row) => row.getAttribute("aria-label"))).toEqual([
      "Open quote detail for Newer quote created later",
      "Open quote detail for Older quote updated later",
    ]);
    expect(screen.getByText("LQ-1001")).toBeInTheDocument();
    expect(screen.getByText("LQ-1002")).toBeInTheDocument();
    expect(screen.queryByText("LQ-REQ_OLD")).not.toBeInTheDocument();
  });

  it("filters quotes by search text", () => {
    render(<BuyerQuotes requests={getDemoRequests()} />);

    expect(screen.getByRole("heading", { name: "Quotes in progress" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Quote received" })).toBeInTheDocument();
    expect(screen.getByText("Motor plate draft")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit incomplete quote for Motor plate draft" })).toHaveAttribute("href", "/requests/new?draft=demo_incomplete");
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getAllByText("Quote received").length).toBeGreaterThan(0);
    expect(screen.getByText("Hydrogen skid bracket RFQ")).toBeInTheDocument();
    expect(screen.getByText("Pump housing prototype")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "CAD render snapshot for Mounting bracket" }).length).toBeGreaterThan(0);
    expect(screen.queryByText("LQ-DEMO_NEE")).not.toBeInTheDocument();
    expect(screen.queryByText("Valve manifold order")).not.toBeInTheDocument();
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

  it("lets buyers delete a quote row from the table", () => {
    const request = submitDraftRequest(
      buildDraftRequest({
        buyerCompany: "Amogy Manufacturing",
        requesterName: "William Paik",
        title: "Delete-ready quote",
        process: "CNC milling",
        dueDate: "2026-06-20",
        lineItems: [{ partName: "Delete-ready part", quantity: 1, material: "SS 304" }],
        files: [{ name: "delete-ready.step", sizeBytes: 1024, type: "model/step" }],
      }),
    );
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<BuyerQuotes requests={[request]} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete quote for Delete-ready quote" }));

    expect(screen.queryByText("Delete-ready quote")).not.toBeInTheDocument();
    expect(confirmSpy).toHaveBeenCalledWith('Delete "Delete-ready quote" from quotes?');

    confirmSpy.mockRestore();
  });
});
