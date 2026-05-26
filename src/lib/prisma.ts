import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: unknown;
};

type PrismaClientConstructor = new (options: {
  adapter: PrismaPg;
  log: string[];
}) => unknown;

const importPrismaClient = new Function("specifier", "return import(specifier)") as (
  specifier: string,
) => Promise<{ PrismaClient: PrismaClientConstructor }>;

export async function getPrismaClient() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const { PrismaClient } = await importPrismaClient("@prisma/client");
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });

  const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }

  return prisma;
}
