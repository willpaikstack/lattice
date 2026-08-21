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

/**
 * Clerk owns email verification. Keep its state separate from the timestamp
 * so a temporary Clerk API outage is never presented as a verified email.
 */
export type EmailVerificationStatus =
  | "verified"
  | "verification-date-unavailable"
  | "not-verified"
  | "unavailable";

export type AccountSettingsSnapshot = {
  accountCreatedAt: string;
  billing: BillingContact;
  billingAddress: AccountAddress;
  cards: PaymentCard[];
  companyName: string;
  email: string;
  emailVerifiedAt: string;
  emailVerificationStatus: EmailVerificationStatus;
  mfaEnabled: boolean;
  name: string;
  passwordChangedAt: string;
  phone: string;
  shipping: AccountAddress;
  stripeCustomerId: string;
  teamMembers: TeamMember[];
  /** Display-only identity fields sourced from Clerk/workspace membership. */
  canCompleteInitialAddressOnboarding?: boolean;
  canManageCompany?: boolean;
  profileImageUrl?: string;
  avatarPreset?: { colorId: string; presetId: string } | null;
  roleLabel?: string;
};

export const accountSettingsStorageKey = "lattice.account-settings.v1";

export const initialTeamMembers: TeamMember[] = [];

export const initialCards: PaymentCard[] = [];

export const initialShippingAddress: AccountAddress = { address1: "", address2: "", city: "", company: "", name: "", state: "", zipCode: "" };

export const initialBillingAddress: AccountAddress = { address1: "", address2: "", city: "", company: "", name: "", state: "", zipCode: "" };

export const initialBillingContact: BillingContact = { email: "", invoiceRoutingNotes: "" };

export function defaultAccountSettings(): AccountSettingsSnapshot {
  return {
    accountCreatedAt: "",
    billing: initialBillingContact,
    billingAddress: initialBillingAddress,
    cards: initialCards,
    companyName: "",
    email: "",
    emailVerifiedAt: "",
    emailVerificationStatus: "unavailable",
    mfaEnabled: false,
    name: "",
    passwordChangedAt: "",
    phone: "",
    shipping: initialShippingAddress,
    stripeCustomerId: "",
    teamMembers: initialTeamMembers,
  };
}
