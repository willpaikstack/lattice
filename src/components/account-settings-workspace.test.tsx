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

  it.each([
    { target: "shipping", id: "shipping-address", label: "Edit shipping", field: "Delivery Attn:" },
    { target: "billing-address", id: "billing-address", label: "Edit billing address", field: "Full name" },
    { target: "billing-contact", id: "billing-contact", label: "Edit billing", field: "Billing email" },
  ])("guides a quote visitor to $target until they open the editor, without saving changes", ({ target, id, label, field }) => {
    const scroll = vi.fn();
    const previousScroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView");
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: scroll });
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    window.history.replaceState(null, "", `/account/settings?focus=${target}#${id}`);
    searchParamsMock.mockReturnValue(new URLSearchParams(`focus=${target}`));
    const save = vi.fn(async (settings) => settings);
    try {
      render(<AccountSettingsWorkspace initialSettings={companySettings()} saveSettingsAction={save} />);
      const address = screen.getByRole("button", { name: label });
      expect(address).toHaveAttribute("data-address-highlight", "true");
      expect(address).toHaveFocus();
      expect(screen.getAllByRole("button").filter(button => button.hasAttribute("data-address-highlight"))).toEqual([address]);
      expect(scroll).toHaveBeenCalledWith({ behavior: "auto", block: "center" });
      expect(screen.queryByLabelText(field)).not.toBeInTheDocument();
      fireEvent.blur(address);
      expect(address).toHaveAttribute("data-address-highlight", "true");
      fireEvent.click(address);
      expect(address).not.toHaveAttribute("data-address-highlight");
      expect(screen.getByLabelText(field)).toBeInTheDocument();
      expect(window.location.search).toBe("");
      expect(window.location.hash).toBe("");
      expect(save).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
      if (previousScroll) Object.defineProperty(HTMLElement.prototype, "scrollIntoView", previousScroll);
      else delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView;
      window.history.replaceState(null, "", "/");
    }
  });

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
    expect(screen.getByRole("dialog", { name: "Shipping Address" })).toBeInTheDocument();
    expect(screen.getByLabelText("Delivery Attn:")).toBeInTheDocument();
  });

  it("lets the Customer Admin defer address onboarding and continue to the dashboard", async () => {
    searchParamsMock.mockReturnValue(new URLSearchParams("onboarding=addresses"));
    const deferInitialAddressOnboardingAction = vi.fn(async () => undefined);
    render(<AccountSettingsWorkspace deferInitialAddressOnboardingAction={deferInitialAddressOnboardingAction} initialSettings={{ ...defaultAccountSettings(), canCompleteInitialAddressOnboarding: true, roleLabel: "Customer Admin" }} />);

    fireEvent.click(screen.getByRole("button", { name: "I'll add this later in Account Settings" }));

    await waitFor(() => expect(deferInitialAddressOnboardingAction).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/dashboard"));
  });
  it("saves shipping and linked billing in place without navigating away from the workspace", async () => {
    const shipping = { name: "Test Buyer", company: "Test Shop", address1: "350 Fifth Avenue", address2: "", city: "New York", state: "NY", zipCode: "10118" };
    const onComplete = vi.fn();
    const save = vi.fn(async (settings) => settings);
    render(<AccountSettingsWorkspace onboardingOnly initialSettings={{ ...defaultAccountSettings(), shipping, canManageCompanyDefaults: true }} saveSettingsAction={save} onOnboardingComplete={onComplete} />);
    fireEvent.click(screen.getByRole("button", { name: "Done - Add Billing Address" }));
    await screen.findByRole("dialog", { name: "Billing Address" });
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ shipping }), "shipping");
    fireEvent.click(screen.getByRole("checkbox", { name: "Billing address is the same as shipping" }));
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce());
    expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ billingAddress: shipping, billingSameAsShipping: true }), "billingAddress");
    expect(replaceMock).not.toHaveBeenCalled();
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
    fireEvent.change(screen.getByLabelText("Phone number"), { target: { value: "(212) 555-0102" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await screen.findByText("Database unavailable");
    expect(screen.getByLabelText("Phone number")).toHaveValue("(212) 555-0102");
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ phone: "(212) 555-0102" }), "phone");
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await screen.findByText("Saved.");
    expect(refreshMock).toHaveBeenCalled();
  });

  it("opens linked billing in editable fields and saves edits as an independent address", async () => {
    const shipping = { name: "Test Buyer", company: "Test Shop", address1: "350 Fifth Avenue", address2: "", city: "New York", state: "NY", zipCode: "10118" };
    const save = vi.fn(async (settings) => settings);
    render(<AccountSettingsWorkspace initialSettings={{ ...companySettings(), shipping, billingAddress: { ...shipping }, billingSameAsShipping: true }} saveSettingsAction={save} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit billing address" }));
    expect(screen.getByLabelText("Full name")).toHaveValue("Test Buyer");
    expect(screen.getByRole("checkbox", { name: "Billing address is the same as shipping" })).toBeChecked();
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Billing Team" } });
    expect(screen.getByRole("checkbox", { name: "Billing address is the same as shipping" })).not.toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await screen.findByText("Company address saved.");
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ shipping, billingAddress: { ...shipping, name: "Billing Team" }, billingSameAsShipping: false }), "billingAddress");
  });
});
