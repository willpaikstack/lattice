import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ complete: vi.fn(), defer: vi.fn(), push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), pathname: "/dashboard" }));
vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname, useRouter: () => ({ push: mocks.push, replace: mocks.replace, refresh: mocks.refresh }) }));
vi.mock("@/app/(workspace)/onboarding/actions", () => ({ completeCustomerOnboarding: mocks.complete }));
vi.mock("@/app/(workspace)/account/settings/actions", () => ({ saveAccountSettingsAction: vi.fn(), deferInitialAddressOnboardingAction: mocks.defer }));
vi.mock("./account-settings-workspace", () => ({ AccountSettingsWorkspace: () => <div>Address setup</div> }));
import { defaultAccountSettings } from "@/lib/account-settings-shared";
import { CustomerOnboarding } from "./customer-onboarding";

const initial = { step: 403, completed: false, name: "Pat Test", company: "Test shop" };
describe("customer tour uses local steps and only records completion", () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.complete.mockResolvedValue(undefined); mocks.defer.mockResolvedValue(undefined); mocks.pathname = "/dashboard";
    HTMLDialogElement.prototype.showModal ??= function () { this.setAttribute("open", ""); };
    HTMLDialogElement.prototype.close ??= function () { this.removeAttribute("open"); };
    vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
    HTMLElement.prototype.scrollIntoView ??= () => {};
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ x: 30, y: 90, left: 30, top: 90, right: 230, bottom: 150, width: 200, height: 60, toJSON: () => ({}) });
    const main = document.createElement("main");
    main.innerHTML = '<a href="/requests/new">Request Quote</a><a href="/quotes">Quotes</a><a href="/orders">Orders</a><section data-workspace-tour="request-files"></section><section data-workspace-tour="orders"></section><section data-workspace-tour="resources"></section><section data-workspace-tour="quotes"></section>';
    document.body.append(main);
  });
  afterEach(() => { cleanup(); document.querySelector("main")?.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it("ignores old saved steps and advances forward/backward and across routes without a server save", async () => {
    const view = render(<CustomerOnboarding initial={initial} />);
    await screen.findByRole("dialog", { name: "Welcome to Lattice OS, Pat" });
    fireEvent.click(screen.getByRole("button", { name: "Show me around" }));
    await screen.findByRole("heading", { name: "Start a quote request." });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(mocks.push).toHaveBeenCalledWith("/requests/new");
    expect(mocks.complete).not.toHaveBeenCalled();
    mocks.pathname = "/requests/new"; view.rerender(<CustomerOnboarding initial={initial} />);
    await screen.findByRole("heading", { name: "Build your manufacturing request" });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(mocks.push).toHaveBeenLastCalledWith("/quotes");
    mocks.pathname = "/quotes"; view.rerender(<CustomerOnboarding initial={initial} />);
    await screen.findByRole("heading", { name: "Manage your requests" });
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(mocks.push).toHaveBeenLastCalledWith("/requests/new");
    mocks.pathname = "/requests/new"; view.rerender(<CustomerOnboarding initial={initial} />);
    await screen.findByRole("heading", { name: "Build your manufacturing request" });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(mocks.push).toHaveBeenLastCalledWith("/quotes");
    mocks.pathname = "/quotes"; view.rerender(<CustomerOnboarding initial={initial} />);
    await screen.findByRole("heading", { name: "Manage your requests" });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(mocks.push).toHaveBeenLastCalledWith("/orders");
    mocks.pathname = "/orders"; view.rerender(<CustomerOnboarding initial={initial} />);
    await screen.findByRole("heading", { name: "Track work after you place an order." });
    fireEvent.click(screen.getByRole("button", { name: "Request Quote" }));
    expect(mocks.push).toHaveBeenLastCalledWith("/dashboard");
    expect(mocks.complete).not.toHaveBeenCalled();
  });

  it("records completion once on exit, rather than on each step", async () => {
    render(<CustomerOnboarding initial={initial} />);
    await screen.findByRole("dialog", { name: "Welcome to Lattice OS, Pat" });
    fireEvent.click(screen.getByRole("button", { name: "Skip tour" }));
    await waitFor(() => expect(mocks.complete).toHaveBeenCalledExactlyOnceWith());
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("keeps the tour available when completion fails and allows closing without saving", async () => {
    mocks.complete.mockRejectedValueOnce(new Error("unavailable"));
    render(<CustomerOnboarding initial={initial} />);
    await screen.findByRole("dialog", { name: "Welcome to Lattice OS, Pat" });
    fireEvent.click(screen.getByRole("button", { name: "Skip tour" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("completion could not be saved"));
    fireEvent.click(screen.getByRole("button", { name: "Close without saving" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("replays from Help without clearing the customer's stored completion", async () => {
    render(<CustomerOnboarding initial={{ ...initial, completed: true, step: 406 }} />);
    act(() => window.dispatchEvent(new Event("lattice-customer-help")));
    await screen.findByRole("button", { name: /Replay workspace tour/ });
    fireEvent.click(screen.getByRole("button", { name: /Replay workspace tour/ }));
    await screen.findByRole("dialog", { name: "Welcome to Lattice OS, Pat" });
    expect(mocks.complete).not.toHaveBeenCalled();
  });
  async function showFinalPopup(completed = false) {
    const state = { ...initial, completed, needsAddressSetup: true, addressSettings: defaultAccountSettings() };
    const view = render(<CustomerOnboarding initial={state} />);
    if (completed) {
      expect(screen.queryByText("Address setup")).not.toBeInTheDocument();
      act(() => window.dispatchEvent(new Event("lattice-customer-help")));
      fireEvent.click(await screen.findByRole("button", { name: /Replay workspace tour/ }));
    }
    fireEvent.click(await screen.findByRole("button", { name: "Show me around" }));
    await screen.findByRole("heading", { name: "Start a quote request." });
    fireEvent.click(screen.getByRole("button", { name: "Your Resources" }));
    mocks.pathname = "/orders";
    view.rerender(<CustomerOnboarding initial={state} />);
    await screen.findByRole("heading", { name: "Explore Your Resources." });
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));
    await screen.findByRole("heading", { name: "You’re ready to get started." });
    return view;
  }

  it("offers first-time address setup and opens it only after Add now", async () => {
    await showFinalPopup();
    expect(screen.getByRole("button", { name: "Add later" })).toBeInTheDocument();
    expect(screen.queryByText("Address setup")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add shipping and billing addresses now" }));
    await screen.findByText("Address setup");
    expect(mocks.complete).toHaveBeenCalledOnce();
    expect(mocks.defer).not.toHaveBeenCalled();
  });

  it("persists Add later and finishes without opening address setup", async () => {
    await showFinalPopup();
    fireEvent.click(screen.getByRole("button", { name: "Add later" }));
    await waitFor(() => expect(mocks.complete).toHaveBeenCalledOnce());
    expect(mocks.defer).toHaveBeenCalledOnce();
    expect(screen.queryByText("Address setup")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps missing-address prompts out of Help replays and subsequent visits", async () => {
    await showFinalPopup(true);
    expect(screen.queryByRole("button", { name: "Add later" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add shipping and billing addresses now" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Finish tour and start using your workspace" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.queryByText("Address setup")).not.toBeInTheDocument();
    expect(mocks.complete).not.toHaveBeenCalled();
    expect(mocks.defer).not.toHaveBeenCalled();
  });
});
