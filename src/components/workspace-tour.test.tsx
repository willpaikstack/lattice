import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { WorkspaceTour as Tour, CustomerTourHelp } from "./workspace-tour";
import { useWorkspaceTourUploadLock } from "./workspace-tour-interaction-guards";

function WorkspaceTour(props: ComponentProps<typeof Tour>) {
  useWorkspaceTourUploadLock(true);
  return <Tour {...props} />;
}

const props = { name: "Customer", pending: false, error: "", preview: true, onStep: vi.fn(), onSkip: vi.fn(), onNext: vi.fn(), onDismissError: vi.fn() };

describe("workspace tour navigation presentation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const main = document.createElement("main");
    main.innerHTML = '<a href="/requests/new">Request Quote</a><a href="/quotes">Quotes</a><section data-workspace-tour="quotes"></section>';
    document.body.append(main);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ x: 30, y: 90, top: 90, left: 30, right: 230, bottom: 150, width: 200, height: 60, toJSON: () => ({}) });
    vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
    HTMLElement.prototype.scrollIntoView ??= () => {};
    vi.spyOn(HTMLElement.prototype, "scrollIntoView").mockImplementation(() => {});
  });
  afterEach(() => { document.querySelector("main")?.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it("keeps step 1 until both the Request Quote route and a visible request anchor are ready", async () => {
    const view = render(<WorkspaceTour {...props} step={1} pathname="/dashboard" />);
    await screen.findByRole("heading", { name: "Start a quote request." });
    const backdrop = document.querySelector("[data-workspace-tour-backdrop]")!;
    expect(backdrop).toBeInTheDocument();
    view.rerender(<WorkspaceTour {...props} step={2} pathname="/dashboard" />);
    expect(document.querySelector("[data-workspace-tour-backdrop]")).toBe(backdrop);
    expect(backdrop.querySelector('[data-ready="false"]')).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Start a quote request." })).toBeInTheDocument();
    expect(screen.queryByText("Build your manufacturing request")).not.toBeInTheDocument();
    expect(screen.getByText(/1 of 5/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

    // A route change can commit a loading skeleton before the form arrives.
    view.rerender(<WorkspaceTour {...props} step={2} pathname="/requests/new" />);
    expect(screen.getByRole("heading", { name: "Start a quote request." })).toBeInTheDocument();
    const anchor = document.createElement("div");
    anchor.dataset.workspaceTour = "request-files";
    anchor.setAttribute("aria-hidden", "true");
    await act(async () => { document.querySelector("main")!.append(anchor); });
    expect(screen.queryByText("Build your manufacturing request")).not.toBeInTheDocument();
    await act(async () => { anchor.removeAttribute("aria-hidden"); });
    await screen.findByRole("heading", { name: "Build your manufacturing request" });
    expect(screen.getByText(/2 of 5/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
    expect(document.querySelector("[data-workspace-tour-backdrop]")).toBe(backdrop);
    expect(backdrop.querySelector('[data-ready="true"]')).toBeInTheDocument();
    view.unmount();
    expect(document.querySelector("[data-workspace-tour-backdrop]")).not.toBeInTheDocument();
  });

  it("positions beside the live highlight, follows scrolling, and holds its position until the next page is ready", async () => {
    const main = document.querySelector("main")!;
    const view = render(<WorkspaceTour {...props} step={1} pathname="/dashboard" />);
    await screen.findByRole("heading", { name: "Start a quote request." });
    expect(screen.getByRole("dialog")).toHaveStyle({ left: "248px", top: "90px" });
    const requestLink = main.querySelector<HTMLAnchorElement>('a[href="/requests/new"]')!;
    vi.spyOn(requestLink, "getBoundingClientRect").mockReturnValue({ x: 30, y: 160, left: 30, top: 160, right: 230, bottom: 220, width: 200, height: 60, toJSON: () => ({}) });
    fireEvent.scroll(window);
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveStyle({ left: "248px", top: "160px" }));
    view.rerender(<WorkspaceTour {...props} step={2} pathname="/requests/new" />);
    expect(screen.getByRole("dialog")).toHaveStyle({ left: "248px", top: "160px" });
    expect(screen.getByRole("heading", { name: "Start a quote request." })).toBeInTheDocument();
    const upload = document.createElement("section"); upload.dataset.workspaceTour = "request-files";
    vi.spyOn(upload, "getBoundingClientRect").mockReturnValue({ x: 350, y: 200, left: 350, top: 200, right: 950, bottom: 380, width: 600, height: 180, toJSON: () => ({}) });
    await act(async () => { main.append(upload); });
    await screen.findByRole("heading", { name: "Build your manufacturing request" });
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveStyle({ left: "350px", top: "398px" }));
  });

  it("waits for the Quotes page content before presenting step 3", async () => {
    const anchor = document.createElement("div");
    anchor.dataset.workspaceTour = "request-files";
    document.querySelector("main")!.append(anchor);
    const view = render(<WorkspaceTour {...props} step={2} pathname="/requests/new" />);
    await screen.findByRole("heading", { name: "Build your manufacturing request" });
    document.querySelector('[data-workspace-tour="quotes"]')!.remove();
    view.rerender(<WorkspaceTour {...props} step={3} pathname="/requests/new" />);
    expect(screen.getByRole("heading", { name: "Build your manufacturing request" })).toBeInTheDocument();
    view.rerender(<WorkspaceTour {...props} step={3} pathname="/quotes" />);
    expect(screen.getByRole("heading", { name: "Build your manufacturing request" })).toBeInTheDocument();
    await act(async () => { document.querySelector("main")!.insertAdjacentHTML("beforeend", '<section data-workspace-tour="quotes">Quotes page</section>'); });
    await waitFor(() => expect(screen.getByRole("heading", { name: "Manage your requests" })).toBeInTheDocument());
    expect(screen.getByText(/3 of 5/)).toBeInTheDocument();
  });
  it("blocks file choice, change and drops throughout the tour, then restores the original controls", async () => {
    const main = document.querySelector("main")!;
    main.insertAdjacentHTML("beforeend", '<section data-workspace-tour="request-files"><label>Choose CAD file<input type="file" id="tour-upload"></label><input type="file" disabled id="already-disabled"></section>');
    const upload = main.querySelector<HTMLInputElement>("#tour-upload")!;
    const drop = vi.fn(); const change = vi.fn(); const choose = vi.fn();
    main.addEventListener("drop", drop); upload.addEventListener("change", change); upload.labels![0].addEventListener("click", choose);
    const view = render(<WorkspaceTour {...props} step={2} pathname="/requests/new" />);
    await screen.findByRole("heading", { name: "Build your manufacturing request" });
    expect(upload).toBeDisabled();
    expect(upload.labels![0]).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(upload.labels![0]);
    fireEvent.change(upload, { target: { files: [new File(["cad"], "part.step")] } });
    fireEvent.drop(main, { dataTransfer: { types: ["Files"], files: [new File(["cad"], "part.step")] } });
    expect(choose).not.toHaveBeenCalled(); expect(change).not.toHaveBeenCalled(); expect(drop).not.toHaveBeenCalled();
    expect(props.onSkip).not.toHaveBeenCalled();
    const lateInput = document.createElement("input"); lateInput.type = "file";
    await act(async () => { main.append(lateInput); });
    await waitFor(() => expect(lateInput).toBeDisabled());
    view.unmount();
    expect(upload).toBeEnabled(); expect(lateInput).toBeEnabled();
    expect(main.querySelector("#already-disabled")).toBeDisabled();
    expect(upload.labels![0]).not.toHaveAttribute("aria-disabled");
    fireEvent.drop(main, { dataTransfer: { types: ["Files"], files: [] } });
    expect(drop).toHaveBeenCalledTimes(1);
  });

  it("keeps the Quotes highlight non-interactive; popup controls work and other outside clicks end the tour without activating the page", async () => {
    const main = document.querySelector("main")!;
    const quote = main.querySelector<HTMLAnchorElement>('a[href="/quotes"]')!;
    const outside = document.createElement("button"); outside.textContent = "Outside action";
    const underlying = vi.fn(); outside.addEventListener("click", underlying); main.append(outside);
    const view = render(<WorkspaceTour {...props} step={3} pathname="/quotes" />);
    await screen.findByRole("heading", { name: "Manage your requests" });
    expect(quote).toHaveAttribute("aria-disabled", "true");
    expect(quote).toHaveAttribute("tabindex", "-1");
    expect(fireEvent.click(quote)).toBe(false);
    expect(props.onSkip).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(props.onNext).toHaveBeenCalledTimes(1);
    expect(props.onSkip).not.toHaveBeenCalled();
    expect(fireEvent.click(outside)).toBe(false);
    expect(props.onSkip).toHaveBeenCalledTimes(1);
    expect(underlying).not.toHaveBeenCalled();
    view.unmount();
    expect(quote).not.toHaveAttribute("aria-disabled");
    expect(quote).not.toHaveAttribute("tabindex");
  });

  it("waits for Orders content behind the coach before presenting the Orders step", async () => {
    const main = document.querySelector("main")!;
    main.insertAdjacentHTML("beforeend", '<a href="/orders">Orders</a>');
    const view = render(<WorkspaceTour {...props} step={3} pathname="/quotes" />);
    await screen.findByRole("heading", { name: "Manage your requests" });
    const backdrop = document.querySelector("[data-workspace-tour-backdrop]")!;
    view.rerender(<WorkspaceTour {...props} step={4} pathname="/orders" />);
    expect(document.querySelector("[data-workspace-tour-backdrop]")).toBe(backdrop);
    expect(backdrop.querySelector('[data-ready="false"]')).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Manage your requests" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    await act(async () => { main.insertAdjacentHTML("beforeend", '<section data-workspace-tour="orders">Orders page</section>'); });
    await screen.findByRole("heading", { name: "Track work after you place an order." });
    expect(document.querySelector("[data-workspace-tour-backdrop]")).toBe(backdrop);
    expect(backdrop.querySelector('[data-ready="true"]')).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("uses the Lattice OS welcome and the revised Orders step with Next", async () => {
    HTMLDialogElement.prototype.showModal ??= function () { this.setAttribute("open", ""); };
    HTMLDialogElement.prototype.close ??= function () { this.removeAttribute("open"); };
    const view = render(<WorkspaceTour {...props} name="Chris Pfiffer" step={0} pathname="/dashboard" />);
    await screen.findByRole("heading", { name: "Welcome to Lattice OS, Chris" });
    document.querySelector("main")!.insertAdjacentHTML("beforeend", '<a href="/orders">Orders</a><section data-workspace-tour="orders">Orders page</section>');
    view.rerender(<WorkspaceTour {...props} step={4} pathname="/orders" />);
    await screen.findByRole("heading", { name: "Track work after you place an order." });
    expect(screen.getByText("The Orders page will contain all active production activity and delivery updates.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Open Orders" })).not.toBeInTheDocument();
  });

  it("labels Resources as the fifth and final numbered guide step", async () => {
    document.querySelector("main")!.insertAdjacentHTML("beforeend", '<section data-workspace-tour="resources">Your Resources</section>');
    render(<WorkspaceTour {...props} step={5} pathname="/orders" />);
    await screen.findByRole("heading", { name: "Explore Your Resources." });
    expect(screen.getByText(/5 of 5/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));
    expect(props.onNext).toHaveBeenCalledOnce();
  });

  it("shows the final popup without a numbered step", () => {
    HTMLDialogElement.prototype.showModal ??= function () { this.setAttribute("open", ""); };
    HTMLDialogElement.prototype.close ??= function () { this.removeAttribute("open"); };
    const finish = vi.fn();
    render(<CustomerTourHelp pending={false} error="" onReplay={vi.fn()} onClose={finish} onFinish={finish} onDismissError={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "You’re ready to get started." })).toBeInTheDocument();
    expect(screen.getByText("Workspace tour complete")).toBeInTheDocument();
    expect(screen.queryByText(/\d of \d/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Finish tour and start using your workspace" }));
    expect(finish).toHaveBeenCalledOnce();
  });
});
