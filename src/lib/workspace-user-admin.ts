import "server-only";

import { randomBytes } from "node:crypto";
import { clerkClient } from "@clerk/nextjs/server";

import { WorkspaceRole, type PrismaClient } from "@prisma/client";

import { createPasswordCredentials } from "./auth-crypto";
import { beginEmailChange } from "./email-change";
import { getPrismaClient } from "./prisma";

export type CustomerWorkspaceRole = "CUSTOMER_ADMIN" | "CUSTOMER_MEMBER";
const temporaryPasswordDurationMs = 72 * 60 * 60 * 1000;

function customerRole(role: string): CustomerWorkspaceRole {
  if (role === "CUSTOMER_ADMIN") return "CUSTOMER_ADMIN";
  return "CUSTOMER_MEMBER";
}

function normalizedEmail(value: string) {
  return value.trim().toLowerCase();
}

function temporaryPassword() {
  return `Lattice-${randomBytes(15).toString("base64url")}`;
}

function temporaryPasswordExpiry() {
  return new Date(Date.now() + temporaryPasswordDurationMs);
}

function clerkName(name: string) {
  const [firstName = "Lattice", ...lastNameParts] = name.trim().split(/\s+/);
  return { firstName, lastName: lastNameParts.join(" ") || undefined };
}

async function createClerkUser(input: { email: string; name: string; password: string; externalId: string }) {
  return (await clerkClient()).users.createUser({
    emailAddress: [input.email],
    externalId: input.externalId,
    password: input.password,
    ...clerkName(input.name),
  });
}

async function setClerkPassword(user: { clerkUserId: string | null; email: string; id: string; name: string }, password: string) {
  const clerk = await clerkClient();
  if (user.clerkUserId) {
    await clerk.users.updateUser(user.clerkUserId, { password, signOutOfOtherSessions: true });
    return user.clerkUserId;
  }

  const clerkUser = await createClerkUser({ email: user.email, externalId: user.id, name: user.name, password });
  await (await prisma()).user.update({ where: { id: user.id }, data: { clerkUserId: clerkUser.id } });
  return clerkUser.id;
}

async function prisma() {
  return (await getPrismaClient()) as PrismaClient;
}

async function ensureCompany(companyId: string) {
  const company = await (await prisma()).company.findUnique({ where: { id: companyId } });
  if (!company) throw new Error("Customer company not found.");
  return company;
}

async function ensureAnotherCustomerAdmin(companyId: string, userId: string) {
  const count = await (await prisma()).user.count({
    where: { companyId, role: WorkspaceRole.CUSTOMER_ADMIN, NOT: { id: userId } },
  });

  if (count === 0) {
    throw new Error("Assign another Customer Admin before removing or changing the last Customer Admin.");
  }
}

export async function addCustomerUser(companyId: string, input: { email: string; name: string; role: string }) {
  await ensureCompany(companyId);
  const name = input.name.trim();
  const email = normalizedEmail(input.email);

  if (!name || !email || !email.includes("@")) {
    throw new Error("Enter a name and valid email address.");
  }

  const client = await prisma();
  const existing = await client.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("A user already exists with that email address.");
  }

  const password = temporaryPassword();
  const credentials = createPasswordCredentials(password);
  const user = await client.user.create({
    data: {
      ...credentials,
      companyId,
      email,
      name,
      passwordChangedAt: new Date(),
      mustChangePassword: true,
      role: customerRole(input.role),
      temporaryPasswordExpiresAt: temporaryPasswordExpiry(),
    },
  });

  try {
    const clerkUser = await createClerkUser({ email, externalId: user.id, name, password });
    return { password, user: await client.user.update({ where: { id: user.id }, data: { clerkUserId: clerkUser.id } }) };
  } catch (error) {
    await client.user.delete({ where: { id: user.id } });
    throw error;
  }
}

export async function resetCustomerUserPassword(companyId: string, userId: string) {
  await ensureCompany(companyId);
  const client = await prisma();
  const user = await client.user.findFirst({ where: { id: userId, companyId } });
  if (!user) throw new Error("Customer user not found.");

  const password = temporaryPassword();
  const credentials = createPasswordCredentials(password);
  await setClerkPassword(user, password);
  await client.user.update({
    where: { id: user.id },
    data: {
      ...credentials,
      mustChangePassword: true,
      passwordChangedAt: new Date(),
      temporaryPasswordExpiresAt: temporaryPasswordExpiry(),
    },
  });

  return { password, user };
}

