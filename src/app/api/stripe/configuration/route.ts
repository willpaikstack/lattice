import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { getStripeMerchantReadiness } from "@/lib/stripe";
export const dynamic = "force-dynamic";
export async function GET() {
  const session = await getCurrentSession();
  if (session?.user.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  try {
    return NextResponse.json(await getStripeMerchantReadiness(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ready: false, error: "Unable to verify Stripe configuration. Check the server credentials and permissions." }, { status: 503 });
  }
}
