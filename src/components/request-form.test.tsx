import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RequestForm } from "./request-form";

describe("RequestForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:technical-drawing-preview"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("emulates Bubble's upload-first RFQ intake without debug placeholder text", () => {
    render(<RequestForm />);

    expect(screen.getByText("Drag & drop CAD files here, or browse")).toBeInTheDocument();
    expect(screen.getByText(/STEP, STP, IGES, IGS, SLDPRT, SAT, X_T, X_B, IPT/)).toBeInTheDocument();
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
    expect(screen.getByLabelText("Quote name")).toBeInTheDocument();
  });

  it("reveals quote configuration fields after a CAD file is selected", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          preview: {
            status: "configuration_required",
            message: "Add APS credentials to enable live previews.",
          },
        }),
        { status: 501 },
      ),
    );

    render(<RequestForm />);

    const file = new File(["solid"], "bracket.step", { type: "model/step" });
    fireEvent.change(screen.getByLabelText("Choose CAD file"), {
      target: { files: [file] },
    });

    await screen.findByText("Line item 1");
    expect(screen.getByRole("heading", { name: "Bracket" })).toBeInTheDocument();
    expect(screen.getByText("CAD file preview")).toBeInTheDocument();
    expect(screen.getByText("Autodesk preview setup needed")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Inspections & Certificates" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Technical drawing/)).toBeInTheDocument();
    expect(screen.getByLabelText("Customer PO#")).toBeInTheDocument();
    expect(screen.getByLabelText("Company Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Quote name")).toBeInTheDocument();
    expect(screen.getByLabelText("Material")).toHaveDisplayValue("SS 304");
    fireEvent.click(screen.getByRole("button", { name: "Material dropdown" }));
    fireEvent.change(screen.getByPlaceholderText("Search options..."), {
      target: { value: "Ultem 2300" },
    });
    const ultemOptions = screen.getAllByRole("option", { name: /ULTEM 2300/ });
    expect(ultemOptions.length).toBeGreaterThan(0);
    fireEvent.click(ultemOptions.at(-1)!);
    expect(screen.getByLabelText("Material")).toHaveDisplayValue("ULTEM 2300");
    expect(screen.getByLabelText("General Tolerances")).toHaveDisplayValue("ISO 2768 Medium (m)");
    expect(screen.getByLabelText("Surface Finish")).toHaveDisplayValue("As machined (Ra 3.2 um / Ra 126 uin)");
    expect(screen.getByLabelText("Quality documentation")).toHaveDisplayValue("Standard Inspection");
    expect(screen.getByLabelText(/File reference/)).toHaveDisplayValue("bracket.step");
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
    fireEvent.click(screen.getByRole("checkbox", { name: "Engineering Fits" }));
    expect(screen.getByText("For example: holes and shafts such as H7, k6")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("bracket-drawing.pdf")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Review drawing specs" })).toBeInTheDocument();
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
    expect(screen.getByLabelText("Company Name")).toHaveDisplayValue("Apex Fluidics");
    expect(screen.getByLabelText("Quote name")).toHaveDisplayValue("Valve manifold order reorder");
    expect(screen.getByLabelText("Part / line item name")).toHaveDisplayValue("Mounting bracket");
    expect(screen.getByLabelText("File reference")).toHaveDisplayValue("mounting-bracket.step");
    expect(screen.getByLabelText("Material")).toHaveDisplayValue("6061-T6 Aluminum");
    expect(screen.getByLabelText("Quantity")).toHaveDisplayValue("24");
    expect(screen.getByLabelText("Manufacturing notes")).toHaveDisplayValue("Reorder from PO-DEMO_PUR / LQ-DEMO_PUR.");
    expect(screen.getByText("This saved request only has the CAD filename. Upload the CAD file again to generate a live 3D preview.")).toBeInTheDocument();
    expect(screen.getByLabelText("Upload replacement CAD for mounting-bracket.step")).toBeInTheDocument();
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

    expect(screen.getByText("3D preview ready")).toBeInTheDocument();
    expect(screen.getByText("Loading interactive CAD preview...")).toBeInTheDocument();
    expect(screen.queryByText("CAD file reference only")).not.toBeInTheDocument();
  });

  it("starts a CAD preview translation when a file is selected", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          preview: {
            status: "processing",
            urn: "translated-model-urn",
          },
        }),
        { status: 202 },
      ),
    );

    render(<RequestForm />);

    const file = new File(["solid"], "bracket.step", { type: "model/step" });
    fireEvent.change(screen.getByLabelText("Choose CAD file"), {
      target: { files: [file] },
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/cad-previews", expect.objectContaining({ method: "POST" })));
    expect(screen.getByText("Preparing 3D preview")).toBeInTheDocument();
    expect(screen.getAllByText("bracket.step").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Progress: queued/)).toBeInTheDocument();
  });

  it("shows the CAD preview configuration state when Autodesk credentials are missing", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          preview: {
            status: "configuration_required",
            message: "Add APS_CLIENT_ID, APS_CLIENT_SECRET, and APS_BUCKET_KEY to enable live CAD translation previews.",
          },
        }),
        { status: 501 },
      ),
    );

    render(<RequestForm />);

    const file = new File(["solid"], "fixture.sldprt", { type: "application/octet-stream" });
    fireEvent.drop(screen.getByText("Drag & drop CAD files here, or browse").closest("section")!, {
      dataTransfer: { files: [file] },
    });

    await screen.findByText("Autodesk preview setup needed");
    expect(screen.getAllByText("fixture.sldprt").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Add APS_CLIENT_ID/)).toBeInTheDocument();
  });

  it("adds a second configurable line item from the upload another CAD file drop zone", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            preview: {
              status: "configuration_required",
              message: "Add APS credentials to enable live previews.",
            },
          }),
          { status: 501 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            preview: {
              status: "configuration_required",
              message: "Add APS credentials to enable live previews.",
            },
          }),
          { status: 501 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            request: {
              id: "req_multi",
              title: "Bracket",
              status: "SUBMITTED",
            },
          }),
          { status: 201 },
        ),
      );

    render(<RequestForm />);

    fireEvent.change(screen.getByLabelText("Choose CAD file"), {
      target: { files: [new File(["solid"], "bracket.step", { type: "model/step" })] },
    });

    await screen.findByText("Line item 1");

    fireEvent.change(screen.getByLabelText("Upload another CAD file"), {
      target: { files: [new File(["solid"], "housing.step", { type: "model/step" })] },
    });

    await screen.findByText("Line item 2");
    expect(screen.getByRole("heading", { name: "Housing" })).toBeInTheDocument();
    expect(screen.getAllByLabelText("Material")).toHaveLength(2);
    expect(screen.getAllByLabelText("Quantity")).toHaveLength(2);

    fireEvent.change(screen.getAllByLabelText("Quantity")[1], {
      target: { value: "3" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Request Quote" }));

    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith("/api/requests", expect.objectContaining({ method: "POST" })));
    const submittedForm = fetchMock.mock.calls.at(-1)?.[1]?.body as FormData;
    const submitted = JSON.parse(String(submittedForm.get("request")));

    expect(submitted.lineItems).toMatchObject([
      { partName: "Bracket", quantity: 1, material: "SS 304" },
      { partName: "Housing", quantity: 3, material: "SS 304" },
    ]);
    expect(submitted.files).toMatchObject([{ name: "bracket.step" }, { name: "housing.step" }]);
    expect(submittedForm.get("file-0")).toBeInstanceOf(File);
    expect(submittedForm.get("file-1")).toBeInstanceOf(File);
  });
});