export async function setCustomerUserPassword(companyId: string, userId: string, password: string) {
  await ensureCompany(companyId);
  const client = await prisma();
  const user = await client.user.findFirst({ where: { id: userId, companyId } });
  if (!user) throw new Error("Customer user not found.");

  if (password.length < 12) {
    throw new Error("Use a password with at least 12 characters.");
  }

  await setClerkPassword(user, password);
  const credentials = createPasswordCredentials(password);
  await client.user.update({
    where: { id: user.id },
    data: { ...credentials, mustChangePassword: false, passwordChangedAt: new Date(), temporaryPasswordExpiresAt: null },
  });

  return user;
}

export async function completeForcedPasswordChange(userId: string, password: string) {
  if (password.length < 12) {
    throw new Error("Use a password with at least 12 characters.");
  }

  const client = await prisma();
  const user = await client.user.findUnique({ where: { id: userId } });
  if (!user || !user.mustChangePassword) {
    throw new Error("This password change is no longer available.");
  }

  if (user.temporaryPasswordExpiresAt && user.temporaryPasswordExpiresAt <= new Date()) {
    throw new Error("This temporary password has expired. Ask a Lattice administrator to issue a new one.");
  }

  if (!user.clerkUserId) throw new Error("This user must sign in with Clerk before changing a temporary password.");
  await (await clerkClient()).users.updateUser(user.clerkUserId, { password, signOutOfOtherSessions: true });
  const credentials = createPasswordCredentials(password);
  const changedAt = new Date();
  await client.$transaction([
    client.user.update({
      where: { id: user.id },
      data: { ...credentials, mustChangePassword: false, passwordChangedAt: changedAt, temporaryPasswordExpiresAt: null },
    }),
    client.authAuditEvent.create({ data: { userId: user.id, action: "TEMPORARY_PASSWORD_CHANGED" } }),
  ]);

  return user;
}

export async function requestCustomerUserEmailChange(companyId: string, userId: string, email: string) {
  await ensureCompany(companyId);
  const client = await prisma();
  const user = await client.user.findFirst({ where: { id: userId, companyId } });
  if (!user) throw new Error("Customer user not found.");
  if (user.clerkUserId) {
    throw new Error("Email changes are managed through the user’s Clerk account profile during this migration.");
  }
  return beginEmailChange(user.id, email);
}

export async function customerUserForSupportSession(companyId: string, userId: string) {
  await ensureCompany(companyId);
  const user = await (await prisma()).user.findFirst({ where: { id: userId, companyId } });
  if (!user) throw new Error("Customer user not found.");
  if (user.mustChangePassword) throw new Error("This user must complete their password setup before a support view can start.");
  return user;
}

export async function updateCustomerUserRole(companyId: string, userId: string, requestedRole: string) {
  const role = customerRole(requestedRole);
  await ensureCompany(companyId);
  const client = await prisma();
  const user = await client.user.findFirst({ where: { id: userId, companyId } });
  if (!user) throw new Error("Customer user not found.");

  if (user.role === WorkspaceRole.CUSTOMER_ADMIN && role !== WorkspaceRole.CUSTOMER_ADMIN) {
    await ensureAnotherCustomerAdmin(companyId, user.id);
  }

  return client.user.update({ where: { id: user.id }, data: { role } });
}

export async function removeCustomerUser(companyId: string, userId: string) {
  await ensureCompany(companyId);
  const client = await prisma();
  const user = await client.user.findFirst({ where: { id: userId, companyId } });
  if (!user) throw new Error("Customer user not found.");

  if (user.role === WorkspaceRole.CUSTOMER_ADMIN) {
    await ensureAnotherCustomerAdmin(companyId, user.id);
  }

  if (user.clerkUserId) {
    await (await clerkClient()).users.deleteUser(user.clerkUserId);
  }
  await client.user.delete({ where: { id: user.id } });
}
