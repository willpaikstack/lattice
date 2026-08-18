import { buildAdminCustomerSummaries } from "./admin-customers";
import { isMockDataMode } from "./data-mode";
import { listLocalRequests } from "./local-request-store";
import { getPrismaClient } from "./prisma";
import type { LatticeRequest, RequestStatus } from "./request-model";
import { mapStoredRequest, storedRequestInclude, type StoredRequest } from "./request-persistence";

export type CustomerProfileInput = {
  name: string;
  website: string;
  industry: string;
  primaryContactName: string;
  primaryContactEmail: string;
  billingEmail: string;
  customerTier: string;
  accountStatus: string;
  notes: string;
};

export type CustomerProfileIcon = {
  label: string;
  background: string;
  foreground: string;
};

export type CustomerProfile = CustomerProfileInput & {
  id: string;
  icon: CustomerProfileIcon;
  users: Array<{
    id: string;
    name: string;
    email: string;
    pendingEmail: string | null;
    role: "LATTICE_ADMIN" | "CUSTOMER_ADMIN" | "CUSTOMER_MEMBER";
    passwordChangedAt: string | null;
    passwordEnabled: boolean;
    mustChangePassword: boolean;
    temporaryPasswordExpiresAt: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  metrics: {
    totalRequests: number;
    activeQuoteRequests: number;
    placedOrders: number;
    blockedRequests: number;
    quotedValueCents: number;
    orderValueCents: number;
  };
  latestActivityAt: string;
  latestRequest: {
    id: string;
    title: string;
    status: RequestStatus;
    href: string;
  } | null;
  requests: LatticeRequest[];
  fabricationShops: Array<{
    name: string;
    country: string;
    quoteCount: number;
    selectedOrderCount: number;
  }>;
};

const customerIconPalettes: CustomerProfileIcon[] = [
  { label: "", background: "#fff6ee", foreground: "#7a4a22" },
  { label: "", background: "#eef6ff", foreground: "#245c8f" },
  { label: "", background: "#f2f7ec", foreground: "#3f6d2a" },
  { label: "", background: "#f6f0ff", foreground: "#5b3f8f" },
  { label: "", background: "#fff8d9", foreground: "#7a5b0a" },
  { label: "", background: "#eefaf6", foreground: "#1f6b58" },
  { label: "", background: "#f8eeee", foreground: "#8a3535" },
  { label: "", background: "#eff1f5", foreground: "#475569" },
];

function hashText(value: string) {
  return [...value].reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0, 0);
}

export function customerProfileIcon(name: string): CustomerProfileIcon {
  const words = name
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .split(" ")
    .map((word) => word.trim())
    .filter(Boolean);
  const label = (words.length >= 2 ? `${words[0][0]}${words[1][0]}` : words[0]?.slice(0, 2) || "CU").toUpperCase();
  const palette = customerIconPalettes[hashText(name) % customerIconPalettes.length];

  return {
    ...palette,
    label,
  };
}

type StoredCompany = {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  billingEmail?: string;
  customerTier?: string;
  accountStatus?: string;
  notes?: string;
  users: Array<{
    id: string;
    name: string;
    email: string;
    pendingEmail: string | null;
    role: "LATTICE_ADMIN" | "CUSTOMER_ADMIN" | "CUSTOMER_MEMBER";
    passwordHash: string;
    passwordChangedAt: Date | null;
    mustChangePassword: boolean;
    temporaryPasswordExpiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  requests: StoredRequest[];
};

async function prisma() {
  return (await getPrismaClient()) as {
    company: {
      findMany: (args: unknown) => Promise<StoredCompany[]>;
      findFirst: (args: unknown) => Promise<StoredCompany | null>;
      findUnique: (args: unknown) => Promise<StoredCompany | null>;
      update: (args: unknown) => Promise<StoredCompany>;
    };
  };
}

async function withDemoFallback<T>(operation: () => Promise<T>, fallback: () => T | Promise<T>) {
  try {
    return await operation();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma is unavailable; using local customer profile fallback data.", error);
    }
    return fallback();
  }
}

function isArtificialRequestId(id: string) {
  return id.startsWith("demo_") || id.startsWith("fixture_");
}

function requestsForDataMode<T extends { id: string }>(requests: T[]) {
  return isMockDataMode() ? requests : requests.filter((request) => !isArtificialRequestId(request.id));
}

