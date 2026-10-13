import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildDraftRequest, submitDraftRequest, type LatticeRequest } from "@/lib/request-model";

const mocks = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn(), params: new URLSearchParams() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh, push: vi.fn() }),
  useSearchParams: () => mocks.params,
}));
vi.mock("./supplier-quote-files", () => ({ SupplierQuoteFiles: ({ children }: { children?: React.ReactNode }) => <div>{children}</div> }));
import { AdminQuoteManagement } from "./admin-quote-management";

let request: LatticeRequest;
beforeEach(() => {
  vi.clearAllMocks();
  request = { ...submitDraftRequest(buildDraftRequest({
    title: "Bracket RFQ", process: "CNC milling", buyerCompany: "Test company",
    lineItems: [{ partName: "Bracket", quantity: 3, material: "6061-T6 Aluminum" }],
    files: [{ name: "bracket.step", sizeBytes: 2048, type: "model/step" }],
  })), id: "req_test" };
  mocks.params = new URLSearchParams("requestId=req_test&view=quote");
});
async function prepare(action = vi.fn()) {
  render(<AdminQuoteManagement requests={[request]} updateStatusAction={action} />);
  const price = await screen.findByLabelText("Unit price - Bracket");
  fireEvent.change(price, { target: { value: "12.50" } });
  return price;
}
function submitQuote() {
  const button = screen.getByRole("button", { name: "Issue customer quote" }) as HTMLButtonElement;
  fireEvent.submit(button.form!);
}

describe("quote workbench saves", () => {
  it("blocks issuance until every part has pricing", async () => {
    render(<AdminQuoteManagement requests={[request]} updateStatusAction={vi.fn()} />);
    expect(await screen.findByRole("button", { name: "Issue customer quote" })).toBeDisabled();
  });
  it("retains entered prices and supports retry after a failed save", async () => {
    const action = vi.fn().mockResolvedValueOnce({ error: "Unable to save. Try again." }).mockResolvedValueOnce({ success: true });
    const price = await prepare(action);
    submitQuote();
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to save. Try again.");
    expect(price).toHaveValue(12.5);
    expect(mocks.refresh).not.toHaveBeenCalled();
    submitQuote();
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());
    expect(mocks.replace).toHaveBeenCalledWith("/admin/quotes?requestId=req_test&view=quote", { scroll: false });
    expect(screen.getByRole("status")).toHaveTextContent("Customer quote saved");
  });
  it("disables repeat issuance while saving", async () => {
    let resolve: (value: { success: true }) => void = () => {};
    const action = vi.fn(() => new Promise<{ success: true }>((done) => { resolve = done; }));
    const price = await prepare(action);
    submitQuote();
    await waitFor(() => expect(screen.getByRole("button", { name: "Saving quote…" })).toBeDisabled());
    expect(price).toBeDisabled();
    fireEvent.submit((price as HTMLInputElement).form!);
    expect(action).toHaveBeenCalledOnce();
    resolve({ success: true });
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());
  });
  it("shows closed RFQs without issuance controls", async () => {
    request.status = "CLOSED";
    render(<AdminQuoteManagement requests={[request]} updateStatusAction={vi.fn()} />);
    expect(await screen.findByRole("region", { name: "Archived RFQ details" })).toHaveTextContent("cannot receive a customer quote");
    expect(screen.queryByRole("button", { name: "Issue customer quote" })).not.toBeInTheDocument();
  });
  it("retains a customer clarification note when its save fails", async () => {
    mocks.params = new URLSearchParams("requestId=req_test&decision=NEEDS_INFO");
    const action = vi.fn().mockResolvedValue({ error: "Unable to save decision." });
    render(<AdminQuoteManagement requests={[request]} updateDecisionAction={action} />);
    const note = await screen.findByLabelText("Customer note", { selector: 'textarea[name="customerNote"]' });
    fireEvent.change(note, { target: { value: "Please confirm tolerance." } });
    fireEvent.submit((note as HTMLTextAreaElement).form!);
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to save decision.");
    expect(note).toHaveValue("Please confirm tolerance.");
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
