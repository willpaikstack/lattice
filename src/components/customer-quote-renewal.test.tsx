import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ renew: vi.fn() }));
vi.mock("@/app/(workspace)/quotes/[requestId]/renewal/actions", () => ({ requestQuoteRenewal: mocks.renew }));
import { CustomerQuoteRenewal } from "./customer-quote-renewal";
const props = { requestId: "request_a", quoteVersionId: "quote_a", quoteNumber: "LQ-TEST", canSubmit: true };

describe("customer quote renewal", () => {
  beforeEach(() => vi.resetAllMocks());
  it("shows a saved confirmation and removes the submit action after success", async () => {
    mocks.renew.mockResolvedValue({ id: "ticket_a" });
    render(<CustomerQuoteRenewal {...props} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "New delivery date" } });
    fireEvent.click(screen.getByRole("button", { name: "Request renewed quote" }));
    expect(await screen.findByRole("status")).toHaveTextContent("support queue");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
  it("keeps the request retryable when saving fails", async () => {
    mocks.renew.mockRejectedValue(new Error("Database unavailable"));
    render(<CustomerQuoteRenewal {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Request renewed quote" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Database unavailable");
    expect(await screen.findByRole("button", { name: "Request renewed quote" })).toBeEnabled();
  });
  it("restores waiting status on a subsequent visit", () => {
    render(<CustomerQuoteRenewal {...props} requestedAt="2026-10-10T12:00:00Z" />);
    expect(screen.getByRole("status")).toHaveTextContent("valid quote is issued");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
