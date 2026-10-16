import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getCurrentSession } from "./session";

/** Public recovery is email-based; a signed-in recovery is always for its owner. */
export async function signedInRecoveryEmail() {
  const { userId } = await auth();
  if (!userId) return null;
  const session = await getCurrentSession();
  if (session?.user.supportAdmin) throw new Error("Leave the support session before resetting your password.");
  const user = await currentUser();
  const email = user?.primaryEmailAddress;
  if (!email || email.verification?.status !== "verified") throw new Error("A verified sign-in email is required to reset your password.");
  return email.emailAddress;
}
