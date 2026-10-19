import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { initialShippingAddress } from "@/lib/account-settings-shared";
import { AccountAddressFields } from "./account-address-fields";

function Editor() {
  const [value, setValue] = useState(initialShippingAddress);
  return <AccountAddressFields value={value} setValue={setValue} />;
}

afterEach(() => vi.unstubAllGlobals());

describe("address suggestion placement and selection", () => {
  it("anchors a single list below City and fills city, state and ZIP by keyboard", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ options: [{ city: "New York", state: "NY", zipCode: "10001" }, { city: "New York", state: "NY", zipCode: "10002" }] }) }));
    render(<Editor />);
    const city = screen.getByRole("combobox", { name: "City" });
    fireEvent.focus(city);
    fireEvent.change(city, { target: { value: "New York" } });
    const suggestions = await screen.findByRole("listbox", { name: "Address suggestions" });
    expect(city.closest("label")?.parentElement).toContainElement(suggestions);
    expect(within(suggestions).getAllByRole("option")).toHaveLength(2);
    fireEvent.keyDown(city, { key: "ArrowDown" });
    fireEvent.keyDown(city, { key: "ArrowDown" });
    fireEvent.keyDown(city, { key: "Enter" });
    expect(city).toHaveValue("New York");
    expect(screen.getByRole("combobox", { name: "ZIP code" })).toHaveValue("10002");
    expect(screen.getByRole("button", { name: "State, New York" })).toHaveTextContent(/New York/);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("anchors ZIP suggestions to ZIP and dismisses them with Escape", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ options: [{ city: "New York", state: "NY", zipCode: "10001" }] }) }));
    render(<Editor />);
    const zip = screen.getByRole("combobox", { name: "ZIP code" });
    fireEvent.focus(zip);
    fireEvent.change(zip, { target: { value: "100" } });
    const suggestions = await screen.findByRole("listbox");
    expect(zip.closest("label")?.parentElement).toContainElement(suggestions);
    fireEvent.keyDown(zip, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(zip).toHaveValue("100");
  });
});
