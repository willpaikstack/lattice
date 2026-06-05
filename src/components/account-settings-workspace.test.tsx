import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AccountSettingsWorkspace } from "./account-settings-workspace";

const accountSettingsStorageKey = "lattice.account-settings.v1";

describe("AccountSettingsWorkspace", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: vi.fn((key: string) => store.get(key) ?? null),
        removeItem: vi.fn((key: string) => {
          store.delete(key);
        }),
        setItem: vi.fn((key: string, value: string) => {
          store.set(key, value);
        }),
      },
    });
    window.localStorage.removeItem(accountSettingsStorageKey);
  });

  it("edits account contact details inline", () => {
    render(<AccountSettingsWorkspace />);

    fireEvent.click(screen.getByRole("button", { name: "Edit name" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Will Paik" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByText("Will Paik")).toBeInTheDocument();
    expect(screen.getByText("Account setting updated for this demo session.")).toBeInTheDocument();
  });

  it("accepts only phone digits and formats the saved phone number", () => {
    render(<AccountSettingsWorkspace />);

    fireEvent.click(screen.getByRole("button", { name: "Edit phone" }));

    const phoneInput = screen.getByLabelText("Phone number");
    expect(phoneInput).toHaveValue("13106174533");

    fireEvent.change(phoneInput, { target: { value: "df" } });
    expect(phoneInput).toHaveValue("");

    fireEvent.change(phoneInput, { target: { value: "2125550199" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByText("+1 (212) 555-0199")).toBeInTheDocument();
    expect(screen.getByText("Account setting updated for this demo session.")).toBeInTheDocument();
  });

  it("keeps the saved phone number after the settings page remounts", async () => {
    const { unmount } = render(<AccountSettingsWorkspace />);

    fireEvent.click(screen.getByRole("button", { name: "Edit phone" }));
    fireEvent.change(screen.getByLabelText("Phone number"), { target: { value: "9295859892" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByText("+1 (929) 585-9892")).toBeInTheDocument();

    unmount();
    render(<AccountSettingsWorkspace />);

    expect(await screen.findByText("+1 (929) 585-9892")).toBeInTheDocument();
  });


  it("opens an avatar composer for preset profile pictures", () => {
    render(<AccountSettingsWorkspace />);

    expect(screen.queryByText("Preset avatars")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Change photo" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reset" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Change profile photo" }));

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "File" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "From clipboard" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("menuitem", { name: "Use an Emoji" }));

    expect(screen.getByRole("dialog", { name: "Change profile photo" })).toBeInTheDocument();
    expect(screen.getByText("Preset avatars")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Use Gear preset" }));
    expect(screen.getByRole("button", { name: "Use Gear preset" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Save avatar" }));

    expect(screen.queryByRole("dialog", { name: "Change profile photo" })).not.toBeInTheDocument();
    expect(screen.queryByText("Preset avatars")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reset" })).not.toBeInTheDocument();
  });

  it("validates and adds payment methods", () => {
    render(<AccountSettingsWorkspace />);

    expect(screen.queryByLabelText("Card holder")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add credit card" }));

    fireEvent.change(screen.getByLabelText("Card holder"), { target: { value: "Prototype Team" } });
    fireEvent.change(screen.getByLabelText("Ending digits"), { target: { value: "12" } });
    fireEvent.change(screen.getByLabelText("Expires"), { target: { value: "09/2028" } });
    fireEvent.click(screen.getByRole("button", { name: "Add card" }));

    expect(screen.getByText("Card ending must be exactly 4 digits.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Ending digits"), { target: { value: "1234" } });
    fireEvent.click(screen.getByRole("button", { name: "Add card" }));

    expect(screen.getByText("Card ending in **** 1234")).toBeInTheDocument();
    expect(screen.getByText("Payment method added for this demo session.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Card holder")).not.toBeInTheDocument();
  });

  it("edits the billing address default separately from billing contact", () => {
    render(<AccountSettingsWorkspace />);

    expect(screen.queryByText("Default RFQ requirements")).not.toBeInTheDocument();
    expect(screen.getAllByText("Amogy").length).toBeGreaterThan(0);
    expect(screen.getAllByText("19 Morris Ave").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Brooklyn, NY 11205").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Edit billing address" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Accounts Payable" } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Amogy Finance" } });
    fireEvent.change(screen.getByLabelText("Address 1"), { target: { value: "44 Water St" } });
    fireEvent.change(screen.getByLabelText("Address 2"), { target: { value: "Suite 1200" } });
    fireEvent.change(screen.getByLabelText("City"), { target: { value: "New York" } });
    fireEvent.change(screen.getByLabelText("State"), { target: { value: "NY" } });
    fireEvent.change(screen.getByLabelText("Zip code"), { target: { value: "10004" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByText("Accounts Payable")).toBeInTheDocument();
    expect(screen.getByText("Amogy Finance")).toBeInTheDocument();
    expect(screen.getByText("44 Water St")).toBeInTheDocument();
    expect(screen.getByText("Suite 1200")).toBeInTheDocument();
    expect(screen.getByText("New York, NY 10004")).toBeInTheDocument();
    expect(screen.getByText("procurement@amogy.co")).toBeInTheDocument();
  });

  it("edits the saved shipping address with structured address fields", () => {
    render(<AccountSettingsWorkspace />);

    fireEvent.click(screen.getByRole("button", { name: "Edit shipping" }));

    expect(screen.getByLabelText("Name")).toHaveValue("William Paik");
    expect(screen.getByLabelText("Company")).toHaveValue("Amogy");
    expect(screen.getByLabelText("Address 1")).toHaveValue("19 Morris Ave");
    expect(screen.getByLabelText("Address 2")).toHaveValue("");
    expect(screen.getByLabelText("City")).toHaveValue("Brooklyn");
    expect(screen.getByLabelText("State")).toHaveValue("NY");
    expect(screen.getByLabelText("Zip code")).toHaveValue("11205");

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Receiving Team" } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Lattice Receiving" } });
    fireEvent.change(screen.getByLabelText("Address 1"), { target: { value: "75 Varick St" } });
    fireEvent.change(screen.getByLabelText("Address 2"), { target: { value: "Dock 3" } });
    fireEvent.change(screen.getByLabelText("City"), { target: { value: "New York" } });
    fireEvent.change(screen.getByLabelText("State"), { target: { value: "NY" } });
    fireEvent.change(screen.getByLabelText("Zip code"), { target: { value: "10013" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByText("Receiving Team")).toBeInTheDocument();
    expect(screen.getByText("Lattice Receiving")).toBeInTheDocument();
    expect(screen.getByText("75 Varick St")).toBeInTheDocument();
    expect(screen.getByText("Dock 3")).toBeInTheDocument();
    expect(screen.getByText("New York, NY 10013")).toBeInTheDocument();
  });

  it("edits billing contact details with separate fields", () => {
    render(<AccountSettingsWorkspace />);

    expect(screen.getByText("procurement@amogy.co")).toBeInTheDocument();
    expect(screen.getByText("Route invoices to AP after PO match.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit billing" }));

    expect(screen.getByLabelText("Billing email")).toHaveValue("procurement@amogy.co");
    expect(screen.getByLabelText("Invoice routing notes")).toHaveValue("Route invoices to AP after PO match.");

    fireEvent.change(screen.getByLabelText("Billing email"), { target: { value: "ap@amogy.co" } });
    fireEvent.change(screen.getByLabelText("Invoice routing notes"), { target: { value: "Send invoices after PO, packing slip, and receiver match." } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByText("ap@amogy.co")).toBeInTheDocument();
    expect(screen.getByText("Send invoices after PO, packing slip, and receiver match.")).toBeInTheDocument();
  });

  it("switches to team management and updates a member", () => {
    render(<AccountSettingsWorkspace />);

    fireEvent.click(screen.getByRole("tab", { name: "Team account members" }));
    fireEvent.click(screen.getByRole("button", { name: "Manage Quality Team" }));
    fireEvent.change(screen.getByLabelText("Quality Team status"), { target: { value: "Active" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText("Quality Team was updated for this demo session.")).toBeInTheDocument();
    expect(screen.getAllByText("Active").length).toBeGreaterThan(2);
  });
});
