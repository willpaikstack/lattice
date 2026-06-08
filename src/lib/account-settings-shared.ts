export type AccountAddress = {
  address1: string;
  address2: string;
  city: string;
  company: string;
  name: string;
  state: string;
  zipCode: string;
};

export type BillingContact = {
  email: string;
  invoiceRoutingNotes: string;
};

export type TeamMember = {
  email: string;
  name: string;
  role: "Admin" | "Buyer" | "Reviewer";
  status: "Active" | "Invited" | "Suspended";
};

export type PaymentCard = {
  brand: string;
  expires: string;
  holder: string;
  id: string;
  last4: string;
};

export type AccountSettingsSnapshot = {
  billing: BillingContact;
  billingAddress: AccountAddress;
  cards: PaymentCard[];
  companyName: string;
  email: string;
  mfaEnabled: boolean;
  name: string;
  passwordChangedAt: string;
  phone: string;
  shipping: AccountAddress;
  teamMembers: TeamMember[];
};

export const accountSettingsStorageKey = "lattice.account-settings.v1";

export const initialTeamMembers: TeamMember[] = [
  { email: "william.paik@amogy.co", name: "William Paik", role: "Admin", status: "Active" },
  { email: "procurement@amogy.co", name: "Procurement Team", role: "Buyer", status: "Active" },
  { email: "quality@amogy.co", name: "Quality Team", role: "Reviewer", status: "Invited" },
];

export const initialCards: PaymentCard[] = [
  { brand: "Visa", expires: "08/2028", holder: "William Paik", id: "card-7329", last4: "7329" },
  { brand: "Visa", expires: "11/2027", holder: "Amogy Card", id: "card-9682", last4: "9682" },
];

export const initialShippingAddress: AccountAddress = {
  address1: "19 Morris Ave",
  address2: "",
  city: "Brooklyn",
  company: "Amogy",
  name: "William Paik",
  state: "NY",
  zipCode: "11205",
};

export const initialBillingAddress: AccountAddress = {
  address1: "19 Morris Ave",
  address2: "",
  city: "Brooklyn",
  company: "Amogy",
  name: "William Paik",
  state: "NY",
  zipCode: "11205",
};

export const initialBillingContact: BillingContact = {
  email: "procurement@amogy.co",
  invoiceRoutingNotes: "Route invoices to AP after PO match.",
};

export function defaultAccountSettings(): AccountSettingsSnapshot {
  return {
    billing: initialBillingContact,
    billingAddress: initialBillingAddress,
    cards: initialCards,
    companyName: "Amogy",
    email: "william.paik@amogy.co",
    mfaEnabled: true,
    name: "William Paik",
    passwordChangedAt: "May 12, 2026",
    phone: "+1 (310) 617-4533",
    shipping: initialShippingAddress,
    teamMembers: initialTeamMembers,
  };
}
