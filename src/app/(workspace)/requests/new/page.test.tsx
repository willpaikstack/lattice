import { beforeEach, describe, expect, it, vi } from "vitest";
import { catalogMaterialAction, materialOfferingFor } from "@/lib/material-quote-offerings";

const mocks = vi.hoisted(() => ({ getRequest: vi.fn(), list: vi.fn(), session: vi.fn(), draft: vi.fn(), reorder: vi.fn() }));
vi.mock("@/components/request-form", () => ({ RequestForm: () => null }));
vi.mock("@/lib/request-access-policy", () => ({
  getCustomerRequestByIdForCurrentSession: mocks.getRequest,
  filterCustomerVisibleRequests: (requests: unknown[]) => requests,
}));
vi.mock("@/lib/request-repository", () => ({ listBuyerQuotes: mocks.list }));
vi.mock("@/lib/session", () => ({ getCurrentSession: mocks.session }));
vi.mock("@/lib/request-form-prefill", () => ({
  draftInitialState: mocks.draft, reorderInitialState: mocks.reorder,
  isResumeCandidate: () => false, orderReference: () => "Existing order",
}));
import NewRequestPage from "./page";

describe("catalog-to-quote handoff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.list.mockResolvedValue([]);
    mocks.session.mockResolvedValue({ user: { id: "buyer" } });
    mocks.getRequest.mockResolvedValue(null);
  });

  it("prefills a precise material variant on a new request", async () => {
    const page = await NewRequestPage({ searchParams: Promise.resolve({ material: "6061_t651_aluminum" }) });
    expect(page.props.initialMaterial).toBe("6061_t651_aluminum");
    expect(page.props.prefillNotice).toContain("6061-T651 Aluminum");
  });

  it("allows an alloy parent to carry through with its condition still required", async () => {
    const parent = materialOfferingFor("6061_t651_aluminum")!.value;
    const page = await NewRequestPage({ searchParams: Promise.resolve({ material: parent }) });
    expect(page.props.initialMaterial).toBe(parent);
  });

  it("does not treat sourcing-only catalog choices as ready quote materials", async () => {
    const action = catalogMaterialAction("Stainless steel", "321");
    const value = new URL(action.href, "https://lattice.example").searchParams.get("material")!;
    const page = await NewRequestPage({ searchParams: Promise.resolve({ material: value }) });
    expect(page.props.initialMaterial).toBeUndefined();
  });

  it.each(["draft", "reorder"])("keeps saved %s requirements ahead of a material query", async (mode) => {
    const state = { projectName: "Saved requirement", lineItems: [{ material: "al_6061_t6" }] };
    mocks.getRequest.mockResolvedValue({ status: "DRAFT", id: "saved" });
    mocks.draft.mockReturnValue(state);
    mocks.reorder.mockReturnValue(state);
    const page = await NewRequestPage({ searchParams: Promise.resolve({ [mode]: "saved", material: "6061_t651_aluminum" }) });
    expect(page.props.initialState).toBe(state);
    expect(page.props.initialMaterial).toBeUndefined();
  });
});
