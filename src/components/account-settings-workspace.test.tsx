import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { defaultAccountSettings } from "@/lib/account-settings-shared";
import { AccountSettingsWorkspace } from "./account-settings-workspace";

const searchParamsMock = vi.hoisted(() => vi.fn(() => new URLSearchParams()));
const refreshMock = vi.hoisted(() => vi.fn());
const replaceMock = vi.hoisted(() => vi.fn());
const clerkUser = vi.hoisted(() => ({ passwordEnabled: true, reload: vi.fn(), setProfileImage: vi.fn(), updateMetadata: vi.fn(), updatePassword: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: refreshMock, replace: replaceMock }), useSearchParams: () => searchParamsMock() }));
vi.mock("@clerk/nextjs", () => ({ useUser: () => ({ isLoaded: true, user: clerkUser }) }));

function companySettings() {
  return {
    ...defaultAccountSettings(), accountCreatedAt: "August 18, 2026", canManageCompany: true, companyName: "Amogy", email: "will@latticeos.co", emailVerificationStatus: "verified" as const, emailVerifiedAt: "August 18, 2026", name: "William Paik", phone: "+1 (929) 585-9892", roleLabel: "Lattice Admin",
  };
}

describe("AccountSettingsWorkspace", () => {
  beforeEach(() => { searchParamsMock.mockReturnValue(new URLSearchParams()); refreshMock.mockReset(); replaceMock.mockReset(); clerkUser.updatePassword.mockReset(); });

  it("renders provider identity data and keeps email changes with Lattice support", () => {
    render(<AccountSettingsWorkspace initialSettings={companySettings()} />);
    expect(screen.getByText("Account created on August 18, 2026")).toBeInTheDocument();
    expect(screen.getByText("Verified on August 18, 2026")).toBeInTheDocument();
    expect(screen.getByText("Lattice Admin")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Manage email" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Lattice support" })).toHaveAttribute("href", "mailto:support@latticeos.co?subject=Email%20address%20change%20request");
  });

  it("persists a display-name change through the authenticated profile action", async () => {
    const updateDisplayNameAction = vi.fn(async (name: string) => ({ name }));
    render(<AccountSettingsWorkspace initialSettings={companySettings()} updateDisplayNameAction={updateDisplayNameAction} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit name" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Will Paik" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(updateDisplayNameAction).toHaveBeenCalledWith("Will Paik"));
  });

  it("only exposes shared-company editing to Lattice Admin", () => {
    render(<AccountSettingsWorkspace initialSettings={companySettings()} />);
    expect(screen.getByRole("button", { name: "Edit company" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit shipping" })).toBeInTheDocument();
  });

  it("does not expose company default controls to a customer member", () => {
    render(<AccountSettingsWorkspace initialSettings={{ ...companySettings(), canManageCompany: false, roleLabel: "Customer Member" }} />);
    expect(screen.queryByRole("button", { name: "Edit company" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit shipping" })).not.toBeInTheDocument();
    expect(screen.getByText(/Lattice Admin manages company defaults/i)).toBeInTheDocument();
  });

  it("does not expose user-scoped saved-card, tax, or purchase-order controls", () => {
    render(<AccountSettingsWorkspace initialSettings={companySettings()} />);
    expect(screen.queryByRole("button", { name: "Add credit card" })).not.toBeInTheDocument();
    expect(screen.getByText(/Payment cards are company-wide/i)).toBeInTheDocument();
    expect(screen.queryByText("Tax-exempt reseller")).not.toBeInTheDocument();
    expect(screen.queryByText(/Purchase Orders/)).not.toBeInTheDocument();
  });

  it("supports the first-company address onboarding path", () => {
    searchParamsMock.mockReturnValue(new URLSearchParams("onboarding=addresses"));
    render(<AccountSettingsWorkspace initialSettings={{ ...defaultAccountSettings(), canCompleteInitialAddressOnboarding: true, roleLabel: "Customer Admin" }} />);
    expect(screen.getByRole("dialog", { name: /where should we ship your parts/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });

  it("lets the Customer Admin defer address onboarding and continue to the dashboard", async () => {
    searchParamsMock.mockReturnValue(new URLSearchParams("onboarding=addresses"));
    const deferInitialAddressOnboardingAction = vi.fn(async () => undefined);
    render(<AccountSettingsWorkspace deferInitialAddressOnboardingAction={deferInitialAddressOnboardingAction} initialSettings={{ ...defaultAccountSettings(), canCompleteInitialAddressOnboarding: true, roleLabel: "Customer Admin" }} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Skip for now" })[0]);

    await waitFor(() => expect(deferInitialAddressOnboardingAction).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/dashboard"));
  });
});
