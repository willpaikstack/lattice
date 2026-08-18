import { redirect } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";

import { deleteSession } from "@/lib/session";

export async function GET() {
  const { sessionId } = await auth();
  if (sessionId) {
    await (await clerkClient()).sessions.revokeSession(sessionId);
  }
  await deleteSession();
  redirect("/login");
}
