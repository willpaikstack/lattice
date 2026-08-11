import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RequestForm } from "./request-form";
import {
  buildDraftRequest,
  type LatticeRequest,
} from "@/lib/request-model";

const routerPushMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPushMock,
  }),
}));

const configurationRequiredPreview = {
  status: "configuration_required",
  message: "Add APS credentials to enable live previews.",
};

function makeResumeRequest(
  overrides: Partial<LatticeRequest> = {},
): LatticeRequest {
  const request = buildDraftRequest({
    buyerCompany: "Amogy Manufacturing",
    dueDate: "2026-06-30",
    files: [],
    lineItems: [
      {
        material: "6061-T6 Aluminum",
        partName: "Aluminum Plate",
        quantity: 8,
      },
    ],
    process: "CNC Milling",
    requesterName: "William Paik",
    title: "Aluminum Plate RFQ",
  });

  return {
    ...request,
    createdAt: "2026-06-09T14:00:00.000Z",
    id: "req_resume",
    status: "SUBMITTED",
    updatedAt: "2026-06-10T14:00:00.000Z",
    ...overrides,
  };
}

function mockRequestFormFetch({
  preview = configurationRequiredPreview,
  request = {
    id: "req_submitted",
    title: "Bracket",
    status: "SUBMITTED",
  },
}: {
  preview?: Record<string, string>;
  request?: Record<string, string>;
} = {}) {
  const fetchMock = vi.mocked(fetch);

  fetchMock.mockImplementation(async (input, init) => {
    const url = typeof input === "string" ? input : "url" in input ? input.url : String(input);

    if (url.includes("/api/request-draft-files")) {
      const file = init?.body instanceof FormData ? init.body.get("file") : null;

      if (file instanceof File) {
        return new Response(
          JSON.stringify({
            file: {
              name: file.name,
              sizeBytes: file.size,
              storageKey: `rfq-drafts/test/${file.name}`,
              type: file.type || "application/octet-stream",
            },
          }),
          { status: 201 },
        );
      }

      return new Response(JSON.stringify({ error: "missing file" }), { status: 400 });
    }

    if (url.includes("/api/cad-previews")) {
      return new Response(JSON.stringify({ preview }), {
        status: preview.status === "configuration_required" ? 501 : preview.status === "processing" ? 202 : 200,
      });
    }

    if (url.includes("/api/requests")) {
      return new Response(JSON.stringify({ request }), { status: 201 });
    }

    return new Response(JSON.stringify({}), { status: 200 });
  });

  return fetchMock;
}

