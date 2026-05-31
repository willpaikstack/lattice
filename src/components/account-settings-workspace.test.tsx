import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AccountSettingsWorkspace } from "./account-settings-workspace";

describe("AccountSettingsWorkspace", () => {
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
    expect(screen.getByText("Amogy Accounts Payable")).toBeInTheDocument();
    expect(screen.getByText("500 7th Ave, New York, NY 10018, United States")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit billing address" }));
    fireEvent.change(screen.getByLabelText("Billing address"), { target: { value: "Amogy Finance\n44 Water St, New York, NY 10004, United States" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByText("Amogy Finance")).toBeInTheDocument();
    expect(screen.getByText("44 Water St, New York, NY 10004, United States")).toBeInTheDocument();
    expect(screen.getByText("procurement@amogy.co")).toBeInTheDocument();
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
