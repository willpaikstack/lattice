import type { ReactElement } from "react";
import { act, cleanup, fireEvent, render as testingRender, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RequestForm } from "./request-form";
import { restrictionPolicyVersion } from "@/lib/rfq-manufacturing";
import {
  buildDraftRequest,
  type LatticeRequest,
} from "@/lib/request-model";

const routerReplaceMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: routerReplaceMock,
  }),
}));

vi.mock("./autodesk-model-viewer", () => ({
  AutodeskModelViewer: () => <div>Loading interactive CAD preview...</div>,
  preloadAutodeskViewerAssets: async () => {},
}));

vi.mock("./local-cad-preview", () => ({ LocalCadPreview: ({ name }: { name: string }) => <p>Local CAD preview: {name}</p> }));

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
      if (typeof init?.body === "string") {
        return new Response(JSON.stringify({ upload: { mode: "local" } }));
      }
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

    if (url.includes("/api/cad-previews/status")) {
      return new Response(JSON.stringify({ preview: { ...preview, progress: "60% complete" } }));
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

// Existing flow cases explicitly confirm eligibility and intended use.
function render(ui: ReactElement) {
  const view = testingRender(ui);
  const restrictions = screen.queryByLabelText("Export restrictions");
  if (restrictions) fireEvent.change(restrictions, { target: { value: "unrestricted" } });
  const intendedUse = screen.queryByLabelText("Intended use");
  if (intendedUse) fireEvent.change(intendedUse, { target: { value: "commercial" } });
  confirmSelectedCad();
  const commercial = screen.queryByRole("radio", { name: /Commercial — production/ });
  if (commercial) fireEvent.click(commercial);
  return view;
}

function confirmSelectedCad() {
  const eligible = screen.queryByRole("radio", { name: /No, this quote/ });
  if (eligible) {
    fireEvent.click(eligible);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  }
  const commercial = screen.queryByRole("radio", { name: /^Commercial/ });
  if (commercial) {
    fireEvent.click(commercial);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  }
}

describe("RequestForm", () => {
  beforeEach(() => {
    const storage = new Map<string, string>();

    routerReplaceMock.mockClear();
    HTMLElement.prototype.scrollIntoView = vi.fn();
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
    window.localStorage?.removeItem?.("lattice.incompleteRfqs.v2.company_test");
    vi.unstubAllGlobals();
  });

  it("ignores Enter and implicit form submission, but submits a delivery preference on button click", async () => {
    const fetchMock = mockRequestFormFetch();
    render(<RequestForm initialState={{ projectName: "Delivery preference", lineItems: [{
      fileName: "bracket.step", fileSizeBytes: 10, fileStorageKey: "rfq/test/bracket.step", material: "ss_304", quantity: "1", targetShipDate: "2026-11-12",
    }] }} />);
    const submit = screen.getByRole("button", { name: "Request Quote" });
    expect(submit).toBeEnabled();
    expect(submit).toHaveAttribute("type", "button");
    expect(screen.getByText("Target delivery date (optional)")).toBeInTheDocument();
    const material = screen.getByRole("button", { name: "Material dropdown" });
    fireEvent.keyDown(material, { key: "Enter" });
    fireEvent.keyDown(material, { key: "Enter" });
    expect(fireEvent.keyDown(submit, { key: "Enter", cancelable: true })).toBe(false);
    fireEvent.submit(submit.closest("form")!);
    expect(fetchMock.mock.calls.filter(([url]) => url === "/api/requests")).toHaveLength(0);
    fireEvent.click(submit);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/requests", expect.anything()));
    const form = fetchMock.mock.calls.find(([url]) => url === "/api/requests")![1]?.body as FormData;
    const details = JSON.parse(String(form.get("request"))).lineItems[0].manufacturingDetails;
    expect(details.targetDeliveryDate).toBe("2026-11-12");
    expect(details).not.toHaveProperty("targetShipDate");
  });

  it("reassures users that a different-use part leaves the current draft saved and separate", async () => {
    mockRequestFormFetch();
    render(<RequestForm localDraftId="local_draft_preserve_progress" initialState={{ projectName: "Keep my progress", lineItems: [{
      fileName: "existing.step", fileSizeBytes: 10, fileStorageKey: "rfq/test/existing.step", material: "ss_304", quantity: "7", notes: "Keep this note",
    }] }} />);
    fireEvent.change(screen.getByLabelText("Upload another CAD file"), { target: { files: [new File(["solid"], "prototype.step")] } });
    fireEvent.click(screen.getByRole("radio", { name: /No, this quote/ }));
    fireEvent.click(screen.getByRole("radio", { name: /^Prototype/ }));
    expect(screen.getByRole("alert")).toHaveTextContent("Your current quote progress is saved as a draft");
    expect(screen.getByRole("link", { name: /Request a new quote/ })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    const saved = window.localStorage.getItem("lattice.incompleteRfqs.v2.company_test");
    expect(saved).toContain("Keep my progress");
    expect(saved).toContain("Keep this note");
    expect(saved).toContain('"quantity":"7"');
  });

  it("starts advance CAD processing and advances from export restrictions directly to intended use", async () => {
    testingRender(<RequestForm />);
    expect(screen.getByLabelText("Choose CAD file")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Choose CAD file"), { target: { files: [new File(["solid"], "part.step")] } });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /No, this quote/ })).not.toBeChecked();
    expect(screen.queryByRole("button", { name: "Continue" })).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/request-draft-files", expect.objectContaining({ body: expect.stringContaining("advance_cad_preview") }));
    fireEvent.click(screen.getByRole("radio", { name: /Yes, parts in this quote/ }));
    expect(screen.getByRole("status")).toHaveTextContent("cannot accept");
    expect(screen.queryByRole("radio", { name: /I'm unsure/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continue" })).not.toBeInTheDocument();
    await act(async () => fireEvent.click(screen.getByRole("radio", { name: /No, this quote/ })));
    expect(screen.getByText("How will the parts in this quote be used?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    await act(async () => fireEvent.click(screen.getByRole("radio", { name: /^Prototype/ })));
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("submits each part's process and revisions with customer intended use", async () => {
    const fetchMock = mockRequestFormFetch();
    render(<RequestForm initialState={{ projectName: "Two parts", lineItems: [
      { fileName: "a.step", fileSizeBytes: 10, fileStorageKey: "rfq/test/a.step", material: "ss_304",  quantity: "1" },
      { fileName: "b.step", fileSizeBytes: 10, fileStorageKey: "rfq/test/b.step", material: "ss_304", quantity: "1", customerPartNumber: "SHAFT-2", cadRevision: "B", drawingRevision: "C" },
    ] }} />);
    expect(screen.getAllByLabelText("Manufacturing process")[0]).toHaveDisplayValue("CNC Milling");
    fireEvent.change(screen.getAllByLabelText("Manufacturing process")[1], { target: { value: "cnc_turning" } });

    fireEvent.change(screen.getByLabelText("Intended use"), { target: { value: "prototype" } });
    fireEvent.click(screen.getByRole("button", { name: "Request Quote" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/requests", expect.anything()));
    const form = fetchMock.mock.calls.find(([url]) => url === "/api/requests")![1]?.body as FormData;
    const payload = JSON.parse(String(form.get("request")));
    expect(payload.process).toBe("CNC Milling / CNC Turning");
    expect(payload.intakeDeclaration).toMatchObject({ restrictionStatus: "unrestricted", endUse: "prototype" });
    expect(payload.lineItems[1].manufacturingDetails).toMatchObject({ process: "cnc_turning", customerPartNumber: "SHAFT-2", cadRevision: "B", drawingRevision: "C" });
  });

  it("discards previous CAD files when restoring and replacing a part", async () => {
    const fetchMock = mockRequestFormFetch();
    const deleted = { kind: "cad" as const, name: "deleted.step", sizeBytes: 10, type: "model/step", storageKey: "rfq/test/deleted.step", revision: "A", replacedAt: "2026-10-12T10:00:00Z" };
    render(<RequestForm initialState={{ restrictionStatus: "unrestricted", restrictionPolicyVersion, endUse: "commercial", projectName: "Bracket", lineItems: [{ fileName: "old.step", fileSizeBytes: 10, fileStorageKey: "rfq/test/old.step", material: "ss_304",  quantity: "1", fileHistory: Array.from({ length: 50 }, () => deleted) }] }} />);
    expect(screen.queryByText(/Previous files/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Replace Part"), { target: { files: [new File(["solid"], "new.step", { type: "model/step" })] } });
    confirmSelectedCad();
    await screen.findByText("Local CAD preview: new.step");
    expect(screen.queryByText(/Previous files/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "old.step" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "deleted.step" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Request Quote" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/requests", expect.anything()));
    const form = fetchMock.mock.calls.find(([url]) => url === "/api/requests")![1]?.body as FormData;
    const payload = JSON.parse(String(form.get("request")));
    expect(payload.files.map((file: { name: string }) => file.name)).toEqual(["new.step"]);
    expect(payload.lineItems[0].manufacturingDetails.fileHistory).toEqual([]);
  });

  it("discards a removed drawing instead of adding it to quote history", async () => {
    const fetchMock = mockRequestFormFetch();
    render(<RequestForm initialState={{ restrictionStatus: "unrestricted", restrictionPolicyVersion, endUse: "commercial", projectName: "Bracket", lineItems: [{ fileName: "part.step", fileSizeBytes: 10, fileStorageKey: "rfq/test/part.step", material: "ss_304",  quantity: "1", technicalDrawingName: "removed.pdf", technicalDrawingStorageKey: "rfq/test/removed.pdf", technicalDrawingType: "application/pdf", technicalDrawingSizeBytes: 10 }] }} />);
    fireEvent.click(screen.getByTitle("Remove drawing"));
    expect(screen.queryByText(/Previous files/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Request Quote" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/requests", expect.anything()));
    const form = fetchMock.mock.calls.find(([url]) => url === "/api/requests")![1]?.body as FormData;
    const payload = JSON.parse(String(form.get("request")));
    expect(payload.files.map((file: { name: string }) => file.name)).toEqual(["part.step"]);
    expect(payload.lineItems[0].manufacturingDetails.fileHistory).toEqual([]);
  });

  it("blocks repeated submission and reuses the identifier after a failed response", async () => {
    const fetchMock = mockRequestFormFetch();
    const originalFetch = fetchMock.getMockImplementation()!;
    let rejectSubmission!: (error: Error) => void;
    fetchMock.mockImplementation((input, init) => String(input) === "/api/requests"
      ? new Promise<Response>((_resolve, reject) => { rejectSubmission = reject; })
      : originalFetch(input, init));
    render(<RequestForm initialState={{ projectName: "Bracket", lineItems: [{
      fileName: "bracket.step", fileSizeBytes: 10, fileStorageKey: "rfq/test/bracket.step",
      material: "ss_304",  quantity: "1",
    }] }} />);
    const submit = screen.getByRole("button", { name: "Request Quote" });
    fireEvent.click(submit);
    expect(screen.getByRole("button", { name: "Submitting…" })).toBeDisabled();
    fireEvent.submit(submit.closest("form")!);
    await waitFor(() => expect(fetchMock.mock.calls.filter(([url]) => url === "/api/requests")).toHaveLength(1));
    let calls = fetchMock.mock.calls.filter(([url]) => url === "/api/requests");
    expect(calls).toHaveLength(1);
    const identifier = calls[0][1]?.headers;
    rejectSubmission(new Error("Response lost"));
    await screen.findByText("Response lost");
    fireEvent.click(screen.getByRole("button", { name: "Request Quote" }));
    await waitFor(() => expect(fetchMock.mock.calls.filter(([url]) => url === "/api/requests")).toHaveLength(2));
    calls = fetchMock.mock.calls.filter(([url]) => url === "/api/requests");
    expect(calls).toHaveLength(2);
    expect(calls[1][1]?.headers).toEqual(identifier);
  });

  it("waits for a pending direct upload and submits references without uploading CAD again", async () => {
    const fetchMock = mockRequestFormFetch();
    const baseFetch = fetchMock.getMockImplementation()!;
    const storageKey = "rfq-drafts/test/large.step";
    let finishUpload!: (response: Response) => void;
    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      if (url === "https://storage.example/direct") return new Promise<Response>(resolve => { finishUpload = resolve; });
      if (url === "/api/request-draft-files" && typeof init?.body === "string") {
        const metadata = JSON.parse(init.body);
        if (metadata.action === "prepare") return new Response(JSON.stringify({ upload: { mode: "direct", storageKey, uploadUrl: "https://storage.example/direct", headers: { "Content-Type": "model/step" } } }));
        return new Response(JSON.stringify({ file: { name: "large.step", sizeBytes: 8 * 1024 * 1024, storageKey, type: "model/step" } }), { status: 201 });
      }
      return baseFetch(input, init);
    });
    render(<RequestForm />);
    const file = new File([new Uint8Array(8 * 1024 * 1024)], "large.step", { type: "model/step" });
    fireEvent.change(screen.getByLabelText("Choose CAD file"), { target: { files: [file] } });
    confirmSelectedCad();
    fireEvent.change(screen.getByLabelText("Material"), { target: { value: "ss_304_full" } });
    await waitFor(() => expect(finishUpload).toBeDefined());
    fireEvent.click(screen.getByRole("button", { name: "Request Quote" }));
    expect(screen.getByRole("button", { name: "Submitting…" })).toBeDisabled();
    expect(fetchMock.mock.calls.filter(([url]) => url === "/api/requests")).toHaveLength(0);
    await act(async () => finishUpload(new Response(null, { status: 200 })));
    await waitFor(() => expect(routerReplaceMock).toHaveBeenCalledWith("/quotes/req_submitted"));
    const submittedForm = fetchMock.mock.calls.find(([url]) => url === "/api/requests")![1]?.body as FormData;
    expect(submittedForm.get("file-0")).toBeNull();
    expect(JSON.parse(String(submittedForm.get("request"))).files[0].storageKey).toBe(storageKey);
    expect(fetchMock.mock.calls.some(([url]) => url === "/api/cad-previews")).toBe(false);
    expect(fetchMock.mock.calls.filter(([, init]) => init?.body === file)).toHaveLength(1);
  });

  it("links a missing material to its control and expands the part", async () => {
    mockRequestFormFetch();
    render(<RequestForm initialState={{ projectName: "Bracket", lineItems: [{
      fileName: "bracket.step", fileSizeBytes: 10, fileStorageKey: "rfq/test/bracket.step",
       quantity: "1",
    }] }} />);
    expect(screen.getByLabelText("Material")).toHaveValue("");
    fireEvent.click(screen.getByRole("button", { name: "Collapse Line item 1: bracket" }));
    fireEvent.click(within(screen.getByRole("region", { name: "Configuration checklist" })).getByRole("button", { name: "Select a material" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Material dropdown" })).toHaveFocus());
    expect(screen.getByRole("button", { name: "Collapse Line item 1: bracket" })).toHaveAttribute("aria-expanded", "true");
  });

  it("contains ISO dialog focus and returns it to the opening button", () => {
    mockRequestFormFetch();
    render(<RequestForm initialState={{ projectName: "Bracket", lineItems: [{
      fileName: "bracket.step", fileSizeBytes: 10, fileStorageKey: "rfq/test/bracket.step",
       quantity: "1",
    }] }} />);
    const trigger = screen.getByRole("button", { name: "ISO 2768-1 standards" });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    const close = screen.getByRole("button", { name: "Close ISO 2768-1 tolerances" });
    close.focus();
    fireEvent.keyDown(close, { key: "Tab" });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(trigger).toHaveFocus();
  });

  it("emulates Bubble's upload-first RFQ intake without debug placeholder text", () => {
    render(<RequestForm />);

    expect(screen.getByRole("heading", { name: "Request a quote" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Request quote progress" })).toBeInTheDocument();
    expect(screen.getByText("Drafts autosave as you work")).toBeInTheDocument();
    expect(screen.getByText("Drag & drop CAD files here, or browse")).toBeInTheDocument();
    expect(screen.getByText(/STEP, STP, IGES, IGS, STL, OBJ, GLTF, GLB, SLDPRT, SAT, X_T, X_B, IPT/)).toBeInTheDocument();
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
      "lattice.incompleteRfqs.v2.company_test",
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
    expect(screen.getByText("0% complete")).toBeInTheDocument();
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
      "lattice.incompleteRfqs.v2.company_test",
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
    confirmSelectedCad();

    await screen.findByText("Line item 1: bracket");
    expect(screen.queryByRole("heading", { name: "Bracket" })).not.toBeInTheDocument();
    expect(screen.getByText("CAD file preview")).toBeInTheDocument();
    expect(screen.getByText("Local CAD preview: bracket.step")).toBeInTheDocument();
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
    expect(screen.getByLabelText("Material")).toHaveDisplayValue("Select a material");
    expect(screen.getByRole("button", { name: "Request Quote" })).toBeDisabled();
    expect(screen.getByRole("region", { name: "Configuration checklist" })).toHaveTextContent("Select a material");
    fireEvent.click(screen.getByRole("button", { name: "Material dropdown" }));
    expect(screen.getByRole("button", { name: /Aluminum/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Stainless steel/i })).toBeInTheDocument();
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
    await waitFor(() => expect(screen.queryByLabelText("Preview of bracket-drawing.pdf")).not.toBeInTheDocument());
    expect(screen.getByLabelText("Upload replacement technical drawing")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove Drawing" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Done" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Request Quote" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Technical drawing/), { target: { files: [new File(["replacement drawing"], "replacement-drawing.pdf", { type: "application/pdf" })] } });

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
    confirmSelectedCad();

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
    confirmSelectedCad();

    await screen.findByText("Line item 1: bracket");
    fireEvent.click(screen.getByRole("button", { name: "Quality documentation dropdown" }));
    fireEvent.click(screen.getByRole("option", { name: /Custom Inspection/ }));

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
    confirmSelectedCad();

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



          fileName: "mounting-bracket.step",
          generalTolerance: "iso_2768_medium_m",
          material: "al_6061_t6",
          notes: "Reorder from PO-DEMO_PUR / LQ-DEMO_PUR.",


          projectName: "Valve manifold order reorder",
          qualityDocumentation: ["standard_inspection"],
          quantity: "24",

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


          fileName: "bracket.step",
          generalTolerance: "iso_2768_medium_m",
          material: "al_6061_t6",


          projectName: "Bracket RFQ",
          qualityDocumentation: ["standard_inspection"],
          quantity: "5",

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


          lineItems: [
            {
              fileName: "Aluminum Plate.STEP",
              generalTolerance: "iso_2768_medium_m",
              material: "al_6061_t6",
              notes: "Threads requested; drawing required.",

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

              qualityDocumentation: ["standard_inspection"],
              quantity: "4",
              surfaceFinish: "as_machined_ra_3_2",
              technicalDrawingName: "Tubesheet Retainer Plate Hole Callout.pdf",
              threads: true,
            },
          ],

          projectName: "Tubesheet Retainer Plate reorder",

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
    expect(screen.getByRole("alertdialog", { name: "Remove this part?" })).toBeInTheDocument();
    expect(screen.getByText(/Tubesheet Retainer Plate · Line item 2/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("alertdialog", { name: "Remove this part?" })).not.toBeInTheDocument();
    expect(screen.getByText("Line item 2: Tubesheet Retainer Plate")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Delete Line item 2: Tubesheet Retainer Plate",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove part" }));
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


          fileName: "mounting-bracket.step",
          generalTolerance: "iso_2768_medium_m",
          material: "al_6061_t6",


          projectName: "Valve manifold order reorder",
          qualityDocumentation: ["standard_inspection"],
          quantity: "24",

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
    confirmSelectedCad();

    await screen.findByText("Local CAD preview: mounting-bracket.step");
    expect(screen.getByText(/This is only a saved drawing filename/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Request Quote" })).toBeDisabled();

    const drawing = new File(["drawing"], "mounting-bracket-drawing.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText(/Technical drawing/), {
      target: { files: [drawing] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    expect(screen.getByRole("button", { name: "Request Quote" })).toBeEnabled();

    await waitFor(() =>
      expect(fetchMock.mock.calls.filter(([url]) => String(url).includes("/api/request-draft-files"))).toHaveLength(4),
    );

    fireEvent.click(screen.getByRole("button", { name: "Request Quote" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/requests", expect.objectContaining({ method: "POST" })));
    const submittedForm = fetchMock.mock.calls.find(([url]) => url === "/api/requests")?.[1]?.body as FormData;
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


          lineItems: [
            {
              fileName: "Aluminum Plate.STEP",
              fileSizeBytes: 74752,
              fileStorageKey: "rfq/2026-06-03/aluminum-plate.step",
              fileType: "application/octet-stream",
              generalTolerance: "iso_2768_medium_m",
              material: "al_6061_t6",
              notes: "Threads requested; drawing required.",

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

          projectName: "Tubesheet Retainer Plate reorder",

        }}
      />,
    );

    expect(screen.getByText("Local CAD preview: Aluminum Plate.STEP")).toBeInTheDocument();
    expect(screen.queryByText(/This is only a saved filename/)).not.toBeInTheDocument();
    expect(screen.queryByText(/This is only a saved drawing filename/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Request Quote" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Request Quote" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/requests", expect.objectContaining({ method: "POST" })));
    const submittedForm = fetchMock.mock.calls.find(([url]) => url === "/api/requests")?.[1]?.body as FormData;
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

  it("rechecks saved draft model access before restoring the Autodesk CAD preview", async () => {
    const fetchMock = mockRequestFormFetch({ preview: { status: "ready" } });
    render(
      <RequestForm
        initialState={{

          fileName: "mounting-bracket.sldprt",

          projectName: "Valve manifold order reorder",
          cadPreview: {
            status: "ready",
            fileName: "mounting-bracket.sldprt",
            urn: "saved-viewer-urn",
          },
        }}
      />,
    );

    await waitFor(() => expect(screen.getByText("Loading interactive CAD preview...")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith("/api/cad-previews/status?urn=saved-viewer-urn", { cache: "no-store" });
    expect(screen.queryByText("3D preview ready")).not.toBeInTheDocument();
    expect(screen.queryByText("mounting-bracket.sldprt")).not.toBeInTheDocument();
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

    const file = new File(["solid"], "bracket.sldprt", { type: "model/step" });
    fireEvent.change(screen.getByLabelText("Choose CAD file"), {
      target: { files: [file] },
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/cad-previews", expect.objectContaining({ method: "POST" })));
    confirmSelectedCad();
    await screen.findByText(/Progress: 60% complete/);
    expect(fetchMock.mock.calls.filter(([url, init]) => url === "/api/cad-previews" && init?.method === "POST")).toHaveLength(1);
    expect(screen.getByText("Line item 1: bracket")).toBeInTheDocument();
    expect(screen.getByText("bracket.sldprt")).toBeInTheDocument();
    expect(screen.getByText(/You can keep building and submit the RFQ while this finishes/)).toBeInTheDocument();
    expect(screen.queryByText(/Progress: queued/)).not.toBeInTheDocument();
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
    confirmSelectedCad();

    await screen.findByText("Line item 1: bracket");
    fireEvent.change(screen.getByLabelText("Material"), { target: { value: "ss_304_full" } });

    const drawing = new File(["drawing"], "bracket-drawing.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText(/Technical drawing/), {
      target: { files: [drawing] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    const storedDraft = await waitFor(() => {
      const drafts = JSON.parse(window.localStorage.getItem("lattice.incompleteRfqs.v2.company_test") ?? "[]");
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

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/requests", expect.objectContaining({ method: "POST" })));
    const submittedForm = fetchMock.mock.calls.find(([url]) => url === "/api/requests")?.[1]?.body as FormData;
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
    confirmSelectedCad();

    await screen.findByText("Autodesk preview setup needed");
    expect(screen.getByText("Line item 1: fixture")).toBeInTheDocument();
    expect(screen.getByText("fixture.sldprt")).toBeInTheDocument();
    expect(screen.getByText(/Add APS_CLIENT_ID/)).toBeInTheDocument();
  });

  it("requires a technical drawing when drawing-required options are checked", async () => {
    mockRequestFormFetch();
    render(<RequestForm />);
    fireEvent.change(screen.getByLabelText("Choose CAD file"), { target: { files: [new File(["solid"], "bracket.step", { type: "model/step" })] } });
    confirmSelectedCad();
    await screen.findByText("Line item 1: bracket");
    fireEvent.change(screen.getByLabelText("Material"), { target: { value: "ss_304_full" } });
    expect(screen.getByRole("button", { name: "Request Quote" })).toBeEnabled();
    fireEvent.click(screen.getByLabelText(/Threads/));
    expect(screen.getByRole("button", { name: "Request Quote" })).toBeDisabled();
    expect(screen.getByRole("region", { name: "Configuration checklist" })).toHaveTextContent("Upload the required technical drawing");
    fireEvent.change(screen.getByLabelText(/Technical drawing/), { target: { files: [new File(["drawing"], "bracket-drawing.pdf", { type: "application/pdf" })] } });
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Request Quote" })).toBeEnabled();
  });

  it("requires a technical drawing for dimensional quality documentation", async () => {
    mockRequestFormFetch();
    render(<RequestForm />);
    fireEvent.change(screen.getByLabelText("Choose CAD file"), { target: { files: [new File(["solid"], "bracket.step", { type: "model/step" })] } });
    confirmSelectedCad();
    await screen.findByText("Line item 1: bracket");
    fireEvent.change(screen.getByLabelText("Material"), { target: { value: "ss_304_full" } });
    expect(screen.getByRole("button", { name: "Request Quote" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Quality documentation dropdown" }));
    fireEvent.click(screen.getByRole("option", { name: /Dimensional Inspection Report/ }));
    expect(screen.getByRole("button", { name: "Request Quote" })).toBeDisabled();
    expect(screen.getByRole("region", { name: "Configuration checklist" })).toHaveTextContent("Upload the required technical drawing");
    fireEvent.change(screen.getByLabelText(/Technical drawing/), { target: { files: [new File(["drawing"], "bracket-drawing.pdf", { type: "application/pdf" })] } });
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
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
    confirmSelectedCad();

    await screen.findByText("Line item 1: bracket");
    expect(screen.getByText("Line item 2: housing")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Quote name" })).toHaveTextContent("Bracket, Housing");
    expect(screen.getAllByLabelText("Material")).toHaveLength(2);
    expect(screen.getAllByLabelText("Quantity")).toHaveLength(2);

    await waitFor(() => {
      const drafts = JSON.parse(window.localStorage.getItem("lattice.incompleteRfqs.v2.company_test") ?? "[]");

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
    confirmSelectedCad();

    await screen.findByText("Line item 1: bracket");

    fireEvent.click(screen.getByRole("button", { name: "Delete Line item 1: bracket" }));
    expect(screen.getByRole("alertdialog", { name: "Remove this part?" })).toBeInTheDocument();
    expect(screen.getByText(/bracket · Line item 1/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove part" }));

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
    confirmSelectedCad();

    await screen.findByText("Line item 1: bracket");

    fireEvent.change(screen.getByLabelText("Upload another CAD file"), {
      target: { files: [new File(["solid"], "housing.step", { type: "model/step" })] },
    });
    confirmSelectedCad();

    await screen.findByText("Line item 2: housing");
    expect(screen.getByText("Line item 2: housing")).toBeInTheDocument();
    screen.getAllByLabelText("Material").forEach(select => fireEvent.change(select, { target: { value: "ss_304_full" } }));
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
      expect(fetchMock.mock.calls.filter(([url]) => String(url).includes("/api/request-draft-files"))).toHaveLength(4),
    );

    fireEvent.click(screen.getByRole("button", { name: "Request Quote" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/requests", expect.objectContaining({ method: "POST" })));
    const submittedForm = fetchMock.mock.calls.find(([url]) => url === "/api/requests")?.[1]?.body as FormData;
    const submitted = JSON.parse(String(submittedForm.get("request")));

    expect(submitted.lineItems).toMatchObject([
      {
        quantity: 1,
        material: "304 Stainless Steel",
        qualityDocumentation: ["Standard Inspection", "Material Test Report (MTR)"],
      },
      { quantity: 3, material: "304 Stainless Steel" },
    ]);
    expect(submitted.files).toMatchObject([
      { name: "bracket.step", storageKey: "rfq-drafts/test/bracket.step" },
      { name: "housing.step", storageKey: "rfq-drafts/test/housing.step" },
    ]);
    expect(submittedForm.get("file-0")).toBeNull();
    expect(submittedForm.get("file-1")).toBeNull();
    expect(routerReplaceMock).toHaveBeenCalledWith("/quotes/req_multi");
  });
});

vi.mock("./customer-workspace-scope", () => ({ useCustomerWorkspaceScope: () => "company_test", customerDraftStorageKey: () => "lattice.incompleteRfqs.v2.company_test" }));
