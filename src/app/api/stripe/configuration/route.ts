import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { getStripeMerchantReadiness } from "@/lib/stripe";
export const dynamic = "force-dynamic";
export async function GET() {
  const session = await getCurrentSession();
  if (session?.user.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  try {
    return NextResponse.json(await getStripeMerchantReadiness(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    // Stripe error messages can contain credentials. Return only allowlisted diagnostics.
    const type = typeof error === "object" && error !== null && "type" in error ? error.type : "";
    const errorCode = type === "StripeAuthenticationError" ? "STRIPE_AUTHENTICATION_FAILED"
      : type === "StripePermissionError" ? "STRIPE_PERMISSION_DENIED" : "STRIPE_CONFIGURATION_UNVERIFIED";
    return NextResponse.json({ ready: false, errorCode,
      secretKeyConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
      merchantAccountConfigured: Boolean(process.env.STRIPE_MERCHANT_ACCOUNT_ID),
      webhookSecretConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      error: "Unable to verify Stripe configuration. Check the server credentials and permissions.",
    }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
