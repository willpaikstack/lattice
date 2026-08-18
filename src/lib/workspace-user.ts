import "server-only";

import type { PrismaClient, WorkspaceRole } from "@prisma/client";

import type { LatticeRole } from "./auth-crypto";
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
