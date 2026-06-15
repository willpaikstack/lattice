import "server-only";

import { NextResponse } from "next/server";

import type { LatticeRole } from "./auth-crypto";
import { getCurrentSession } from "./session";

export async function requireRouteRole(allowedRoles: LatticeRole[]) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  return null;
}

export async function requireActionRole(allowedRoles: LatticeRole[]) {
  const session = await getCurrentSession();

  if (!session) {
    throw new Error("Authentication required.");
  }

  if (!allowedRoles.includes(session.user.role)) {
    throw new Error("Access denied.");
  }

  return session;
}
