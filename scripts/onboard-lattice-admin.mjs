import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, WorkspaceRole } from "@prisma/client";

function valueFor(flag) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

function usage(message) {
  if (message) console.error(`Error: ${message}\n`);
  console.error('Usage:\n  npm run onboard:lattice-admin -- --name "William Paik" --email will@latticeos.co');
  process.exit(1);
}

const name = valueFor("--name")?.trim();
const email = valueFor("--email")?.trim().toLowerCase();

if (!process.env.DATABASE_URL) usage("DATABASE_URL is required.");
if (!name || !email || !email.includes("@")) usage("Provide a name and valid email address.");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

try {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) usage(`A user already exists for ${email}. Update the role deliberately rather than creating a duplicate.`);

  const user = await prisma.user.create({
    data: { name, email, role: WorkspaceRole.LATTICE_ADMIN },
  });

  console.log(`Created the Lattice Admin account for ${user.email}.`);
} finally {
  await prisma.$disconnect();
}