describe("RequestForm", () => {
  beforeEach(() => {
    const storage = new Map<string, string>();

    routerPushMock.mockClear();
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      removeItem: vi.fn((key: string) => {
        storage.delete(key);
      }),
      setItem: vi.fn((key: string, value: string) => {
        storage.set(key, value);
      }),
    });
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:technical-drawing-preview"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    window.localStorage?.removeItem?.("lattice.incompleteRfqs.v1");
    vi.unstubAllGlobals();
  });

  it("emulates Bubble's upload-first RFQ intake without debug placeholder text", () => {
    render(<RequestForm />);

    expect(screen.getByRole("heading", { name: "Request a quote" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Request quote progress" })).toBeInTheDocument();
    expect(screen.getByText("Drafts autosave as you work")).toBeInTheDocument();
    expect(screen.getByText("Drag & drop CAD files here, or browse")).toBeInTheDocument();
    expect(screen.getByText(/STEP, STP, IGES, IGS, SLDPRT, SAT, X_T, X_B, IPT/)).toBeInTheDocument();
    expect(screen.getByText("Maximum file size: 200 MB per file")).toBeInTheDocument();
    expect(screen.queryByLabelText("Customer PO#")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Company Name")).not.toBeInTheDocument();
    expect(screen.queryByText("Attach a CAD file to unlock customer details and manufacturing configuration.")).not.toBeInTheDocument();
    expect(screen.queryByText("Quote ID:")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Material")).not.toBeInTheDocument();
    expect(screen.queryByText("Quality documentation")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Request Quote" })).not.toBeInTheDocument();
    expect(screen.queryByText("HEADER")).not.toBeInTheDocument();
    expect(screen.queryByText("yes(No quote line items)")).not.toBeInTheDocument();
    expect(screen.queryByText("3D preview")).not.toBeInTheDocument();
    expect(screen.queryByText(/Select a CAD file to generate an interactive model preview/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quote name" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Quote name" })).not.toBeInTheDocument();
  });

  it("keeps submitted quotes out of the draft continuation section", () => {
    render(
      <RequestForm
        resumeRequests={[
          makeResumeRequest({
            id: "req_submitted_resume",
            status: "SUBMITTED",
            title: "Aluminum Plate RFQ",
          }),
        ]}
      />,
    );

    expect(screen.queryByRole("heading", { name: "Draft requests" })).not.toBeInTheDocument();
    expect(screen.queryByText("Aluminum Plate RFQ")).not.toBeInTheDocument();
    expect(screen.getByText("Drag & drop CAD files here, or browse")).toBeInTheDocument();
  });

  it("shows local incomplete RFQ drafts as resumable drafts", () => {
    const localDraft = makeResumeRequest({
      id: "local_draft_resume",
      status: "DRAFT",
      title: "Motor plate draft",
    });

    window.localStorage.setItem(
      "lattice.incompleteRfqs.v1",
      JSON.stringify([
        {
          id: localDraft.id,
          initialState: {
            dueDate: "2026-06-30",
            partName: "Aluminum Plate",
            projectName: "Motor plate draft",
          },
          request: localDraft,
          updatedAt: "2026-06-10T14:00:00.000Z",
        },
      ]),
    );

    render(<RequestForm />);

    expect(screen.getByRole("heading", { name: "Draft requests" })).toBeInTheDocument();
    expect(screen.getByText("Continue RFQs that have not been submitted.")).toBeInTheDocument();
    expect(screen.getByText("Motor plate draft")).toBeInTheDocument();
    expect(screen.getAllByText("Draft").length).toBeGreaterThan(0);
    expect(screen.getByText("40% complete")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Continue draft for Motor plate draft" }),
    ).toHaveAttribute("href", "/requests/new?draft=local_draft_resume");
  });

  it("prompts for an optional reason before archiving a server draft", async () => {
    const fetchMock = mockRequestFormFetch();
    const serverDraft = makeResumeRequest({
      id: "req_server_draft",
      status: "DRAFT",
      title: "Pump cover revision C",
    });

    render(<RequestForm resumeRequests={[serverDraft]} />);

    fireEvent.click(screen.getByRole("button", { name: "Archive draft for Pump cover revision C" }));
    const dialog = screen.getByRole("dialog", { name: "Archive draft quote?" });

    expect(within(dialog).getByText(/You can add a reason/)).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText("Reason for archiving"), {
      target: { value: "No longer needed." },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Archive quote" }));

    await waitFor(() => expect(screen.queryByText("Pump cover revision C")).not.toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith("/api/requests/req_server_draft/archive", {
      body: JSON.stringify({ reason: "No longer needed." }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  });

  it("archives browser-local incomplete drafts without calling the API", async () => {
    const localDraft = makeResumeRequest({
      id: "local_draft_archive",
      status: "DRAFT",
      title: "Local bracket draft",
    });

    window.localStorage.setItem(
      "lattice.incompleteRfqs.v1",
      JSON.stringify([
        {
          id: localDraft.id,
          initialState: {
            dueDate: "2026-06-30",
            partName: "Bracket",
            projectName: "Local bracket draft",
          },
          request: localDraft,
          updatedAt: "2026-06-10T14:00:00.000Z",
        },
      ]),
    );

    render(<RequestForm />);

    fireEvent.click(screen.getByRole("button", { name: "Archive draft for Local bracket draft" }));
    fireEvent.click(screen.getByRole("button", { name: "Archive quote" }));

    await waitFor(() => expect(screen.queryByText("Local bracket draft")).not.toBeInTheDocument());
    expect(fetch).not.toHaveBeenCalled();
  });

  it("reveals quote configuration fields after a CAD file is selected", async () => {
    mockRequestFormFetch();

    render(<RequestForm />);

    const file = new File(["solid"], "bracket.step", { type: "model/step" });
    fireEvent.change(screen.getByLabelText("Choose CAD file"), {
      target: { files: [file] },
    });

    await screen.findByText("Line item 1: bracket");
    expect(screen.queryByRole("heading", { name: "Bracket" })).not.toBeInTheDocument();
    expect(screen.getByText("CAD file preview")).toBeInTheDocument();
    expect(screen.getByText("Autodesk preview setup needed")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Inspections & Certificates" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Technical drawing/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Customer PO#")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Company Name")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Quote name" })).toHaveTextContent("Bracket");
    expect(screen.queryByRole("textbox", { name: "Quote name" })).not.toBeInTheDocument();
    const collapseLineItemButton = screen.getByRole("button", { name: "Collapse Line item 1: bracket" });
    fireEvent.click(collapseLineItemButton);
    expect(screen.getByRole("button", { name: "Expand Line item 1: bracket" })).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(screen.getByRole("button", { name: "Expand Line item 1: bracket" }));
    expect(screen.getByRole("button", { name: "Collapse Line item 1: bracket" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("Material")).toHaveDisplayValue("SS 304");
    expect(screen.getByText(/UNS: S30400 \| X5CrNi18-10/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Material dropdown" }));
    expect(screen.getByRole("button", { name: /Aluminum/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Stainless steel/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Aluminum/i }));
    expect(screen.getAllByText(/UNS: A96061 \| AlMg1SiCu/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("option", { name: /2014 Aluminum/i }).length).toBeGreaterThan(0);
    fireEvent.change(screen.getByPlaceholderText("Search grade, alloy, or family..."), {
      target: { value: "Ultem 2300" },
    });
    const ultemOptions = screen.getAllByRole("option", { name: /ULTEM 2300/ });
    expect(ultemOptions.length).toBeGreaterThan(0);
    expect(screen.getByRole("option", { name: /UNS: N\/A \| PEI GF30/ })).toBeInTheDocument();
    fireEvent.click(ultemOptions.at(-1)!);
    expect(screen.getByLabelText("Material")).toHaveDisplayValue("ULTEM 2300");
    expect(screen.getByText(/UNS: N\/A \| PEI GF30/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Material dropdown" }));
    const materialSearch = screen.getByPlaceholderText("Search grade, alloy, or family...");
    fireEvent.change(materialSearch, { target: { value: "6061" } });
    fireEvent.keyDown(materialSearch, { key: "ArrowDown" });
    fireEvent.keyDown(materialSearch, { key: "Enter" });
    expect(screen.getByLabelText("Material")).toHaveDisplayValue("6061-T651 Aluminum");
    expect(screen.getByLabelText("General Tolerances")).toHaveDisplayValue("ISO 2768 Medium (m)");
    fireEvent.click(screen.getByRole("button", { name: "ISO 2768-1 standards" }));
    expect(screen.getByRole("dialog", { name: "ISO 2768-1 tolerances" })).toBeInTheDocument();
    expect(screen.getByText("Limits for nominal size")).toBeInTheDocument();
    expect(screen.getByText("Over 400mm to 1000mm")).toBeInTheDocument();
    expect(screen.getByText("+/-0.8mm")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close ISO 2768-1 tolerances" }));
    expect(screen.queryByRole("dialog", { name: "ISO 2768-1 tolerances" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Surface Finish")).toHaveDisplayValue("As machined (Ra 3.2 um / Ra 126 uin)");
    expect(screen.getByLabelText("Quality documentation")).toHaveDisplayValue("Standard Inspection");
    fireEvent.click(screen.getByRole("button", { name: "Quality documentation dropdown" }));
    fireEvent.click(screen.getByRole("option", { name: "Material Test Report (MTR)" }));
    expect(screen.getByLabelText("Quality documentation")).toHaveDisplayValue(
      "Standard Inspection, Material Test Report (MTR)",
    );
    expect(screen.getByRole("button", { name: "Remove Material Test Report (MTR)" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Part / line item name")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("File reference")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Part Markings/)).not.toBeChecked();
    expect(screen.getByText("Linear Tolerance Tighter Than General Tolerance")).toBeInTheDocument();

    const drawing = new File(["drawing"], "bracket-drawing.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText(/Technical drawing/), {
      target: { files: [drawing] },
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Technical Drawing Specifications" })).toBeInTheDocument();
    expect(screen.getByLabelText("Preview of bracket-drawing.pdf")).toBeInTheDocument();
    expect(screen.getByLabelText("General Tolerance")).toHaveDisplayValue("ISO 2768 Medium (m)");
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByLabelText("General Tolerance"), {
      target: { value: "iso_2768_fine_f" },
    });
    expect(screen.getByLabelText("General Tolerance")).toHaveDisplayValue("ISO 2768 Fine (f)");
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("checkbox", { name: "Engineering Fits" }));
    expect(screen.getByText("For example: holes and shafts such as H7, k6")).toBeInTheDocument();
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Remove Drawing" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByLabelText("Preview of bracket-drawing.pdf")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Upload replacement technical drawing")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove Drawing" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Done" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Add a technical drawing, or uncheck Engineering Fits/)).toBeInTheDocument();

    const replacementDrawing = new File(["replacement drawing"], "replacement-drawing.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("Upload replacement technical drawing"), {
      target: { files: [replacementDrawing] },
    });

    expect(screen.getByLabelText("Preview of replacement-drawing.pdf")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Drawing" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Done" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("replacement-drawing.pdf")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Review drawing specs" })).toBeInTheDocument();
  });

  it("opens quality documentation options from the field shell without opening from selected pills", async () => {
    mockRequestFormFetch();

    render(<RequestForm />);

    fireEvent.change(screen.getByLabelText("Choose CAD file"), {
      target: { files: [new File(["solid"], "bracket.step", { type: "model/step" })] },
    });

    await screen.findByText("Line item 1: bracket");

    expect(screen.getByRole("link", { name: "Learn about quality documentation" })).toHaveAttribute(
      "href",
      "/quality-documentation",
    );
    expect(screen.queryByRole("button", { name: "Remove Standard Inspection" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Standard Inspection"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("quality-documentation-trigger"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Standard Inspection/ })).toHaveAttribute("aria-disabled", "true");
    expect(screen.queryByRole("option", { name: "Source Inspection" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Build and Hold First Article/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("option", { name: "Material Test Report (MTR)" }));
    expect(screen.getByLabelText("Quality documentation")).toHaveDisplayValue(
      "Standard Inspection, Material Test Report (MTR)",
    );

    fireEvent.click(screen.getByRole("button", { name: "Quality documentation dropdown" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove Material Test Report (MTR)" }));
    expect(screen.getByLabelText("Quality documentation")).toHaveDisplayValue("Standard Inspection");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("explains where to define a custom inspection", async () => {
    mockRequestFormFetch();

    render(<RequestForm />);

    fireEvent.change(screen.getByLabelText("Choose CAD file"), {
      target: { files: [new File(["solid"], "bracket.step", { type: "model/step" })] },
    });

    await screen.findByText("Line item 1: bracket");
    fireEvent.click(screen.getByRole("button", { name: "Quality documentation dropdown" }));
    fireEvent.click(screen.getByRole("option", { name: "Custom Inspection" }));

    expect(screen.getByText("Describe the custom inspection in the Manufacturing notes section below.")).toBeInTheDocument();
  });

  it("closes the technical drawing review when the backdrop is clicked", async () => {
    mockRequestFormFetch();

    render(<RequestForm />);

    fireEvent.change(screen.getByLabelText("Choose CAD file"), {
      target: {
        files: [new File(["solid"], "bracket.step", { type: "model/step" })],
      },
    });

    await screen.findByText("Line item 1: bracket");

    fireEvent.change(screen.getByLabelText(/Technical drawing/), {
      target: {
        files: [
          new File(["drawing"], "bracket-drawing.pdf", {
            type: "application/pdf",
          }),
        ],
      },
    });

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    fireEvent.mouseDown(dialog);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders a prefilled reorder draft from an existing order", () => {
    render(
      <RequestForm
        initialState={{
          buyerCompany: "Apex Fluidics",
          customerPo: "",
          dueDate: "2026-06-16",
          fileName: "mounting-bracket.step",
          generalTolerance: "iso_2768_medium_m",
          material: "al_6061_t6",
          notes: "Reorder from PO-DEMO_PUR / LQ-DEMO_PUR.",
          partName: "Mounting bracket",
          process: "cnc_milling",
          projectName: "Valve manifold order reorder",
          qualityDocumentation: ["standard_inspection"],
          quantity: "24",
          requesterName: "William Paik",
          surfaceFinish: "as_machined_ra_3_2",
        }}
        prefillNotice="Reorder draft prepared from PO-DEMO_PUR."
      />,
    );

    expect(screen.getByText("Reorder draft prepared from PO-DEMO_PUR.")).toBeInTheDocument();
    expect(screen.getByLabelText("Upload another CAD file")).toBeInTheDocument();
    expect(screen.queryByLabelText("Company Name")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Quote name" })).toHaveTextContent("Valve manifold order reorder");
    expect(screen.queryByRole("textbox", { name: "Quote name" })).not.toBeInTheDocument();
    fireEvent.doubleClick(screen.getByRole("button", { name: "Quote name" }));
    expect(screen.getByRole("textbox", { name: "Quote name" })).toHaveDisplayValue("Valve manifold order reorder");
    fireEvent.change(screen.getByRole("textbox", { name: "Quote name" }), {
      target: { value: "Valve manifold quote update" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "Quote name" })).toHaveTextContent("Valve manifold order reorder");
    fireEvent.doubleClick(screen.getByRole("button", { name: "Quote name" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Quote name" }), {
      target: { value: "Valve manifold quote update" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("button", { name: "Quote name" })).toHaveTextContent("Valve manifold quote update");
    expect(screen.getByText("Line item 1: mounting-bracket")).toBeInTheDocument();
    expect(screen.queryByLabelText("Part / line item name")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("File reference")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Mounting bracket" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Material")).toHaveDisplayValue("6061-T6 Aluminum");
    expect(screen.getByLabelText("Quantity")).toHaveDisplayValue("24");
    expect(screen.getByLabelText("Manufacturing notes")).toHaveDisplayValue("Reorder from PO-DEMO_PUR / LQ-DEMO_PUR.");
    expect(screen.getByText("This saved request only has the CAD filename. Upload the CAD file again to generate a live 3D preview.")).toBeInTheDocument();
    expect(screen.getByLabelText("Upload replacement CAD for mounting-bracket.step")).toBeInTheDocument();
    expect(screen.getByText(/This is only a saved filename/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Request Quote" })).toBeDisabled();
  });

  it("shows Hubs-style secondary surface finish choices only when the selected finish supports them", () => {
    render(
      <RequestForm
        initialState={{
          buyerCompany: "Amogy Manufacturing",
          dueDate: "2026-06-30",
          fileName: "bracket.step",
          generalTolerance: "iso_2768_medium_m",
          material: "al_6061_t6",
          partName: "Bracket",
          process: "cnc_milling",
          projectName: "Bracket RFQ",
          qualityDocumentation: ["standard_inspection"],
          quantity: "5",
          requesterName: "William Paik",
          surfaceFinish: "as_machined_ra_3_2",
        }}
      />,
    );

    expect(screen.queryByLabelText("Select cosmetic requirement")).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: /Select color/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Surface Finish dropdown" }));
    fireEvent.click(
      screen.getAllByRole("option", {
        name: "Bead blasted + Anodized type II (Matte)",
      }).at(-1)!,
    );

    expect(screen.getByLabelText("Select cosmetic requirement")).toHaveDisplayValue(
      "Non cosmetic - Optimizes cost",
    );
    expect(screen.getByRole("group", { name: /Select color/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Black" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Blue" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Clear" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Surface Finish dropdown" }));
    fireEvent.click(screen.getAllByRole("option", { name: "Powder coated" }).at(-1)!);

    expect(screen.queryByLabelText("Select cosmetic requirement")).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Black" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "White" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "RAL" }));
    expect(screen.getByPlaceholderText("Enter RAL code or name")).toBeInTheDocument();
  });

  it("renders every copied line item in a prefilled request draft", () => {
    render(
      <RequestForm
        initialState={{
          buyerCompany: "Amogy Manufacturing",
          dueDate: "2026-06-24",
          lineItems: [
            {
              fileName: "Aluminum Plate.STEP",
              generalTolerance: "iso_2768_medium_m",
              material: "al_6061_t6",
              notes: "Threads requested; drawing required.",
              partName: "Aluminum Plate",
              qualityDocumentation: ["standard_inspection"],
              quantity: "4",
              surfaceFinish: "as_machined_ra_3_2",
              technicalDrawingName: "Aluminum Plate Hole Call Out.pdf",
              threads: true,
            },
            {
              fileName: "Tubesheet Retainer Plate.STEP",
              generalTolerance: "iso_2768_medium_m",
              material: "al_6061_t6",
              notes: "Threads requested; drawing required.",
              partName: "Tubesheet Retainer Plate",
              qualityDocumentation: ["standard_inspection"],
              quantity: "4",
              surfaceFinish: "as_machined_ra_3_2",
              technicalDrawingName: "Tubesheet Retainer Plate Hole Callout.pdf",
              threads: true,
            },
          ],
          process: "cnc_milling",
          projectName: "Tubesheet Retainer Plate reorder",
          requesterName: "William Paik",
        }}
        prefillNotice="Reorder draft prepared from PO-MPYTWFRU."
      />,
    );

    expect(screen.getByText("Reorder draft prepared from PO-MPYTWFRU.")).toBeInTheDocument();
    expect(screen.getByText("Line item 1: Aluminum Plate")).toBeInTheDocument();
    expect(screen.getByText("Line item 2: Tubesheet Retainer Plate")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Aluminum Plate" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Tubesheet Retainer Plate" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Part / line item name")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("File reference")).not.toBeInTheDocument();
    expect(screen.getAllByText(/This is only a saved filename/)).toHaveLength(2);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Delete Line item 2: Tubesheet Retainer Plate",
      }),
    );
    expect(screen.getByRole("dialog", { name: "Remove from quote" })).toBeInTheDocument();
    expect(screen.getByText(/2\.\s+Tubesheet Retainer Plate/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog", { name: "Remove from quote" })).not.toBeInTheDocument();
    expect(screen.getByText("Line item 2: Tubesheet Retainer Plate")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Delete Line item 2: Tubesheet Retainer Plate",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.queryByText("Line item 2: Tubesheet Retainer Plate")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete Line item 1: Aluminum Plate" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Request Quote" })).toBeDisabled();
  });

  it("requires reopened reference-only RFQs to upload CAD bytes before submitting", async () => {
    const fetchMock = mockRequestFormFetch({
      request: {
        id: "req_resubmitted",
        title: "Valve manifold order reorder",
        status: "SUBMITTED",
      },
    });

    render(
      <RequestForm
        initialState={{
          buyerCompany: "Apex Fluidics",
          dueDate: "2026-06-16",
          fileName: "mounting-bracket.step",
          generalTolerance: "iso_2768_medium_m",
          material: "al_6061_t6",
          partName: "Mounting bracket",
          process: "cnc_milling",
          projectName: "Valve manifold order reorder",
          qualityDocumentation: ["standard_inspection"],
          quantity: "24",
          requesterName: "William Paik",
          surfaceFinish: "as_machined_ra_3_2",
          technicalDrawingName: "mounting-bracket-drawing.pdf",
        }}
      />,
    );

    expect(screen.getByRole("button", { name: "Request Quote" })).toBeDisabled();

    const replacement = new File(["solid"], "mounting-bracket.step", { type: "model/step" });
    fireEvent.change(screen.getByLabelText("Upload replacement CAD for mounting-bracket.step"), {
      target: { files: [replacement] },
    });

    await screen.findByText("Autodesk preview setup needed");
    expect(screen.getByText(/This is only a saved drawing filename/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Request Quote" })).toBeDisabled();

    const drawing = new File(["drawing"], "mounting-bracket-drawing.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText(/Technical drawing/), {
      target: { files: [drawing] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    expect(screen.getByRole("button", { name: "Request Quote" })).toBeEnabled();

    await waitFor(() =>
      expect(fetchMock.mock.calls.filter(([url]) => String(url).includes("/api/request-draft-files"))).toHaveLength(2),
    );

    fireEvent.click(screen.getByRole("button", { name: "Request Quote" }));

    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith("/api/requests", expect.objectContaining({ method: "POST" })));
    const submittedForm = fetchMock.mock.calls.at(-1)?.[1]?.body as FormData;
    const submitted = JSON.parse(String(submittedForm.get("request")));

    expect(submitted.files).toMatchObject([
      { name: "mounting-bracket.step", sizeBytes: replacement.size, storageKey: "rfq-drafts/test/mounting-bracket.step", type: "model/step" },
      { name: "mounting-bracket-drawing.pdf", sizeBytes: drawing.size, storageKey: "rfq-drafts/test/mounting-bracket-drawing.pdf", type: "application/pdf" },
    ]);
    expect(submittedForm.get("file-0")).toBeNull();
    expect(submittedForm.get("file-1")).toBeNull();
  });

  it("lets a prefilled request submit saved CAD and drawing files without reuploading them", async () => {
    const fetchMock = mockRequestFormFetch({
      request: {
        id: "req_reorder",
        title: "Tubesheet Retainer Plate reorder",
        status: "SUBMITTED",
      },
    });

    render(
      <RequestForm
        initialState={{
          buyerCompany: "Amogy Manufacturing",
          dueDate: "2026-06-24",
          lineItems: [
            {
              fileName: "Aluminum Plate.STEP",
              fileSizeBytes: 74752,
              fileStorageKey: "rfq/2026-06-03/aluminum-plate.step",
              fileType: "application/octet-stream",
              generalTolerance: "iso_2768_medium_m",
              material: "al_6061_t6",
              notes: "Threads requested; drawing required.",
              partName: "Aluminum Plate",
              qualityDocumentation: ["standard_inspection"],
              quantity: "4",
              surfaceFinish: "as_machined_ra_3_2",
              technicalDrawingName: "Aluminum Plate Hole Call Out.pdf",
              technicalDrawingSizeBytes: 106496,
              technicalDrawingStorageKey: "rfq/2026-06-03/aluminum-plate-hole-callout.pdf",
              technicalDrawingType: "application/pdf",
              threads: true,
            },
          ],
          process: "cnc_milling",
          projectName: "Tubesheet Retainer Plate reorder",
          requesterName: "William Paik",
        }}
      />,
    );

    expect(screen.getByText("This CAD file is saved with the RFQ. Upload a replacement only if you want to change it.")).toBeInTheDocument();
    expect(screen.queryByText(/This is only a saved filename/)).not.toBeInTheDocument();
    expect(screen.queryByText(/This is only a saved drawing filename/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Request Quote" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Request Quote" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/requests", expect.objectContaining({ method: "POST" })));
    const submittedForm = fetchMock.mock.calls.at(-1)?.[1]?.body as FormData;
    const submitted = JSON.parse(String(submittedForm.get("request")));

    expect(submitted).not.toHaveProperty("revision");
    expect(submitted.files).toMatchObject([
      {
        name: "Aluminum Plate.STEP",
        sizeBytes: 74752,
        storageKey: "rfq/2026-06-03/aluminum-plate.step",
        type: "application/octet-stream",
      },
      {
        name: "Aluminum Plate Hole Call Out.pdf",
        sizeBytes: 106496,
        storageKey: "rfq/2026-06-03/aluminum-plate-hole-callout.pdf",
        type: "application/pdf",
      },
    ]);
    expect(submitted.lineItems[0].notes).toBe("Threads requested; drawing required.");
    expect(submittedForm.get("file-0")).toBeNull();
    expect(submittedForm.get("file-1")).toBeNull();
  });

  it("restores an Autodesk CAD preview from a saved draft", () => {
    render(
      <RequestForm
        initialState={{
          dueDate: "2026-06-16",
          fileName: "mounting-bracket.step",
          partName: "Mounting bracket",
          projectName: "Valve manifold order reorder",
          cadPreview: {
            status: "ready",
            fileName: "mounting-bracket.step",
            urn: "saved-viewer-urn",
          },
        }}
      />,
    );

    expect(screen.queryByText("3D preview ready")).not.toBeInTheDocument();
    expect(screen.queryByText("mounting-bracket.step")).not.toBeInTheDocument();
    expect(screen.getByText("Loading interactive CAD preview...")).toBeInTheDocument();
    expect(screen.queryByText("CAD file reference only")).not.toBeInTheDocument();
  });

  it("starts a CAD preview translation when a file is selected", async () => {
    const fetchMock = mockRequestFormFetch({
      preview: {
        status: "processing",
        urn: "translated-model-urn",
      },
    });

    render(<RequestForm />);

    const file = new File(["solid"], "bracket.step", { type: "model/step" });
    fireEvent.change(screen.getByLabelText("Choose CAD file"), {
      target: { files: [file] },
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/cad-previews", expect.objectContaining({ method: "POST" })));
    expect(screen.getByText(/Starting 3D preview|3D preview processing/)).toBeInTheDocument();
    expect(screen.getByText("Line item 1: bracket")).toBeInTheDocument();
    expect(screen.getByText("bracket.step")).toBeInTheDocument();
    expect(screen.getByText(/You can keep building and submit the RFQ while this finishes/)).toBeInTheDocument();
    expect(screen.getByText(/Progress: queued/)).toBeInTheDocument();
  });

  it("restores local draft CAD and drawing storage without requiring reupload", async () => {
    const fetchMock = mockRequestFormFetch({
      request: {
        id: "req_from_local_draft",
        title: "Bracket",
        status: "SUBMITTED",
      },
    });
    const { unmount } = render(<RequestForm />);

    const cadFile = new File(["solid"], "bracket.step", { type: "model/step" });
    fireEvent.change(screen.getByLabelText("Choose CAD file"), {
      target: { files: [cadFile] },
    });

    await screen.findByText("Line item 1: bracket");

    const drawing = new File(["drawing"], "bracket-drawing.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText(/Technical drawing/), {
      target: { files: [drawing] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    const storedDraft = await waitFor(() => {
      const drafts = JSON.parse(window.localStorage.getItem("lattice.incompleteRfqs.v1") ?? "[]");
      const draft = drafts[0];

      expect(draft.initialState.lineItems[0].fileStorageKey).toBe("rfq-drafts/test/bracket.step");
      expect(draft.initialState.lineItems[0].technicalDrawingStorageKey).toBe("rfq-drafts/test/bracket-drawing.pdf");

      return draft;
    });

    unmount();
    render(<RequestForm localDraftId={storedDraft.id} />);

    expect(screen.getByText("Line item 1: bracket")).toBeInTheDocument();
    expect(screen.queryByText(/This is only a saved filename/)).not.toBeInTheDocument();
    expect(screen.queryByText(/This is only a saved drawing filename/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Request Quote" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Request Quote" }));

    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith("/api/requests", expect.objectContaining({ method: "POST" })));
    const submittedForm = fetchMock.mock.calls.at(-1)?.[1]?.body as FormData;
    const submitted = JSON.parse(String(submittedForm.get("request")));

    expect(submitted.files).toMatchObject([
      { name: "bracket.step", storageKey: "rfq-drafts/test/bracket.step" },
      { name: "bracket-drawing.pdf", storageKey: "rfq-drafts/test/bracket-drawing.pdf" },
    ]);
    expect(submittedForm.get("file-0")).toBeNull();
    expect(submittedForm.get("file-1")).toBeNull();
  });

  it("shows the CAD preview configuration state when Autodesk credentials are missing", async () => {
    mockRequestFormFetch({
      preview: {
        status: "configuration_required",
        message: "Add APS_CLIENT_ID, APS_CLIENT_SECRET, and APS_BUCKET_KEY to enable live CAD translation previews.",
      },
    });

    render(<RequestForm />);

    const file = new File(["solid"], "fixture.sldprt", { type: "application/octet-stream" });
    fireEvent.drop(screen.getByText("Drag & drop CAD files here, or browse").closest("section")!, {
      dataTransfer: { files: [file] },
    });

    await screen.findByText("Autodesk preview setup needed");
    expect(screen.getByText("Line item 1: fixture")).toBeInTheDocument();
    expect(screen.getByText("fixture.sldprt")).toBeInTheDocument();
    expect(screen.getByText(/Add APS_CLIENT_ID/)).toBeInTheDocument();
  });

  it("requires a technical drawing when drawing-required options are checked", async () => {
    mockRequestFormFetch();

    render(<RequestForm />);

    fireEvent.change(screen.getByLabelText("Choose CAD file"), {
      target: { files: [new File(["solid"], "bracket.step", { type: "model/step" })] },
    });

    await screen.findByText("Line item 1: bracket");
    expect(screen.getByRole("button", { name: "Request Quote" })).toBeEnabled();

    fireEvent.click(screen.getByLabelText(/Threads/));

    expect(screen.getByText(/Bracket has specifications marked as drawing required/)).toBeInTheDocument();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Technical Drawing Specifications" })).toBeInTheDocument();
    expect(within(dialog).getAllByText("(drawing required)")).toHaveLength(3);
    expect(screen.getByLabelText("Upload replacement technical drawing")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Done" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Request Quote" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Add a technical drawing, or uncheck Threads/)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Threads"));
    expect(screen.queryByText(/Bracket has specifications marked as drawing required/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Request Quote" })).toBeEnabled();

    fireEvent.click(screen.getByLabelText("Threads"));
    expect(screen.getByText(/Bracket has specifications marked as drawing required/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Upload replacement technical drawing"), {
      target: { files: [new File(["drawing"], "bracket-drawing.pdf", { type: "application/pdf" })] },
    });
    expect(screen.getByRole("button", { name: "Done" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    expect(screen.queryByText(/Bracket has specifications marked as drawing required/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Request Quote" })).toBeEnabled();
  });

  it("requires a technical drawing for dimensional quality documentation", async () => {
    mockRequestFormFetch();

    render(<RequestForm />);

    fireEvent.change(screen.getByLabelText("Choose CAD file"), {
      target: { files: [new File(["solid"], "bracket.step", { type: "model/step" })] },
    });

    await screen.findByText("Line item 1: bracket");

    fireEvent.click(screen.getByRole("button", { name: "Quality documentation dropdown" }));
    expect(screen.getByRole("option", { name: /Dimensional Inspection Report/ })).toHaveTextContent("(drawing required)");
    fireEvent.click(screen.getByRole("option", { name: /Dimensional Inspection Report/ }));

    expect(screen.getByText(/Bracket has specifications marked as drawing required/)).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Request Quote" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.getByText(/Add a technical drawing, or uncheck Dimensional Inspection Report/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Upload replacement technical drawing"), {
      target: { files: [new File(["drawing"], "bracket-drawing.pdf", { type: "application/pdf" })] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText(/Bracket has specifications marked as drawing required/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Request Quote" })).toBeEnabled();
  });

  it("creates one configurable line item for each CAD file selected together", async () => {
    mockRequestFormFetch();

    render(<RequestForm />);

    fireEvent.change(screen.getByLabelText("Choose CAD file"), {
      target: {
        files: [
          new File(["solid"], "bracket.step", { type: "model/step" }),
          new File(["solid"], "housing.sldprt", { type: "application/octet-stream" }),
        ],
      },
    });

    await screen.findByText("Line item 1: bracket");
    expect(screen.getByText("Line item 2: housing")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Quote name" })).toHaveTextContent("Bracket, Housing");
    expect(screen.getAllByLabelText("Material")).toHaveLength(2);
    expect(screen.getAllByLabelText("Quantity")).toHaveLength(2);

    await waitFor(() => {
      const drafts = JSON.parse(window.localStorage.getItem("lattice.incompleteRfqs.v1") ?? "[]");

      expect(drafts[0].initialState.lineItems).toMatchObject([
        { fileName: "bracket.step", fileStorageKey: "rfq-drafts/test/bracket.step" },
        { fileName: "housing.sldprt", fileStorageKey: "rfq-drafts/test/housing.sldprt" },
      ]);
    });
  });

  it("deletes the only configured line item from the line item header", async () => {
    mockRequestFormFetch();

    render(<RequestForm />);

    fireEvent.change(screen.getByLabelText("Choose CAD file"), {
      target: { files: [new File(["solid"], "bracket.step", { type: "model/step" })] },
    });

    await screen.findByText("Line item 1: bracket");

    fireEvent.click(screen.getByRole("button", { name: "Delete Line item 1: bracket" }));
    expect(screen.getByRole("dialog", { name: "Remove from quote" })).toBeInTheDocument();
    expect(screen.getByText(/1\.\s+bracket/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    expect(screen.queryByText("Line item 1: bracket")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Choose CAD file")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Delete Line item/i })).not.toBeInTheDocument();
  });

  it("adds a second configurable line item from the upload another CAD file drop zone", async () => {
    const fetchMock = mockRequestFormFetch({
      preview: {
        status: "processing",
        urn: "translated-model-urn",
      },
      request: {
        id: "req_multi",
        title: "Bracket",
        status: "SUBMITTED",
      },
    });

    render(<RequestForm />);

    fireEvent.change(screen.getByLabelText("Choose CAD file"), {
      target: { files: [new File(["solid"], "bracket.step", { type: "model/step" })] },
    });

    await screen.findByText("Line item 1: bracket");

    fireEvent.change(screen.getByLabelText("Upload another CAD file"), {
      target: { files: [new File(["solid"], "housing.step", { type: "model/step" })] },
    });

    await screen.findByText("Line item 2: housing");
    expect(screen.getByText("Line item 2: housing")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Material")).toHaveLength(2);
    expect(screen.getAllByLabelText("Quantity")).toHaveLength(2);

    fireEvent.change(screen.getAllByLabelText("Quantity")[1], {
      target: { value: "3" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Quality documentation dropdown" })[0]);
    fireEvent.click(screen.getByRole("option", { name: "Material Test Report (MTR)" }));
    expect(screen.getAllByLabelText("Quality documentation")[0]).toHaveDisplayValue(
      "Standard Inspection, Material Test Report (MTR)",
    );
    expect(screen.getByRole("button", { name: "Remove Material Test Report (MTR)" })).toBeInTheDocument();

    await waitFor(() =>
      expect(fetchMock.mock.calls.filter(([url]) => String(url).includes("/api/request-draft-files"))).toHaveLength(2),
    );

    fireEvent.click(screen.getByRole("button", { name: "Request Quote" }));

    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith("/api/requests", expect.objectContaining({ method: "POST" })));
    const submittedForm = fetchMock.mock.calls.at(-1)?.[1]?.body as FormData;
    const submitted = JSON.parse(String(submittedForm.get("request")));

    expect(submitted.lineItems).toMatchObject([
      {
        partName: "Bracket",
        quantity: 1,
        material: "SS 304",
        qualityDocumentation: ["Standard Inspection", "Material Test Report (MTR)"],
      },
      { partName: "Housing", quantity: 3, material: "SS 304" },
    ]);
    expect(submitted.files).toMatchObject([
      { name: "bracket.step", storageKey: "rfq-drafts/test/bracket.step", cadPreviewUrn: "translated-model-urn" },
      { name: "housing.step", storageKey: "rfq-drafts/test/housing.step", cadPreviewUrn: "translated-model-urn" },
    ]);
    expect(submittedForm.get("file-0")).toBeNull();
    expect(submittedForm.get("file-1")).toBeNull();
    expect(routerPushMock).toHaveBeenCalledWith("/quotes/req_multi");
  });
});
