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
      id: "req_mq8older_abcd12",
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
      id: "req_mq9newer_efgh34",
      updatedAt: "2026-06-02T11:00:00.000Z",
    };

    render(<BuyerQuotes requests={[olderButRecentlyUpdated, newerButUpdatedEarlier]} />);

    const rows = screen.getAllByRole("link", { name: /Open quote detail for/ });
    expect(rows.map((row) => row.getAttribute("aria-label"))).toEqual([
      "Open quote detail for Newer quote created later",
      "Open quote detail for Older quote updated later",
    ]);
    expect(screen.getByText("LQ-MQ9NEWER")).toBeInTheDocument();
    expect(screen.getByText("LQ-MQ8OLDER")).toBeInTheDocument();
    expect(screen.queryByText("LQ-1001")).not.toBeInTheDocument();
    expect(screen.queryByText("LQ-1002")).not.toBeInTheDocument();
  });

  it("renders quote tables without search controls", () => {
    render(<BuyerQuotes requests={getDemoRequests()} />);

    expect(screen.getByRole("heading", { name: "Quotes in progress" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Quote received" })).toBeInTheDocument();
    expect(screen.getAllByText("Last edited").length).toBeGreaterThan(0);
    expect(screen.getByText("Motor plate draft")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit incomplete quote for Motor plate draft" })).toHaveAttribute("href", "/requests/new?draft=demo_incomplete");
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getAllByText("Quote Requested").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Quote Received").length).toBeGreaterThan(0);
    expect(screen.getByText("Hydrogen skid bracket RFQ")).toBeInTheDocument();
    expect(screen.getByText("Pump housing prototype")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "CAD render snapshot for Mounting bracket" }).length).toBeGreaterThan(0);
    expect(screen.getByText("LQ-DEMO_NEE")).toBeInTheDocument();
    expect(screen.queryByText("Valve manifold order")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Quote status filters")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Needs info" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Search quotes")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search RFQ, part, or material...")).not.toBeInTheDocument();
    expect(screen.getByText("Sensor enclosure production run")).toBeInTheDocument();
    expect(screen.getByText("Hydrogen skid bracket RFQ")).toBeInTheDocument();
    expect(screen.getByText("Pump housing prototype")).toBeInTheDocument();
  });

  it("shows an additional part count next to quote preview thumbnails", () => {
    const request = submitDraftRequest(
      buildDraftRequest({
        buyerCompany: "Amogy Manufacturing",
        requesterName: "William Paik",
        title: "Multi-part quote",
        process: "CNC milling",
        dueDate: "2026-06-20",
        lineItems: [
          { partName: "Front plate", quantity: 1, material: "6061-T6 Aluminum" },
          { partName: "Rear spacer", quantity: 2, material: "6061-T6 Aluminum" },
        ],
        files: [
          { name: "front-plate.step", sizeBytes: 1024, type: "model/step" },
          { name: "rear-spacer.step", sizeBytes: 1024, type: "model/step" },
        ],
      }),
    );

    const { container } = render(<BuyerQuotes requests={[request]} />);

    expect(screen.getByRole("group", { name: "2 parts in Multi-part quote" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "CAD render snapshot for Front plate" })).toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
    expect(screen.getByText("Qty 3 - Due Jun 20, 2026")).toBeInTheDocument();
    expect(container.querySelector('img[src*="/api/cad-previews/thumbnail"]')).toBeNull();
  });

  it("does not count support files as additional quote parts", () => {
    const request = submitDraftRequest(
      buildDraftRequest({
        buyerCompany: "Amogy Manufacturing",
        requesterName: "William Paik",
        title: "Two-line quote with drawings",
        process: "CNC milling",
        dueDate: "2026-06-20",
        lineItems: [
          { partName: "Front plate", quantity: 1, material: "6061-T6 Aluminum" },
          { partName: "Rear spacer", quantity: 2, material: "6061-T6 Aluminum" },
        ],
        files: [
          { name: "front-plate.step", sizeBytes: 1024, type: "model/step" },
          { name: "front-plate-drawing.pdf", sizeBytes: 1024, type: "application/pdf" },
          { name: "rear-spacer.step", sizeBytes: 1024, type: "model/step" },
          { name: "rear-spacer-drawing.pdf", sizeBytes: 1024, type: "application/pdf" },
        ],
      }),
    );

    render(<BuyerQuotes requests={[request]} />);

    expect(screen.getByRole("group", { name: "2 parts in Two-line quote with drawings" })).toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
    expect(screen.queryByText("+3")).not.toBeInTheDocument();
  });

  it("uses saved CAD preview thumbnails when a quote file has a preview URN", () => {
    const request = submitDraftRequest(
      buildDraftRequest({
        buyerCompany: "Amogy Manufacturing",
        requesterName: "William Paik",
        title: "Preview-ready quote",
        process: "CNC milling",
        dueDate: "2026-06-20",
        lineItems: [{ partName: "Preview plate", quantity: 1, material: "6061-T6 Aluminum" }],
        files: [{ name: "preview-plate.step", sizeBytes: 1024, type: "model/step", cadPreviewUrn: "translated-preview-urn" }],
      }),
    );

    const { container } = render(<BuyerQuotes requests={[request]} />);

    expect(screen.getByRole("img", { name: "CAD render snapshot for Preview plate" })).toBeInTheDocument();
    expect(container.querySelector('img[src*="/api/cad-previews/thumbnail"]')).toBeInTheDocument();
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
