import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { deleteBuyerQuoteAction } from "@/app/quotes/actions";
import { getDemoRequests } from "@/lib/demo-requests";
import { buildDraftRequest, submitDraftRequest } from "@/lib/request-model";

import { BuyerQuotes } from "./buyer-quotes";

vi.mock("@/app/quotes/actions", () => ({
  deleteBuyerQuoteAction: vi.fn(async () => undefined),
}));

describe("BuyerQuotes", () => {
  it("sorts quote rows by last edited date descending", () => {
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
      "Open quote detail for Older quote updated later",
      "Open quote detail for Newer quote created later",
    ]);
    expect(screen.getByText("LQ-MQ9NEWER")).toBeInTheDocument();
    expect(screen.getByText("LQ-MQ8OLDER")).toBeInTheDocument();
    expect(screen.queryByText("LQ-1001")).not.toBeInTheDocument();
    expect(screen.queryByText("LQ-1002")).not.toBeInTheDocument();
  });

  it("paginates quote tables in groups of three newest-edited rows", () => {
    const requests = Array.from({ length: 4 }, (_, index) => ({
      ...submitDraftRequest(
        buildDraftRequest({
          buyerCompany: "Amogy Manufacturing",
          requesterName: "William Paik",
          title: `Paged quote ${index + 1}`,
          process: "CNC milling",
          dueDate: "2026-06-20",
          lineItems: [{ partName: `Paged part ${index + 1}`, quantity: 1, material: "SS 304" }],
          files: [{ name: `paged-${index + 1}.step`, sizeBytes: 1024, type: "model/step" }],
        }),
      ),
      createdAt: `2026-06-0${index + 1}T10:00:00.000Z`,
      id: `req_paged_${index + 1}`,
      updatedAt: `2026-06-0${index + 1}T10:00:00.000Z`,
    }));

    render(<BuyerQuotes requests={requests} />);

    expect(screen.getByText("Paged quote 4")).toBeInTheDocument();
    expect(screen.getByText("Paged quote 3")).toBeInTheDocument();
    expect(screen.getByText("Paged quote 2")).toBeInTheDocument();
    expect(screen.queryByText("Paged quote 1")).not.toBeInTheDocument();
    expect(screen.getByText("Showing 1-3 of 4 quotes")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.queryByText("Paged quote 4")).not.toBeInTheDocument();
    expect(screen.getByText("Paged quote 1")).toBeInTheDocument();
    expect(screen.getByText("Showing 4-4 of 4 quotes")).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
  });

  it("renders quote tables without search controls", () => {
    render(<BuyerQuotes requests={getDemoRequests()} />);

    expect(screen.getByRole("heading", { name: "Quotes in progress" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Quote received" })).toBeInTheDocument();
    expect(screen.getAllByText("Last edited").length).toBeGreaterThan(0);
    expect(screen.getByText("Pump cover revision C")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit incomplete quote for Pump cover revision C" })).toHaveAttribute("href", "/requests/new?draft=demo_draft_pump_cover");
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getAllByText("Quote Requested").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Quote Received").length).toBeGreaterThan(0);
    expect(screen.getByText("Gearbox mounting plate")).toBeInTheDocument();
    expect(screen.getByText("Valve body prototype")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "CAD render snapshot for CNC mounting bracket set" }).length).toBeGreaterThan(0);
    expect(screen.getByText("LQ-DEMO_NEE")).toBeInTheDocument();
    expect(screen.queryByText("Battery tray fixture")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Quote status filters")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Needs info" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Search quotes")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search RFQ, part, or material...")).not.toBeInTheDocument();
    expect(screen.getByText("CNC mounting bracket set")).toBeInTheDocument();
    expect(screen.getByText("Fluid manifold production run")).toBeInTheDocument();
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

  it("lets buyers delete a saved quote row from the table", async () => {
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

    await waitFor(() => expect(screen.queryByText("Delete-ready quote")).not.toBeInTheDocument());
    expect(confirmSpy).toHaveBeenCalledWith('Delete "Delete-ready quote" from quotes?');

    confirmSpy.mockRestore();
  });

  it("discards browser-only drafts without calling the server delete action", () => {
    const draft = {
      ...submitDraftRequest(
        buildDraftRequest({
          buyerCompany: "Amogy Manufacturing",
          requesterName: "William Paik",
          title: "Local draft quote",
          process: "CNC milling",
          dueDate: "2026-06-20",
          lineItems: [{ partName: "Draft part", quantity: 1, material: "SS 304" }],
          files: [{ name: "draft.step", sizeBytes: 1024, type: "model/step" }],
        }),
      ),
      id: "local_draft_delete_ready",
      status: "DRAFT" as const,
    };
    const deleteAction = vi.mocked(deleteBuyerQuoteAction);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    deleteAction.mockClear();
    window.localStorage.setItem("lattice.incompleteRfqs.v1", JSON.stringify([{ id: draft.id, request: draft }]));
    render(<BuyerQuotes requests={[]} />);

    fireEvent.click(screen.getByRole("button", { name: "Discard draft for Local draft quote" }));

    expect(screen.queryByText("Local draft quote")).not.toBeInTheDocument();
    expect(confirmSpy).toHaveBeenCalledWith('Discard draft "Local draft quote"?');
    expect(deleteAction).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });
});
