import "server-only";

import type { PrismaClient, WorkspaceRole } from "@prisma/client";

import { verifyPasswordHash, type LatticeRole } from "./auth-crypto";
import { getPrismaClient } from "./prisma";

export function roleForWorkspaceRole(role: WorkspaceRole): LatticeRole {
  return role === "LATTICE_ADMIN" ? "admin" : "customer";
}

export function customerRoleForWorkspaceRole(role: WorkspaceRole) {
  if (role === "CUSTOMER_ADMIN") return "admin" as const;
  if (role === "CUSTOMER_MEMBER") return "member" as const;
  return null;
}

export async function findWorkspaceUser(email: string | undefined) {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) return null;

  try {
    const client = (await getPrismaClient()) as PrismaClient;
    return await client.user.findUnique({
      where: { email: normalizedEmail },
      include: { company: { select: { id: true, name: true } } },
    });
  } catch {
    // The local password bootstrap remains usable before a database is configured.
    return null;
  }
}

export async function findWorkspaceUserByClerkUserId(clerkUserId: string | undefined) {
  if (!clerkUserId) return null;

  try {
    const client = (await getPrismaClient()) as PrismaClient;
    return await client.user.findUnique({
      where: { clerkUserId },
      include: { company: { select: { id: true, name: true } } },
    });
  } catch {
    return null;
  }
}

export async function linkWorkspaceUserToClerk(userId: string, clerkUserId: string) {
  const client = (await getPrismaClient()) as PrismaClient;
  return client.user.update({
    where: { id: userId },
    data: { clerkUserId },
    include: { company: { select: { id: true, name: true } } },
  });
}

export async function authenticateWorkspaceUser(email: string, password: string) {
  const user = await findWorkspaceUser(email);

  if (!user || !verifyPasswordHash(password, user.passwordHash, user.passwordSalt)) {
    return null;
  }

  return user;
}

export function hasExpiredTemporaryPassword(user: { mustChangePassword: boolean; temporaryPasswordExpiresAt: Date | null }) {
  return user.mustChangePassword && Boolean(user.temporaryPasswordExpiresAt && user.temporaryPasswordExpiresAt <= new Date());
}
