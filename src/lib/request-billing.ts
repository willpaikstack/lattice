import type { AccountAddress, AccountSettingsSnapshot, BillingContact } from "./account-settings-shared";

export type RequestBillingSnapshot = {
  address: AccountAddress;
  contact: BillingContact;
};

/** Copy only the billing fields belonging to a request; never consult live defaults on read. */
export function readRequestBillingSnapshot(value: unknown): RequestBillingSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (!candidate.address || typeof candidate.address !== "object" || !candidate.contact || typeof candidate.contact !== "object") return null;
  const address = candidate.address as Record<string, unknown>;
  const contact = candidate.contact as Record<string, unknown>;
  const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
  return {
    address: { ...(text(address.phone) ? { phone: text(address.phone) } : {}), address1: text(address.address1), address2: text(address.address2), city: text(address.city), company: text(address.company), name: text(address.name), state: text(address.state), zipCode: text(address.zipCode) },
    contact: { email: text(contact.email), invoiceRoutingNotes: text(contact.invoiceRoutingNotes) },
  };
}

export function billingSnapshotFromAccountSettings(settings: AccountSettingsSnapshot): RequestBillingSnapshot {
  return readRequestBillingSnapshot({ address: settings.billingAddress ?? {}, contact: settings.billing ?? {} })!;
}

export function requestBillToLines(request: { billingSnapshot?: RequestBillingSnapshot | null; buyerCompany: string; requesterName: string; requesterEmail: string; requesterPhone: string }) {
  const snapshot = request.billingSnapshot;
  if (!snapshot) return [request.requesterName, request.buyerCompany, request.requesterEmail, request.requesterPhone].filter(Boolean);
  const address = snapshot.address;
  return [address.name || request.requesterName, address.company || request.buyerCompany, address.address1, address.address2, [address.city, [address.state, address.zipCode].filter(Boolean).join(" ")].filter(Boolean).join(", "), snapshot.contact.email || request.requesterEmail, address.phone ?? ""].filter(Boolean);
}
