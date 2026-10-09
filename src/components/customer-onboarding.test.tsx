import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ save: vi.fn(), pathname: "/dashboard" }));
vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname }));
vi.mock("@/app/(workspace)/onboarding/actions", () => ({ saveCustomerOnboarding: mocks.save }));
import { CustomerOnboarding } from "./customer-onboarding";
const initial = { step: 0, completed: false, name: "Pat Test", company: "Test shop" };
describe("customer welcome and tour", () => {
  beforeEach(() => { mocks.save.mockReset(); mocks.save.mockResolvedValue(undefined); mocks.pathname = "/dashboard"; }); afterEach(cleanup);
  it("shows the real membership name and saves the next step", async () => {
    render(<CustomerOnboarding initial={initial} />);
    expect(screen.getByRole("dialog", { name: "Welcome to Lattice, Pat." })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show me around" }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledWith(1, false));
    expect(screen.getByRole("heading", { name: "Start with your part files." })).toBeInTheDocument();
  });
  it("keeps the tour open when progress saving fails", async () => {
    mocks.save.mockRejectedValueOnce(new Error("unavailable")); render(<CustomerOnboarding initial={initial} />);
    fireEvent.click(screen.getByRole("button", { name: "Skip tour" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("could not be saved"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
  it("lets a finished customer replay from Help", async () => {
    render(<CustomerOnboarding initial={{ ...initial, completed: true, step: 4 }} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    act(() => window.dispatchEvent(new Event("lattice-customer-help")));
    fireEvent.click(screen.getByRole("button", { name: "Replay workspace tour" }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledWith(0, false));
    expect(screen.getByRole("dialog", { name: "Welcome to Lattice, Pat." })).toBeInTheDocument();
  });
  it("leaves address setup accessible before showing the welcome", () => {
    mocks.pathname = "/account/settings"; render(<CustomerOnboarding initial={initial} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
