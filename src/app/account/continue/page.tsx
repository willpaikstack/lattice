import { redirect } from "next/navigation";

import { getAccountSettings, hasCompletedAddressOnboarding } from "@/lib/account-settings";
import { defaultHomeForRole } from "@/lib/auth-crypto";
import { getCurrentSession, getPasswordSetupState } from "@/lib/session";
import { getCustomerOnboarding } from "@/lib/customer-onboarding";

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
    // Introduce the real workspace immediately after personal-password setup.
    // Eligible admins finish their existing address setup after the tour.
    const onboarding = await getCustomerOnboarding();
    if (onboarding && !onboarding.completed) redirect("/dashboard");
    const settings = await getAccountSettings();
    if (!hasCompletedAddressOnboarding(settings) && !settings.addressOnboardingDeferred) {
      redirect("/dashboard");
    }
  }

  redirect(defaultHomeForRole(session.user.role));
}
