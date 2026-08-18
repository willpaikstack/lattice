import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, WorkspaceRole } from "@prisma/client";

function valueFor(flag) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

function usage(message) {
  if (message) console.error(`Error: ${message}\n`);
  console.error(`Usage:\n  npm run onboard:customer -- --company "Acme Manufacturing" --name "Jane Doe" --email jane@acme.com [--role admin|member]\n  npm run onboard:customer -- --company-id <existing-company-id> --name "Jane Doe" --email jane@acme.com [--role admin|member]`);
  process.exit(1);
}

const companyName = valueFor("--company")?.trim();
const companyId = valueFor("--company-id")?.trim();
const name = valueFor("--name")?.trim();
const email = valueFor("--email")?.trim().toLowerCase();
const requestedRole = valueFor("--role") ?? "admin";

if (!process.env.DATABASE_URL) usage("DATABASE_URL is required.");
if (!name || !email || (!companyName && !companyId) || (companyName && companyId)) {
  usage("Provide a name, email, and exactly one of --company or --company-id.");
}
if (!email.includes("@")) usage("Provide a valid email address.");
if (!["admin", "member"].includes(requestedRole)) usage("--role must be admin or member.");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

try {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) usage(`A user already exists for ${email}. Update its membership through the database or a future admin membership UI.`);

  let company;
  if (companyId) {
    company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) usage(`No company exists with ID ${companyId}.`);
  } else {
    company = await prisma.company.create({
      data: {
        name: companyName,
        primaryContactName: name,
        primaryContactEmail: email,
      },
    });
  }

  const role = requestedRole === "admin" ? WorkspaceRole.CUSTOMER_ADMIN : WorkspaceRole.CUSTOMER_MEMBER;
  const user = await prisma.user.create({
    data: { name, email, role, companyId: company.id },
  });

  console.log(`Created ${role === WorkspaceRole.CUSTOMER_ADMIN ? "Customer Admin" : "Customer Member"} ${user.email} for ${company.name}.`);
  console.log(`Company ID: ${company.id}`);
  console.log("The user can now sign in and see all RFQs, quotes, orders, and submitted files owned by this company.");
} finally {
  await prisma.$disconnect();
}