function profileFromStoredCompany(company: StoredCompany): CustomerProfile {
  const requests = requestsForDataMode(company.requests).map((request) =>
    mapStoredRequest({
      ...request,
      buyerCompanyId: request.buyerCompanyId ?? company.id,
      buyerCompany: request.buyerCompany ?? { id: company.id, name: company.name },
    }),
  );
  const summary = buildAdminCustomerSummaries(requests)[0];

  return {
    id: company.id,
    icon: customerProfileIcon(company.name),
    name: company.name,
    website: company.website ?? "",
    industry: company.industry ?? "",
    primaryContactName: company.primaryContactName ?? "",
    primaryContactEmail: company.primaryContactEmail ?? "",
    billingEmail: company.billingEmail ?? "",
    customerTier: company.customerTier ?? "Standard",
    accountStatus: company.accountStatus ?? "Active",
    notes: company.notes ?? "",
    users: company.users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      pendingEmail: user.pendingEmail,
      role: user.role,
      passwordChangedAt: user.passwordChangedAt?.toISOString() ?? null,
      passwordEnabled: Boolean(user.passwordHash),
      mustChangePassword: user.mustChangePassword,
      temporaryPasswordExpiresAt: user.temporaryPasswordExpiresAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    })),
    metrics: {
      totalRequests: summary?.totalRequests ?? 0,
      activeQuoteRequests: summary?.activeQuoteRequests ?? 0,
      placedOrders: summary?.placedOrders ?? 0,
      blockedRequests: summary?.blockedRequests ?? 0,
      quotedValueCents: summary?.quotedValueCents ?? 0,
      orderValueCents: summary?.orderValueCents ?? 0,
    },
    latestActivityAt: summary?.latestActivityAt ?? "",
    latestRequest: summary?.latestRequest ?? null,
    requests,
    fabricationShops: summary?.fabricationShops ?? [],
  };
}

function profilesFromRequests(requestsSource: LatticeRequest[]) {
  const realRequests = requestsForDataMode(requestsSource);

  return buildAdminCustomerSummaries(realRequests).map<CustomerProfile>((summary) => {
    const requests = realRequests
      .filter((request) => request.buyerCompany === summary.name)
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());

    return {
      id: encodeURIComponent(summary.name),
      icon: customerProfileIcon(summary.name),
      name: summary.name,
      website: "",
      industry: "",
      primaryContactName: summary.requesters[0] ?? "",
      primaryContactEmail: "",
      billingEmail: "",
      customerTier: "Standard",
      accountStatus: "Active",
      notes: "",
      users: summary.requesters.map((requester, index) => ({
        id: `${encodeURIComponent(summary.name)}_${index}`,
        name: requester,
        email: "",
        pendingEmail: null,
        role: "CUSTOMER_MEMBER",
        passwordChangedAt: null,
        passwordEnabled: false,
        mustChangePassword: false,
        temporaryPasswordExpiresAt: null,
        createdAt: "",
        updatedAt: "",
      })),
      metrics: {
        totalRequests: summary.totalRequests,
        activeQuoteRequests: summary.activeQuoteRequests,
        placedOrders: summary.placedOrders,
        blockedRequests: summary.blockedRequests,
        quotedValueCents: summary.quotedValueCents,
        orderValueCents: summary.orderValueCents,
      },
      latestActivityAt: summary.latestActivityAt,
      latestRequest: summary.latestRequest,
      requests,
      fabricationShops: summary.fabricationShops,
    };
  });
}

export async function listCustomerProfiles() {
  return withDemoFallback(
    async () => {
      const client = await prisma();
      const companies = await client.company.findMany({
        include: {
          users: {
            orderBy: {
              name: "asc",
            },
          },
          requests: {
            include: storedRequestInclude,
            orderBy: {
              updatedAt: "desc",
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      return companies.map(profileFromStoredCompany);
    },
    async () => profilesFromRequests(await listLocalRequests()),
  );
}

export async function getCustomerProfile(id: string) {
  return withDemoFallback(
    async () => {
      const client = await prisma();
      const decodedId = decodeURIComponent(id);
      const company = await client.company.findUnique({
        where: { id },
        include: {
          users: {
            orderBy: {
              name: "asc",
            },
          },
          requests: {
            include: storedRequestInclude,
            orderBy: {
              updatedAt: "desc",
            },
          },
        },
      }) ?? await client.company.findFirst({
        where: { name: decodedId },
        include: {
          users: {
            orderBy: {
              name: "asc",
            },
          },
          requests: {
            include: storedRequestInclude,
            orderBy: {
              updatedAt: "desc",
            },
          },
        },
      });

      return company ? profileFromStoredCompany(company) : null;
    },
    async () => {
      const decodedId = decodeURIComponent(id);
      return profilesFromRequests(await listLocalRequests()).find((profile) => profile.id === id || profile.name === decodedId) ?? null;
    },
  );
}

export async function updateCustomerProfile(id: string, input: CustomerProfileInput) {
  const client = await prisma();
  const company = await client.company.update({
    where: { id },
    data: {
      name: input.name.trim(),
      website: input.website.trim(),
      industry: input.industry.trim(),
      primaryContactName: input.primaryContactName.trim(),
      primaryContactEmail: input.primaryContactEmail.trim(),
      billingEmail: input.billingEmail.trim(),
      customerTier: input.customerTier.trim() || "Standard",
      accountStatus: input.accountStatus.trim() || "Active",
      notes: input.notes.trim(),
    },
    include: {
      users: {
        orderBy: {
          name: "asc",
        },
      },
      requests: {
        include: storedRequestInclude,
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
  });

  return profileFromStoredCompany(company);
}
