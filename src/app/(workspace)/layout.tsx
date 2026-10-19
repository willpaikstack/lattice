import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CustomerWorkspaceProvider } from "@/components/customer-workspace-scope";
import { getCustomerOnboarding } from "@/lib/customer-onboarding";
import { AppShell } from "@/components/app-shell";
import { clerkUserDisplayName } from "@/lib/clerk-user-profile";
import { getCurrentSession } from "@/lib/session";

/** Keeps private identity lookups and application chrome out of public routes. */
export default async function WorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getCurrentSession({ allowPasswordChange: true });
  const clerkUser = await currentUser();
  const preset = clerkUser?.unsafeMetadata?.latticeAvatarPreset;
  const avatarPreset = preset && typeof preset === "object" && "colorId" in preset && "presetId" in preset && typeof preset.colorId === "string" && typeof preset.presetId === "string" ? { colorId: preset.colorId, presetId: preset.presetId } : null;
  const profile = session?.user.supportAdmin ? {} : { avatarPreset, profileImageUrl: clerkUser?.hasImage ? clerkUser.imageUrl : "" };
  const clerkEmail = clerkUser?.primaryEmailAddress?.emailAddress?.trim() ?? "";
  const shellUser = session?.user
    ? { email: session.user.email, name: session.user.name, ...profile }
    : clerkUser
      ? { email: clerkEmail, name: clerkUserDisplayName(clerkUser) || "Account", ...profile }
      : undefined;

  if (session?.user.mustChangePassword) {
    redirect("/account/set-password");
  }

  const onboarding = await getCustomerOnboarding();

  const draftScope = session?.user.role === "customer" ? session.user.companyId : session?.user.id ? `admin:${session.user.id}` : null;
  return <AppShell onboarding={onboarding} sessionRole={session?.user.role} sessionUser={shellUser} supportAdmin={session?.user.supportAdmin ?? undefined}><CustomerWorkspaceProvider key={draftScope} scope={draftScope}>{children}</CustomerWorkspaceProvider></AppShell>;
}
