import "server-only";

import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

import type { LatticeRole } from "./auth-crypto";
import { getCurrentSession } from "./session";

/** Call inside each page before any private query; layouts execute in parallel. */
export async function requirePageRole(allowedRoles: LatticeRole[]) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (!allowedRoles.includes(session.user.role)) redirect("/dashboard");
  return session;
}

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
