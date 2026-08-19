import { AccountSettingsWorkspace } from "@/components/account-settings-workspace";
import { getAccountSettings, listStripePaymentCards } from "@/lib/account-settings";
import { updateRequestShippingAddressAction } from "@/app/quotes/[requestId]/actions";
import { createStripeSetupSessionAction, detachStripePaymentMethodAction, saveAccountSettingsAction, updateAccountDisplayNameAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const settings = await getAccountSettings();
  const cards = await listStripePaymentCards();

  return (
    <AccountSettingsWorkspace
      createCardSetupAction={createStripeSetupSessionAction}
      detachCardAction={detachStripePaymentMethodAction}
      initialSettings={{ ...settings, cards }}
      saveSettingsAction={saveAccountSettingsAction}
      updateRequestShippingAddressAction={updateRequestShippingAddressAction}
      updateDisplayNameAction={updateAccountDisplayNameAction}
    />
  );
}
