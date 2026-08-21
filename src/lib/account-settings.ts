import { auth, currentUser } from "@clerk/nextjs/server";

import {
  defaultAccountSettings,
  type AccountAddress,
  type AccountSettingsSnapshot,
  type EmailVerificationStatus,
  type PaymentCard,
} from "./account-settings-shared";
import { clerkUserDisplayName } from "./clerk-user-profile";
import { getPrismaClient } from "./prisma";
import { getCurrentSession } from "./session";
import type { RequestContactSnapshot } from "./request-model";
import { getStripeClient, isStripeConfigured, stripePaymentMethodCardSnapshot } from "./stripe";

type StoredAccountDefaults = {
  billingAddress1: string;
  billingAddress2: string;
  billingCity: string;
  billingCompany: string;
  billingEmail: string;
  billingInvoiceRoutingNotes: string;
  billingName: string;
  billingState: string;
  billingZipCode: string;
  companyName?: string;
  email: string;
  id: string;
  mfaEnabled: boolean;
  name: string;
  passwordChangedAt: string;
  phone: string;
  stripeCustomerId?: string;
  shippingAddress1: string;
  shippingAddress2: string;
  shippingCity: string;
  shippingCompany: string;
  shippingName: string;
  shippingState: string;
  shippingZipCode: string;
};

const legacyAccountDefaultsId = "workspace";

function text(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function avatarPreset(value: unknown): { colorId: string; presetId: string } | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  const colorId = typeof candidate.colorId === "string" ? candidate.colorId.trim() : "";
  const presetId = typeof candidate.presetId === "string" ? candidate.presetId.trim() : "";
  return colorId && presetId ? { colorId, presetId } : null;
}

function displayIdentityDate(value: Date | number | string | null | undefined) {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}

type ClerkUserResponse = {
  email_addresses?: Array<{
    id?: string;
    verification?: { status?: string | null; verified_at_client?: string | null } | null;
  }>;
};

type ClerkEmailVerification = {
  status: EmailVerificationStatus;
  verifiedAt: string;
};

