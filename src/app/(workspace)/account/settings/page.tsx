import { AccountSettingsWorkspace } from "@/components/account-settings-workspace";
import { getAccountSettings } from "@/lib/account-settings";
import { updateRequestShippingAddressAction } from "@/app/(workspace)/quotes/[requestId]/actions";
import { saveAccountSettingsAction, updateAccountDisplayNameAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const settings = await getAccountSettings();

  return (
    <AccountSettingsWorkspace
      initialSettings={settings}
      saveSettingsAction={saveAccountSettingsAction}
      updateRequestShippingAddressAction={updateRequestShippingAddressAction}
      updateDisplayNameAction={updateAccountDisplayNameAction}
    />
  );
}
