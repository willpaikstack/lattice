import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RequestForm } from "./request-form";

describe("RequestForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("emulates Bubble's upload-first RFQ intake without debug placeholder text", () => {
    render(<RequestForm />);

    expect(screen.getByText("Drag & drop CAD files here, or browse")).toBeInTheDocument();
    expect(screen.getByText(/STEP, STP, IGES, IGS, SLDPRT, SAT, X_T, X_B, IPT/)).toBeInTheDocument();
    expect(screen.getByLabelText("Customer PO#")).toBeInTheDocument();
    expect(screen.getByLabelText("Company Name")).toBeInTheDocument();
    expect(screen.queryByText("Quote ID:")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Material")).not.toBeInTheDocument();
    expect(screen.queryByText("Quality documentation")).not.toBeInTheDocument();
    expect(screen.queryByText("HEADER")).not.toBeInTheDocument();
    expect(screen.queryByText("yes(No quote line items)")).not.toBeInTheDocument();
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

    await screen.findByText("Quote ID:");
    expect(screen.getByAltText("Mockup preview of the uploaded machined part")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Inspections & Certificates" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Technical drawing/)).toBeInTheDocument();
    expect(screen.getByLabelText("Customer PO#")).toBeInTheDocument();
    expect(screen.getByLabelText("Company Name")).toBeInTheDocument();
    expect(screen.getByLabelText(/Project Name/)).toBeInTheDocument();
    expect(screen.getByLabelText("Material")).toHaveDisplayValue("SS 304");
    expect(screen.getByLabelText("General tolerance")).toHaveDisplayValue("ISO 2768 Medium (m)");
    expect(screen.getByLabelText("Surface finish")).toHaveDisplayValue("As machined (Ra 3.2 um / Ra 126 uin)");
    expect(screen.getByLabelText("Quality documentation")).toHaveDisplayValue("Standard Inspection");
    expect(screen.getByLabelText(/File reference/)).toHaveDisplayValue("bracket.step");
    expect(screen.getByLabelText(/Part Markings/)).not.toBeChecked();
    expect(screen.getByText("Linear Tolerance Tighter Than General Tolerance")).toBeInTheDocument();

    const drawing = new File(["drawing"], "bracket-drawing.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText(/Technical drawing/), {
      target: { files: [drawing] },
    });
    expect(screen.getByText("bracket-drawing.pdf")).toBeInTheDocument();
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
});
