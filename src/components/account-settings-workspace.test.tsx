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

  it("shows provider-confirmed email verification even when Clerk has no verification timestamp", () => {
    render(<AccountSettingsWorkspace initialSettings={{ ...companySettings(), emailVerificationStatus: "verification-date-unavailable", emailVerifiedAt: "" }} />);
    expect(screen.getByText("Email verified.")).toBeInTheDocument();
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
    expect(screen.getByText(/Customer Admins and Lattice Admins manage company defaults/i)).toBeInTheDocument();
  });

  it("does not expose user-scoped saved-card, tax, or purchase-order controls", () => {
    render(<AccountSettingsWorkspace initialSettings={companySettings()} />);
    expect(screen.queryByRole("button", { name: "Add credit card" })).not.toBeInTheDocument();
    expect(screen.getByText(/saved-card management is not enabled/i)).toBeInTheDocument();
    expect(screen.getByText("Card checkout is currently unavailable")).toBeInTheDocument();
    expect(screen.queryByText("Tax-exempt reseller")).not.toBeInTheDocument();
    expect(screen.queryByText(/Purchase Orders/)).not.toBeInTheDocument();
  });

  it("only describes card purchasing as available when checkout is enabled", () => {
    render(<AccountSettingsWorkspace cardCheckoutAvailable initialSettings={companySettings()} />);
    expect(screen.getByText("Card payments available for eligible quotes")).toBeInTheDocument();
    expect(screen.queryByText("Card checkout is currently unavailable")).not.toBeInTheDocument();
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

    fireEvent.click(screen.getByRole("button", { name: /skip for now — you can add/i }));

    await waitFor(() => expect(deferInitialAddressOnboardingAction).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/dashboard"));
  });
  it("exposes ongoing shared defaults to a Customer Admin without company-name editing", () => {
    render(<AccountSettingsWorkspace initialSettings={{ ...companySettings(), canManageCompany: false, canManageCompanyDefaults: true, roleLabel: "Customer Admin" }} />);
    expect(screen.getByRole("button", { name: "Edit shipping" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit billing address" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit billing" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit company" })).not.toBeInTheDocument();
  });

  it("replaces password editing with a recovery link and removes currency", () => {
    render(<AccountSettingsWorkspace initialSettings={companySettings()} />);
    expect(screen.queryByRole("button", { name: "Edit password" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reset password" })).toHaveAttribute("href", "/forgot-password?email=will%40latticeos.co");
    expect(screen.queryByText("Currency")).not.toBeInTheDocument();
    expect(screen.getByText("Company")).toBeInTheDocument();
  });

  it("preserves edits on a failed database save and sends only the edited group", async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error("Database unavailable")).mockImplementation(async (settings) => settings);
    render(<AccountSettingsWorkspace initialSettings={companySettings()} saveSettingsAction={save} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit phone" }));
    fireEvent.change(screen.getByLabelText("Phone number"), { target: { value: "555-0102" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await screen.findByText("Database unavailable");
    expect(screen.getByLabelText("Phone number")).toHaveValue("555-0102");
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ phone: "555-0102" }), "phone");
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await screen.findByText("Saved.");
    expect(refreshMock).toHaveBeenCalled();
  });

});
