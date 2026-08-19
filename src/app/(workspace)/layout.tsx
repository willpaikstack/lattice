import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { clerkUserDisplayName } from "@/lib/clerk-user-profile";
import { getCurrentSession } from "@/lib/session";

/** Keeps private identity lookups and application chrome out of public routes. */
export default async function WorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getCurrentSession({ allowPasswordChange: true });
  const clerkUser = session ? null : await currentUser();
  const clerkEmail = clerkUser?.primaryEmailAddress?.emailAddress?.trim() ?? "";
  const shellUser = session?.user
    ? { email: session.user.email, name: session.user.name }
    : clerkUser
      ? { email: clerkEmail, name: clerkUserDisplayName(clerkUser) || "Account" }
      : undefined;

  if (session?.user.mustChangePassword) {
    redirect("/account/set-password");
  }

  return <AppShell sessionRole={session?.user.role} sessionUser={shellUser} supportAdmin={session?.user.supportAdmin ?? undefined}>{children}</AppShell>;
}
