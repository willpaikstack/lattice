import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ action: vi.fn() }));
vi.mock("@/app/book-a-call/actions", () => ({
  requestCallAction: mocks.action,
}));
import { CallRequestForm } from "./call-request-form";

function fillRequest() {
  fireEvent.change(screen.getByLabelText("Full name"), {
    target: { value: "Alex Shop" },
  });
  fireEvent.change(screen.getByLabelText("Company"), {
    target: { value: "Example Machining" },
  });
  fireEvent.change(screen.getByLabelText("Work email"), {
    target: { value: "alex@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Where could you use support?"), {
    target: { value: "Overflow milling" },
  });
}
describe("Call request form feedback", () => {
  beforeEach(() => mocks.action.mockReset());
  it("keeps entered details available for retry after a server save failure", async () => {
    mocks.action.mockResolvedValue({
      status: "error",
      message: "We couldn’t save your request. Please try again.",
    });
    render(<CallRequestForm />);
    fillRequest();
    fireEvent.click(screen.getByRole("button", { name: "Request a call" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("try again");
    expect(screen.getByLabelText("Work email")).toHaveValue("alex@example.com");
    expect(screen.getByLabelText("Where could you use support?")).toHaveValue(
      "Overflow milling",
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Request a call" }),
      ).toBeEnabled(),
    );
  });
  it("shows a scheduling-pending receipt only after the server reports a saved request", async () => {
    mocks.action.mockResolvedValue({
      status: "received",
      message:
        "We’ll email you to arrange a time. Your call is not scheduled yet.",
    });
    render(<CallRequestForm />);
    fillRequest();
    fireEvent.click(screen.getByRole("button", { name: "Request a call" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "not scheduled yet",
    );
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(mocks.action.mock.calls[0][1].get("needs")).toBe("Overflow milling");
  });
});
