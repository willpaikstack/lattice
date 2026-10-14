import {buildDraftRequest} from "@/lib/request-model";
import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ pathname: "/dashboard" }));
vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname }));
import { CustomerWorkspaceProvider, customerDraftStorageKey } from "./customer-workspace-scope";

describe("workspace draft synchronization", () => {
  afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); });
  it("saves genuine drafts while excluding demo records and ignores demo deletion", async () => {
    mocks.pathname = "/requests/new";
    const draft = { id: "local_draft_real", updatedAt: "2026-10-10T12:00:00Z", request:{...buildDraftRequest({title:"QA",lineItems:[{material:"Aluminum",quantity:1}],files:[]}),id:"local_draft_real"},initialState:{} };
    const preview = { ...draft,id: "demo_draft_pump_cover",request:{...draft.request,id:"demo_draft_pump_cover"} };
    const key = customerDraftStorageKey("company_a")!;
    localStorage.setItem(key, JSON.stringify([preview, draft]));
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ drafts: [], deletedIds: [] }) }));
    vi.stubGlobal("fetch", fetchMock);
    render(<CustomerWorkspaceProvider scope="company_a"><h1>RFQ form</h1></CustomerWorkspaceProvider>);
    await screen.findByRole("heading", { name: "RFQ form" });
    act(() => window.dispatchEvent(new Event("lattice-drafts-changed")));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/request-drafts", expect.objectContaining({ method: "POST" })));
    const saved = JSON.parse((fetchMock.mock.calls as unknown as [string, RequestInit][]).find(([,init])=>init?.method === "POST")?.[1]?.body as string);
    expect(saved).toHaveLength(1); expect(saved[0]).toMatchObject({id:draft.id,schemaVersion:1});
    expect(JSON.parse(localStorage.getItem(key)!)).toHaveLength(2);
    act(() => window.dispatchEvent(new CustomEvent("lattice-draft-removed", { detail: preview.id })));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.queryByText(/Shared drafts are temporarily unavailable/)).not.toBeInTheDocument();
  });
  it("clears an earlier failure after a successful restored-page load", async () => {
    mocks.pathname = "/requests/new";
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: false }).mockResolvedValue({ ok: true, json: async () => ({ drafts: [], deletedIds: [] }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<CustomerWorkspaceProvider scope="company_a"><h1>RFQ form</h1></CustomerWorkspaceProvider>);
    await screen.findByText(/Shared drafts are temporarily unavailable/);
    act(() => window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })));
    await waitFor(() => expect(screen.queryByText(/Shared drafts are temporarily unavailable/)).not.toBeInTheDocument());
  });
  it("keeps the dashboard visible while shared drafts are loading", () => {
    mocks.pathname = "/dashboard";
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    render(<CustomerWorkspaceProvider scope="company_a"><h1>Home content</h1></CustomerWorkspaceProvider>);
    expect(screen.getByRole("heading", { name: "Home content" })).toBeInTheDocument();
    expect(screen.queryByText("Loading your workspace…")).not.toBeInTheDocument();
  });
  it("waits for shared drafts before mounting the RFQ form", () => {
    mocks.pathname = "/requests/new";
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    render(<CustomerWorkspaceProvider scope="company_a"><h1>RFQ form</h1></CustomerWorkspaceProvider>);
    expect(screen.getByRole("status")).toHaveTextContent("Loading quote form");
    expect(screen.getByRole("heading", { name: "Request a quote" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "RFQ form" })).not.toBeInTheDocument();
  });
});
