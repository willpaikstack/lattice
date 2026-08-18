import { UserProfile } from "@clerk/nextjs";

import { AccountSettingsWorkspace } from "@/components/account-settings-workspace";
import { getAccountSettings, listStripePaymentCards } from "@/lib/account-settings";
import { getCurrentSession } from "@/lib/session";
import { createStripeSetupSessionAction, detachStripePaymentMethodAction, saveAccountSettingsAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const session = await getCurrentSession();

  if (!session) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-3xl items-start justify-center py-8">
        <UserProfile routing="hash" />
      </div>
    );
  }

  const settings = await getAccountSettings();
  const cards = await listStripePaymentCards();

  return (
    <AccountSettingsWorkspace
      createCardSetupAction={createStripeSetupSessionAction}
      detachCardAction={detachStripePaymentMethodAction}
      initialSettings={{ ...settings, cards }}
      saveSettingsAction={saveAccountSettingsAction}
    />
  );
}
