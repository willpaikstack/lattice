import { redirect } from "next/navigation";

import { getAccountSettings, hasCompletedAddressOnboarding } from "@/lib/account-settings";
import { defaultHomeForRole } from "@/lib/auth-crypto";
import { getCurrentSession, getPasswordSetupState } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Clerk's first post-authentication destination. This route is deliberately
 * bare: it decides whether a user must complete password setup before a
 * workspace route (and its shell) is ever rendered.
 */
export default async function AccountContinuePage() {
  const passwordSetup = await getPasswordSetupState();

  if (passwordSetup.status === "ready" || passwordSetup.status === "expired" || passwordSetup.status === "not-provisioned") {
    redirect("/account/set-password");
  }

  if (passwordSetup.status === "signed-out") {
    redirect("/login");
  }

  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "customer") {
    const settings = await getAccountSettings();
    if (!hasCompletedAddressOnboarding(settings) && !settings.addressOnboardingDeferred) {
      redirect("/account/settings?onboarding=addresses");
    }
  }

  redirect(defaultHomeForRole(session.user.role));
}
