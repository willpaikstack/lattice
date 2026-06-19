import { getPrismaClient } from "./prisma";

const customerSequenceKey = "customer";

type StoredCompanyCustomerId = {
  customerId: string | null;
  id: string;
  name: string;
};

type CustomerIdTransactionClient = {
  company: {
    findUnique: (args: unknown) => Promise<StoredCompanyCustomerId | null>;
    update: (args: unknown) => Promise<StoredCompanyCustomerId>;
  };
  customerSequence: {
    upsert: (args: unknown) => Promise<{ key: string; nextValue: number }>;
  };
};

type CustomerIdPrismaClient = {
  $transaction: <T>(operation: (tx: CustomerIdTransactionClient) => Promise<T>) => Promise<T>;
};

export function formatCustomerId(sequenceValue: number) {
  if (!Number.isInteger(sequenceValue) || sequenceValue < 1) {
    throw new Error("Customer ID sequence value must be a positive integer");
  }

  return `CUST-${String(sequenceValue).padStart(6, "0")}`;
}

async function prisma() {
  return (await getPrismaClient()) as CustomerIdPrismaClient;
}

/** @public Retained for durable customer-ID issuance when companies become customer records. */
export async function ensureCustomerIdForCompany(companyId: string) {
  const trimmedCompanyId = companyId.trim();

  if (!trimmedCompanyId) {
    throw new Error("Company ID is required");
  }

  const client = await prisma();

  return client.$transaction(async (tx) => {
    const company = await tx.company.findUnique({
      select: {
        customerId: true,
        id: true,
        name: true,
      },
      where: {
        id: trimmedCompanyId,
      },
    });

    if (!company) {
      throw new Error("Company not found");
    }

    if (company.customerId) {
      return company.customerId;
    }

    const sequence = await tx.customerSequence.upsert({
      create: {
        key: customerSequenceKey,
        nextValue: 2,
      },
      update: {
        nextValue: {
          increment: 1,
        },
      },
      where: {
        key: customerSequenceKey,
      },
    });
    const customerId = formatCustomerId(sequence.nextValue - 1);

    await tx.company.update({
      data: {
        customerId,
      },
      select: {
        customerId: true,
        id: true,
        name: true,
      },
      where: {
        id: trimmedCompanyId,
      },
    });

    return customerId;
  });
}