async function clerkEmailVerification(
  userId: string | null,
  primaryEmailAddressId: string | undefined,
): Promise<ClerkEmailVerification> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!userId || !primaryEmailAddressId || !secretKey) {
    return { status: "unavailable", verifiedAt: "" };
  }

  try {
    // The Clerk backend SDK models a verification's status but omits its
    // `verified_at_client` timestamp. Read the documented user payload so the
    // customer portal can show the genuine verification date rather than a
    // seeded date or an inferred account-created date.
    const response = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(userId)}`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (!response.ok) return { status: "unavailable", verifiedAt: "" };

    const user = await response.json() as ClerkUserResponse;
    const primaryEmail = user.email_addresses?.find((email) => email.id === primaryEmailAddressId);
    if (primaryEmail?.verification?.status !== "verified") {
      return { status: "not-verified", verifiedAt: "" };
    }

    const verifiedAt = displayIdentityDate(primaryEmail.verification.verified_at_client);
    return {
      status: verifiedAt ? "verified" : "verification-date-unavailable",
      verifiedAt,
    };
  } catch {
    return { status: "unavailable", verifiedAt: "" };
  }
}

function normalizeAddress(address: AccountAddress): AccountAddress {
  return {
    address1: text(address.address1),
    address2: text(address.address2),
    city: text(address.city),
    company: text(address.company),
    name: text(address.name),
    state: text(address.state),
    zipCode: text(address.zipCode),
  };
}

function hasRequiredAddressFields(address: AccountAddress) {
  return Boolean(
    text(address.name) &&
      text(address.company) &&
      text(address.address1) &&
      text(address.city) &&
      text(address.state) &&
      text(address.zipCode),
  );
}

/**
 * A new customer cannot use the workspace until their operational shipping
 * and billing destinations are saved. These defaults are shared by everyone
 * in the customer's company.
 */
export function hasCompletedAddressOnboarding(settings: AccountSettingsSnapshot) {
  return hasRequiredAddressFields(settings.shipping) && hasRequiredAddressFields(settings.billingAddress);
}

export function normalizeAccountSettings(settings: AccountSettingsSnapshot): AccountSettingsSnapshot {
  return {
    accountCreatedAt: text(settings.accountCreatedAt),
    addressOnboardingDeferred: Boolean(settings.addressOnboardingDeferred),
    billing: {
      email: text(settings.billing.email),
      invoiceRoutingNotes: text(settings.billing.invoiceRoutingNotes),
    },
    billingAddress: normalizeAddress(settings.billingAddress),
    cards: settings.cards,
    companyName: text(settings.companyName) || defaultAccountSettings().companyName,
    email: text(settings.email),
    emailVerifiedAt: text(settings.emailVerifiedAt),
    emailVerificationStatus: settings.emailVerificationStatus,
    mfaEnabled: Boolean(settings.mfaEnabled),
    name: text(settings.name),
    passwordChangedAt: text(settings.passwordChangedAt),
    phone: text(settings.phone),
    shipping: normalizeAddress(settings.shipping),
    stripeCustomerId: text(settings.stripeCustomerId),
    teamMembers: settings.teamMembers,
    avatarPreset: settings.avatarPreset ?? null,
    canCompleteInitialAddressOnboarding: Boolean(settings.canCompleteInitialAddressOnboarding),
    canManageCompany: Boolean(settings.canManageCompany),
    profileImageUrl: text(settings.profileImageUrl),
    roleLabel: text(settings.roleLabel),
  };
}

function fromStoredAccountDefaults(stored: StoredAccountDefaults): AccountSettingsSnapshot {
  const defaults = defaultAccountSettings();

  return normalizeAccountSettings({
    ...defaults,
    billing: {
      email: stored.billingEmail,
      invoiceRoutingNotes: stored.billingInvoiceRoutingNotes,
    },
    billingAddress: {
      address1: stored.billingAddress1,
      address2: stored.billingAddress2,
      city: stored.billingCity,
      company: stored.billingCompany,
      name: stored.billingName,
      state: stored.billingState,
      zipCode: stored.billingZipCode,
    },
    email: stored.email,
    companyName: stored.companyName || defaults.companyName,
    mfaEnabled: stored.mfaEnabled,
    name: stored.name,
    passwordChangedAt: stored.passwordChangedAt,
    phone: stored.phone,
    stripeCustomerId: stored.stripeCustomerId ?? "",
    shipping: {
      address1: stored.shippingAddress1,
      address2: stored.shippingAddress2,
      city: stored.shippingCity,
      company: stored.shippingCompany,
      name: stored.shippingName,
      state: stored.shippingState,
      zipCode: stored.shippingZipCode,
    },
  });
}

function toStoredAccountDefaults(settings: AccountSettingsSnapshot) {
  const normalized = normalizeAccountSettings(settings);

  return {
    billingAddress1: normalized.billingAddress.address1,
    billingAddress2: normalized.billingAddress.address2,
    billingCity: normalized.billingAddress.city,
    billingCompany: normalized.billingAddress.company,
    billingEmail: normalized.billing.email,
    billingInvoiceRoutingNotes: normalized.billing.invoiceRoutingNotes,
    billingName: normalized.billingAddress.name,
    billingState: normalized.billingAddress.state,
    billingZipCode: normalized.billingAddress.zipCode,
    companyName: normalized.companyName,
    email: normalized.email,
    id: legacyAccountDefaultsId,
    mfaEnabled: normalized.mfaEnabled,
    name: normalized.name,
    passwordChangedAt: normalized.passwordChangedAt,
    phone: normalized.phone,
    stripeCustomerId: normalized.stripeCustomerId,
    shippingAddress1: normalized.shipping.address1,
    shippingAddress2: normalized.shipping.address2,
    shippingCity: normalized.shipping.city,
    shippingCompany: normalized.shipping.company,
    shippingName: normalized.shipping.name,
    shippingState: normalized.shipping.state,
    shippingZipCode: normalized.shipping.zipCode,
  };
}

async function prisma() {
  return (await getPrismaClient()) as {
    accountDefaults: {
      findUnique: (args: unknown) => Promise<StoredAccountDefaults | null>;
      upsert: (args: unknown) => Promise<StoredAccountDefaults>;
    };
    company: {
      findUnique: (args: unknown) => Promise<StoredCompanyDefaults | null>;
      update: (args: unknown) => Promise<StoredCompanyDefaults>;
    };
    $transaction: (operations: Promise<unknown>[]) => Promise<unknown>;
  };
}

type StoredCompanyDefaults = {
  addressOnboardingDeferredAt: Date | null;
  billingAddress1: string;
  billingAddress2: string;
  billingCity: string;
  billingCompany: string;
  billingEmail: string;
  billingInvoiceRoutingNotes: string;
  billingName: string;
  billingState: string;
  billingZipCode: string;
  id: string;
  name: string;
  shippingAddress1: string;
  shippingAddress2: string;
  shippingCity: string;
  shippingCompany: string;
  shippingName: string;
  shippingState: string;
  shippingZipCode: string;
};

async function settingsContext() {
  const { userId } = await auth();
  const clerkUser = await currentUser();
  const emailVerification = await clerkEmailVerification(userId, clerkUser?.primaryEmailAddress?.id);
  const identityDates = {
    accountCreatedAt: displayIdentityDate(clerkUser?.createdAt),
    emailVerifiedAt: emailVerification.verifiedAt,
    emailVerificationStatus: emailVerification.status,
  };
  const session = await getCurrentSession();
  if (session) {
    return {
      ...identityDates,
      id: `user:${session.user.id}`,
      companyId: session.user.companyId,
      name: session.user.name,
      email: session.user.email,
      companyName: session.user.companyName ?? "",
      canCompleteInitialAddressOnboarding: session.user.customerRole === "admin",
      canManageCompany: session.user.role === "admin",
      profileImageUrl: text(clerkUser?.imageUrl),
      avatarPreset: avatarPreset(clerkUser?.unsafeMetadata?.latticeAvatarPreset),
      roleLabel: session.user.role === "admin" ? "Lattice Admin" : session.user.customerRole === "admin" ? "Customer Admin" : "Customer Member",
    };
  }

  const email = clerkUser?.primaryEmailAddress?.emailAddress?.trim() ?? "";
  if (!userId || !email) throw new Error("Authentication required.");

  return {
    ...identityDates,
    companyName: "",
    companyId: null,
    email,
    id: `clerk:${userId}`,
    name: clerkUserDisplayName(clerkUser) || email.split("@", 1)[0] || "Account",
    canManageCompany: false,
    canCompleteInitialAddressOnboarding: false,
    profileImageUrl: text(clerkUser?.imageUrl),
    avatarPreset: avatarPreset(clerkUser?.unsafeMetadata?.latticeAvatarPreset),
    roleLabel: "Customer Member",
  };
}

function accountSettingsWithCompanyDefaults(
  userDefaults: AccountSettingsSnapshot,
  company: StoredCompanyDefaults,
) {
  return normalizeAccountSettings({
    ...userDefaults,
    addressOnboardingDeferred: Boolean(company.addressOnboardingDeferredAt),
    billing: {
      email: company.billingEmail,
      invoiceRoutingNotes: company.billingInvoiceRoutingNotes,
    },
    billingAddress: {
      address1: company.billingAddress1,
      address2: company.billingAddress2,
      city: company.billingCity,
      company: company.billingCompany,
      name: company.billingName,
      state: company.billingState,
      zipCode: company.billingZipCode,
    },
    companyName: company.name,
    shipping: {
      address1: company.shippingAddress1,
      address2: company.shippingAddress2,
      city: company.shippingCity,
      company: company.shippingCompany,
      name: company.shippingName,
      state: company.shippingState,
      zipCode: company.shippingZipCode,
    },
  });
}

function companyDefaultsFromAccountSettings(settings: AccountSettingsSnapshot) {
  const normalized = normalizeAccountSettings(settings);

  return {
    billingAddress1: normalized.billingAddress.address1,
    billingAddress2: normalized.billingAddress.address2,
    billingCity: normalized.billingAddress.city,
    billingCompany: normalized.billingAddress.company,
    billingEmail: normalized.billing.email,
    billingInvoiceRoutingNotes: normalized.billing.invoiceRoutingNotes,
    billingName: normalized.billingAddress.name,
    billingState: normalized.billingAddress.state,
    billingZipCode: normalized.billingAddress.zipCode,
    shippingAddress1: normalized.shipping.address1,
    shippingAddress2: normalized.shipping.address2,
    shippingCity: normalized.shipping.city,
    shippingCompany: normalized.shipping.company,
    shippingName: normalized.shipping.name,
    shippingState: normalized.shipping.state,
    shippingZipCode: normalized.shipping.zipCode,
  };
}

function companyDefaultsAreEmpty(company: StoredCompanyDefaults) {
  return ![
    company.billingAddress1,
    company.billingEmail,
    company.billingName,
    company.billingZipCode,
    company.shippingAddress1,
    company.shippingName,
    company.shippingZipCode,
  ].some(text);
}

function companyAddressOnboardingIsComplete(company: StoredCompanyDefaults) {
  return hasRequiredAddressFields({
    address1: company.shippingAddress1,
    address2: company.shippingAddress2,
    city: company.shippingCity,
    company: company.shippingCompany,
    name: company.shippingName,
    state: company.shippingState,
    zipCode: company.shippingZipCode,
  }) && hasRequiredAddressFields({
    address1: company.billingAddress1,
    address2: company.billingAddress2,
    city: company.billingCity,
    company: company.billingCompany,
    name: company.billingName,
    state: company.billingState,
    zipCode: company.billingZipCode,
  });
}

function forUser(defaults: AccountSettingsSnapshot, context: Awaited<ReturnType<typeof settingsContext>>) {
  return normalizeAccountSettings({
    ...defaults,
    accountCreatedAt: context.accountCreatedAt,
    companyName: context.companyName || defaults.companyName,
    email: context.email,
    emailVerifiedAt: context.emailVerifiedAt,
    emailVerificationStatus: context.emailVerificationStatus,
    name: context.name,
    avatarPreset: context.avatarPreset,
    canCompleteInitialAddressOnboarding: context.canCompleteInitialAddressOnboarding,
    canManageCompany: context.canManageCompany,
    profileImageUrl: context.profileImageUrl,
    roleLabel: context.roleLabel,
  });
}

function emptyForUser(context: Awaited<ReturnType<typeof settingsContext>>) {
  const defaults = defaultAccountSettings();
  return forUser({
    ...defaults,
    billing: { email: "", invoiceRoutingNotes: "" },
    billingAddress: { address1: "", address2: "", city: "", company: context.companyName, name: "", state: "", zipCode: "" },
    companyName: context.companyName,
    emailVerificationStatus: context.emailVerificationStatus,
    mfaEnabled: false,
    passwordChangedAt: "",
    phone: "",
    shipping: { address1: "", address2: "", city: "", company: context.companyName, name: "", state: "", zipCode: "" },
    stripeCustomerId: "",
    teamMembers: [],
  }, context);
}

export async function getAccountSettings() {
  const context = await settingsContext();
  const client = await prisma();
  const stored = await client.accountDefaults.findUnique({ where: { id: context.id } });
  const userDefaults = stored ? forUser(fromStoredAccountDefaults(stored), context) : emptyForUser(context);

  if (!context.companyId) {
    return userDefaults;
  }

  let company = await client.company.findUnique({ where: { id: context.companyId } });
  if (!company) throw new Error("Your company record could not be found.");

  // Existing account defaults were previously user-scoped. Adopt the first
  // populated record into the company once, then use only the company record.
  if (stored && companyDefaultsAreEmpty(company)) {
    company = await client.company.update({
      where: { id: context.companyId },
      data: companyDefaultsFromAccountSettings(userDefaults),
    });
  }

  return accountSettingsWithCompanyDefaults(userDefaults, company);
}

export async function saveAccountSettings(settings: AccountSettingsSnapshot) {
  const context = await settingsContext();
  const requestedCompanyName = text(settings.companyName);
  const normalized = forUser(normalizeAccountSettings(settings), context);
  const stored = toStoredAccountDefaults(normalized);
  stored.id = context.id;
  const client = await prisma();

  if (!context.companyId) {
    await client.accountDefaults.upsert({
      create: stored,
      update: stored,
      where: { id: context.id },
    });
    return normalized;
  }

  const currentCompany = await client.company.findUnique({ where: { id: context.companyId } });
  if (!currentCompany) throw new Error("Your company record could not be found.");
  const requestedCompanyDefaults = companyDefaultsFromAccountSettings(normalized);
  const currentCompanyDefaults = companyDefaultsFromAccountSettings(accountSettingsWithCompanyDefaults(normalized, currentCompany));
  const changingCompany = requestedCompanyName && requestedCompanyName !== currentCompany.name;
  const changingDefaults = JSON.stringify(requestedCompanyDefaults) !== JSON.stringify(currentCompanyDefaults);
  // A Customer Admin may complete the one-time shipping/billing onboarding
  // even when Lattice prefilled part of the company record. Once both
  // addresses are complete, commercial defaults remain Lattice Admin-only.
  const canCompleteInitialAddresses = context.canCompleteInitialAddressOnboarding && !companyAddressOnboardingIsComplete(currentCompany);
  if (!context.canManageCompany && changingCompany) {
    throw new Error("Only a Lattice Admin can change the company name.");
  }
  if (!context.canManageCompany && changingDefaults && !canCompleteInitialAddresses) {
    throw new Error("Only a Lattice Admin can change company defaults.");
  }

  // Shipping and billing values are company-owned. Keep the legacy user
  // columns empty after moving them to Company so they cannot become a second
  // source of truth.
  Object.assign(stored, {
    billingAddress1: "",
    billingAddress2: "",
    billingCity: "",
    billingCompany: "",
    billingEmail: "",
    billingInvoiceRoutingNotes: "",
    billingName: "",
    billingState: "",
    billingZipCode: "",
    shippingAddress1: "",
    shippingAddress2: "",
    shippingCity: "",
    shippingCompany: "",
    shippingName: "",
    shippingState: "",
    shippingZipCode: "",
  });

  await client.$transaction([
    client.accountDefaults.upsert({
      create: stored,
      update: stored,
      where: { id: context.id },
    }),
    client.company.update({
      where: { id: context.companyId },
      data: {
        ...requestedCompanyDefaults,
        addressOnboardingDeferredAt: hasCompletedAddressOnboarding(normalized) ? null : currentCompany.addressOnboardingDeferredAt,
        ...(requestedCompanyName && (context.canManageCompany || companyDefaultsAreEmpty(currentCompany)) ? { name: requestedCompanyName } : {}),
      },
    }),
  ]);

  const company = await client.company.findUnique({ where: { id: context.companyId } });
  if (!company) throw new Error("Your company record could not be found.");

  return accountSettingsWithCompanyDefaults(normalized, company);
}

/**
 * Lets the provisioned Customer Admin defer the shared-address task without
 * weakening the later server-side authorization to complete it.
 */
export async function deferInitialAddressOnboarding() {
  const context = await settingsContext();
  if (!context.companyId || !context.canCompleteInitialAddressOnboarding) {
    throw new Error("Only the Customer Admin can defer initial address setup.");
  }

  const client = await prisma();
  const company = await client.company.findUnique({ where: { id: context.companyId } });
  if (!company) throw new Error("Your company record could not be found.");
  if (companyAddressOnboardingIsComplete(company)) {
    return;
  }

  await client.company.update({
    where: { id: context.companyId },
    data: { addressOnboardingDeferredAt: new Date() },
  });
}

export async function ensureStripeCustomerForAccount() {
  const context = await settingsContext();
  const settings = await getAccountSettings();

  if (settings.stripeCustomerId) {
    return { customerId: settings.stripeCustomerId, settings };
  }

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: settings.email || undefined,
    name: settings.companyName || settings.name || undefined,
    metadata: {
      accountDefaultsId: context.id,
      companyName: settings.companyName,
    },
  });
  const nextSettings = await saveAccountSettings({ ...settings, stripeCustomerId: customer.id });

  return { customerId: customer.id, settings: nextSettings };
}

export async function listStripePaymentCards(): Promise<PaymentCard[]> {
  if (!isStripeConfigured()) {
    return [];
  }

  const { customerId } = await ensureStripeCustomerForAccount();
  const stripe = getStripeClient();
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
  });

  return paymentMethods.data
    .map(stripePaymentMethodCardSnapshot)
    .filter((card): card is PaymentCard => Boolean(card));
}

export function contactSnapshotFromAccountSettings(settings: AccountSettingsSnapshot): RequestContactSnapshot {
  return {
    requesterEmail: settings.email,
    requesterPhone: settings.phone,
    shipToAddress1: settings.shipping.address1,
    shipToAddress2: settings.shipping.address2,
    shipToCity: settings.shipping.city,
    shipToCompany: settings.shipping.company,
    shipToName: settings.shipping.name || settings.name,
    shipToPhone: settings.phone,
    shipToState: settings.shipping.state,
    shipToZipCode: settings.shipping.zipCode,
  };
}
