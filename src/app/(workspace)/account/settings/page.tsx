import { AccountSettingsWorkspace } from "@/components/account-settings-workspace";
import { notFound } from "next/navigation";
import { getCustomerRequestByIdForCurrentSession } from "@/lib/request-access-policy";
import { getAccountSettings } from "@/lib/account-settings";
import { updateRequestShippingAddressAction } from "@/app/(workspace)/quotes/[requestId]/actions";
import { deferInitialAddressOnboardingAction, saveAccountSettingsAction, updateAccountDisplayNameAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage({ searchParams }: { searchParams?: Promise<{ request?: string }> }) {
  const settings = await getAccountSettings();
  const requestId = (await searchParams)?.request;
  if (requestId) {
    const request = await getCustomerRequestByIdForCurrentSession(requestId);
    if (!request) notFound();
    settings.shipping = { phone: request.shipToPhone, name: request.shipToName, company: request.shipToCompany, address1: request.shipToAddress1, address2: request.shipToAddress2, city: request.shipToCity, state: request.shipToState, zipCode: request.shipToZipCode };
  }

  return (
    <AccountSettingsWorkspace
      key={requestId ?? "account"}
      cardCheckoutAvailable={process.env.STRIPE_CHECKOUT_ENABLED === "true" && Boolean(process.env.STRIPE_SECRET_KEY)}
      initialSettings={settings}
      deferInitialAddressOnboardingAction={deferInitialAddressOnboardingAction}
      saveSettingsAction={saveAccountSettingsAction}
      updateRequestShippingAddressAction={updateRequestShippingAddressAction}
      updateDisplayNameAction={updateAccountDisplayNameAction}
    />
  );
}
