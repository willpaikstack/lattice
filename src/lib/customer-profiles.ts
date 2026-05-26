import { buildAdminCustomerSummaries } from "./admin-customers";
import { getDemoRequests } from "./demo-requests";
import { getPrismaClient } from "./prisma";
import type { RequestStatus } from "./request-model";
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

export type CustomerProfile = CustomerProfileInput & {
  id: string;
  users: Array<{
    id: string;
    name: string;
    email: string;
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
  fabricationShops: Array<{
    name: string;
    country: string;
    quoteCount: number;
    selectedOrderCount: number;
  }>;
};

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
  }>;
  requests: StoredRequest[];
};

async function prisma() {
  return (await getPrismaClient()) as {
    company: {
      findMany: (args: unknown) => Promise<StoredCompany[]>;
      findUnique: (args: unknown) => Promise<StoredCompany | null>;
      update: (args: unknown) => Promise<StoredCompany>;
    };
  };
}

async function withDemoFallback<T>(operation: () => Promise<T>, fallback: () => T) {
  try {
    return await operation();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma is unavailable; using demo customer profile data.", error);
    }
    return fallback();
  }
}

function profileFromStoredCompany(company: StoredCompany): CustomerProfile {
  const requests = company.requests.map((request) =>
    mapStoredRequest({
      ...request,
      buyerCompany: request.buyerCompany ?? { name: company.name },
    }),
  );
  const summary = buildAdminCustomerSummaries(requests)[0];

  return {
    id: company.id,
    name: company.name,
    website: company.website ?? "",
    industry: company.industry ?? "",
    primaryContactName: company.primaryContactName ?? "",
    primaryContactEmail: company.primaryContactEmail ?? "",
    billingEmail: company.billingEmail ?? "",
    customerTier: company.customerTier ?? "Standard",
    accountStatus: company.accountStatus ?? "Active",
    notes: company.notes ?? "",
    users: company.users,
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
    fabricationShops: summary?.fabricationShops ?? [],
  };
}

function demoProfiles() {
  return buildAdminCustomerSummaries(getDemoRequests()).map<CustomerProfile>((summary) => ({
    id: encodeURIComponent(summary.name),
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
    fabricationShops: summary.fabricationShops,
  }));
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
    demoProfiles,
  );
}

export async function getCustomerProfile(id: string) {
  return withDemoFallback(
    async () => {
      const client = await prisma();
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
      });

      return company ? profileFromStoredCompany(company) : null;
    },
    () => {
      const decodedId = decodeURIComponent(id);
      return demoProfiles().find((profile) => profile.id === id || profile.name === decodedId) ?? null;
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
