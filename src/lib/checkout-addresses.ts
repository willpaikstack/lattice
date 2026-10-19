import type { AccountAddress } from "./account-settings-shared";
import { formatPhoneNumber, isValidPhoneNumber } from "./contact-format";
import { usStates } from "./us-address-options";

export const checkoutAddressFields = ["name", "company", "phone", "address1", "address2", "city", "state", "zipCode"] as const;

export function completeCheckoutAddress(address: AccountAddress) {
  return Boolean(address.name.trim() && address.company.trim() && address.address1.trim() && address.city.trim()
    && usStates.some(([code, name]) => [code.toLowerCase(), name.toLowerCase()].includes(address.state.trim().toLowerCase()))
    && /^\d{5}(-\d{4})?$/.test(address.zipCode.trim()) && isValidPhoneNumber(address.phone ?? ""));
}

export function checkoutAddressFromForm(form: FormData, prefix: "shipTo" | "billTo"): AccountAddress {
  const value = Object.fromEntries(checkoutAddressFields.map(key => {
    const entry = form.get(`${prefix}${key[0].toUpperCase()}${key.slice(1)}`);
    return [key, typeof entry === "string" ? entry.trim() : ""];
  })) as AccountAddress;
  if (Object.values(value).some(text => text.length > 200 || /[\u0000-\u001f\u007f]/.test(text))) throw new Error("Address fields must be 200 characters or fewer and contain no control characters.");
  if (!completeCheckoutAddress(value)) throw new Error(`Complete the ${prefix === "shipTo" ? "shipping" : "billing"} address, including name, company, city, state and ZIP code. Phone is optional but must be complete if entered.`);
  value.state = usStates.find(([code, name]) => [code.toLowerCase(), name.toLowerCase()].includes(value.state.toLowerCase()))![0];
  value.phone = formatPhoneNumber(value.phone ?? "");
  return value;
}
