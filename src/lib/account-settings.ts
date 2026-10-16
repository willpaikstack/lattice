import type { PrismaClient } from "@prisma/client";
import { formatPhoneNumber, isValidBillingEmail, isValidPhoneNumber } from "./contact-format";
import { auth, currentUser } from "@clerk/nextjs/server";

import {
  defaultAccountSettings,
  type AccountAddress,
  type AccountSettingsSnapshot,
  type AccountSettingsField,
  type EmailVerificationStatus,
  type PaymentCard,
} from "./account-settings-shared";
import { clerkUserDisplayName } from "./clerk-user-profile";
import { getPrismaClient } from "./prisma";
import { getCurrentSession } from "./session";
import type { RequestContactSnapshot } from "./request-model";
import { getStripeClient, isStripeConfigured, stripePaymentMethodCardSnapshot } from "./stripe";

type StoredAccountDefaults = {
  billingSameAsShipping?: boolean;
  billingPhone?: string;
  shippingPhone?: string;
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
    phone: formatPhoneNumber(text(address.phone)),
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
    billingSameAsShipping: Boolean(settings.billingSameAsShipping),
    billingAddress: normalizeAddress(settings.billingSameAsShipping ? settings.shipping : settings.billingAddress),
    cards: settings.cards,
    companyName: text(settings.companyName) || defaultAccountSettings().companyName,
    email: text(settings.email),
    emailVerifiedAt: text(settings.emailVerifiedAt),
    emailVerificationStatus: settings.emailVerificationStatus,
    mfaEnabled: Boolean(settings.mfaEnabled),
    name: text(settings.name),
    passwordChangedAt: text(settings.passwordChangedAt),
    phone: formatPhoneNumber(text(settings.phone)),
    shipping: normalizeAddress(settings.shipping),
    stripeCustomerId: text(settings.stripeCustomerId),
    teamMembers: settings.teamMembers,
    avatarPreset: settings.avatarPreset ?? null,
    canCompleteInitialAddressOnboarding: Boolean(settings.canCompleteInitialAddressOnboarding),
    canManageCompany: Boolean(settings.canManageCompany),
    canManageCompanyDefaults: Boolean(settings.canManageCompanyDefaults),
    canEditPersonalProfile: settings.canEditPersonalProfile !== false,
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
    billingSameAsShipping: Boolean(stored.billingSameAsShipping),
    billingAddress: {
      phone: stored.billingPhone ?? "",
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
      phone: stored.shippingPhone ?? "",
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
    billingSameAsShipping: Boolean(normalized.billingSameAsShipping),
    billingPhone: normalized.billingAddress.phone ?? "",
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
    shippingPhone: normalized.shipping.phone ?? "",
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
  billingSameAsShipping?: boolean;
  billingPhone?: string;
  shippingPhone?: string;
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
      ...(session.user.supportAdmin ? { accountCreatedAt: "", emailVerifiedAt: "", emailVerificationStatus: "unavailable" as const } : identityDates),
      id: `user:${session.user.id}`,
      companyId: session.user.companyId,
      name: session.user.name,
      email: session.user.email,
      companyName: session.user.companyName ?? "",
      canCompleteInitialAddressOnboarding: session.user.customerRole === "admin",
      canManageCompany: session.user.role === "admin",
      canManageCompanyDefaults: session.user.role === "admin" || session.user.customerRole === "admin",
      canEditPersonalProfile: !session.user.supportAdmin,
      profileImageUrl: clerkUser?.hasImage && !session.user.supportAdmin ? text(clerkUser.imageUrl) : "",
      avatarPreset: !session.user.supportAdmin ? avatarPreset(clerkUser?.unsafeMetadata?.latticeAvatarPreset) : null,
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
    canManageCompanyDefaults: false,
    canEditPersonalProfile: true,
    canCompleteInitialAddressOnboarding: false,
    profileImageUrl: clerkUser?.hasImage ? text(clerkUser.imageUrl) : "",
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
    billingSameAsShipping: Boolean(company.billingSameAsShipping),
    billingAddress: {
      phone: company.billingPhone ?? "",
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
      phone: company.shippingPhone ?? "",
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
    billingPhone: normalized.billingAddress.phone ?? "",
    billingAddress1: normalized.billingAddress.address1,
    billingAddress2: normalized.billingAddress.address2,
    billingCity: normalized.billingAddress.city,
    billingCompany: normalized.billingAddress.company,
    billingEmail: normalized.billing.email,
    billingInvoiceRoutingNotes: normalized.billing.invoiceRoutingNotes,
    billingName: normalized.billingAddress.name,
    billingState: normalized.billingAddress.state,
    billingZipCode: normalized.billingAddress.zipCode,
    shippingPhone: normalized.shipping.phone ?? "",
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
    canManageCompanyDefaults: context.canManageCompanyDefaults,
    canEditPersonalProfile: context.canEditPersonalProfile,
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

  if (stored) {
    const legacyDefaults = companyDefaultsFromAccountSettings(userDefaults);
    if (Object.values(legacyDefaults).some(Boolean)) {
      // Once Company owns these values, remove the old per-user copy so it
      // cannot later revive stale addresses during legacy adoption.
      const cleared = Object.fromEntries(Object.keys(legacyDefaults).map((key) => [key, ""]));
      await client.accountDefaults.upsert({ where: { id: context.id }, create: { ...stored, ...cleared }, update: cleared });
    }
  }
  return accountSettingsWithCompanyDefaults(userDefaults, company);
}

export async function saveAccountSettings(settings: AccountSettingsSnapshot, field: AccountSettingsField | "stripeCustomerId") {
  const context = await settingsContext();
  if (!["name", "phone", "companyName", "shipping", "billingAddress", "billing", "stripeCustomerId"].includes(field)) {
    throw new Error("Choose a valid account setting to update.");
  }
  if (!context.canEditPersonalProfile && ["name", "phone"].includes(field)) {
    throw new Error("Personal profiles cannot be edited in a support session.");
  }
  const normalized = forUser(normalizeAccountSettings(settings), context);
  if (field === "phone" && !isValidPhoneNumber(normalized.phone)) {
    throw new Error("Enter a complete phone number, including the country code for international numbers.");
  }
  if (field === "shipping" || field === "billingAddress") {
    const address = normalized[field];
    if (!isValidPhoneNumber(address.phone ?? "")) throw new Error("Enter a complete phone number for this address.");
    if (!hasRequiredAddressFields(address)) throw new Error("Name, company, address, city, state, and ZIP code are required.");
    if (Object.values(address).some((value) => value.length > 200 || /[\u0000-\u001f\u007f]/.test(value))) throw new Error("Address fields must be 200 characters or fewer and contain no control characters.");
  }
  if (field === "billing" && (!isValidBillingEmail(normalized.billing.email) || normalized.billing.email.length > 254 || normalized.billing.invoiceRoutingNotes.length > 2000)) {
    throw new Error("Enter a valid billing email and invoice notes of 2,000 characters or fewer.");
  }
  const companyName = text(settings.companyName);
  if (field === "companyName" && (!companyName || companyName.length > 200)) throw new Error("Enter a company name with 200 characters or fewer.");
  if (field === "companyName" && !context.canManageCompany) throw new Error("Only a Lattice Admin can change the company name.");
  const companyField = ["shipping", "billingAddress", "billing", "companyName"].includes(field);
  if (companyField && field !== "companyName" && !context.canManageCompanyDefaults) throw new Error("Only a Customer Admin or Lattice Admin can change company defaults.");

  const client = await prisma();
  const allCompanyDefaults = companyDefaultsFromAccountSettings(normalized);
  const prefix = field === "shipping" ? "shipping" : field === "billingAddress" ? "billing" : "";
  const companyUpdate: Record<string, string | boolean> = field === "companyName" ? { name: companyName }
    : field === "billing" ? { billingEmail: normalized.billing.email, billingInvoiceRoutingNotes: normalized.billing.invoiceRoutingNotes }
    : Object.fromEntries(Object.entries(allCompanyDefaults).filter(([key]) => prefix && key.startsWith(prefix) && key !== "billingEmail" && key !== "billingInvoiceRoutingNotes" && key !== "billingSameAsShipping"));
  if (field === "billingAddress") companyUpdate.billingSameAsShipping = Boolean(settings.billingSameAsShipping);
  const personalUpdate = field === "phone" ? { phone: normalized.phone } : field === "stripeCustomerId" ? { stripeCustomerId: normalized.stripeCustomerId } : field === "name" ? { name: normalized.name } : {};

  if (!context.companyId) {
    const database = await getPrismaClient() as PrismaClient;
    await database.$transaction(async (tx) => {
      const stored = await tx.accountDefaults.upsert({
        where: { id: context.id }, update: {},
        create: { ...toStoredAccountDefaults(emptyForUser(context)), id: context.id },
      });
      if ((field === "shipping" && stored.billingSameAsShipping) || (field === "billingAddress" && settings.billingSameAsShipping)) {
        const source = field === "shipping" ? normalized.shipping : fromStoredAccountDefaults(stored).shipping;
        if (!hasRequiredAddressFields(source)) throw new Error("Save a complete shipping address before using it for billing.");
        for (const [key, value] of Object.entries(source)) companyUpdate[`billing${key[0].toUpperCase()}${key.slice(1)}`] = value;
      }
      await tx.accountDefaults.update({ where: { id: context.id }, data: {
        ...personalUpdate, ...(companyField ? field === "companyName" ? { companyName } : companyUpdate : {}),
      } });
    });
  } else if (companyField && field !== "shipping" && field !== "billingAddress") {
    await client.company.update({ where: { id: context.companyId }, data: companyUpdate });
  } else if (companyField) {
    // Update only the edited group. A stale profile page must never overwrite
    // another member's saved shipping, billing or personal changes.
    const database = await getPrismaClient() as PrismaClient;
    await database.$transaction(async (tx) => {
      // Serialize shipping and billing changes so linked addresses cannot diverge.
      await tx.$queryRaw`SELECT id FROM "Company" WHERE id = ${context.companyId} FOR UPDATE`;
      const current = await tx.company.findUniqueOrThrow({ where: { id: context.companyId! } });
      const linked = field === "billingAddress" ? Boolean(settings.billingSameAsShipping) : current.billingSameAsShipping;
      if (linked && (field === "shipping" || field === "billingAddress")) {
        const shipping = field === "shipping" ? normalized.shipping : {
          phone: current.shippingPhone, name: current.shippingName, company: current.shippingCompany,
          address1: current.shippingAddress1, address2: current.shippingAddress2,
          city: current.shippingCity, state: current.shippingState, zipCode: current.shippingZipCode,
        };
        if (!hasRequiredAddressFields(shipping)) throw new Error("Save a complete shipping address before using it for billing.");
        for (const [key, value] of Object.entries(shipping)) {
          companyUpdate[`billing${key[0].toUpperCase()}${key.slice(1)}`] = value;
        }
      }
      await tx.company.update({ where: { id: context.companyId! }, data: companyUpdate });
    });
  } else {
    const blankPersonal = { ...toStoredAccountDefaults(emptyForUser(context)), ...Object.fromEntries(Object.keys(allCompanyDefaults).map((key) => [key, ""])) };
    await client.accountDefaults.upsert({
      create: { ...blankPersonal, ...personalUpdate, id: context.id },
      update: personalUpdate,
      where: { id: context.id },
    });
  }
  return getAccountSettings();
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
  const nextSettings = await saveAccountSettings({ ...settings, stripeCustomerId: customer.id }, "stripeCustomerId");

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
    shipToPhone: settings.shipping.phone || settings.phone,
    shipToState: settings.shipping.state,
    shipToZipCode: settings.shipping.zipCode,
  };
}
