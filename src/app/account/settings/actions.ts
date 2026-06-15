"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ensureStripeCustomerForAccount, saveAccountSettings, type AccountSettingsSnapshot } from "@/lib/account-settings";
import { requireActionRole } from "@/lib/route-authorization";
import { getAppBaseUrl, getStripeClient } from "@/lib/stripe";

export async function saveAccountSettingsAction(settings: AccountSettingsSnapshot) {
  await requireActionRole(["admin", "customer", "supplier"]);
  await saveAccountSettings(settings);
}

export async function createStripeSetupSessionAction() {
  await requireActionRole(["admin", "customer", "supplier"]);
  const { customerId } = await ensureStripeCustomerForAccount();
  const stripe = getStripeClient();
  const baseUrl = getAppBaseUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "setup",
    customer: customerId,
    payment_method_types: ["card"],
    success_url: `${baseUrl}/account/settings?payment_method=added`,
    cancel_url: `${baseUrl}/account/settings?payment_method=canceled`,
  });

  if (!session.url) {
    throw new Error("Stripe did not return a setup URL.");
  }

  redirect(session.url);
}

export async function detachStripePaymentMethodAction(formData: FormData) {
  await requireActionRole(["admin", "customer", "supplier"]);
  const paymentMethodId = formData.get("paymentMethodId");

  if (typeof paymentMethodId !== "string" || !paymentMethodId.startsWith("pm_")) {
    throw new Error("Choose a valid Stripe payment method to remove.");
  }

  const stripe = getStripeClient();
  await stripe.paymentMethods.detach(paymentMethodId);
  revalidatePath("/account/settings");
}
