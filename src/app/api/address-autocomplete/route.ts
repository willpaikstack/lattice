import { NextRequest, NextResponse } from "next/server";
import { requireRouteRole } from "@/lib/route-authorization";
import { usStates } from "@/lib/us-address-options";
import type { StreetAddressSuggestion, StreetLookupFailure } from "@/lib/street-address";

const headers = { "Cache-Control": "private, no-store" };

/** POST keeps typed addresses out of request URLs. Never forward names or phones. */
export async function POST(request: NextRequest) {
  const denied = await requireRouteRole(["admin", "customer"]);
  if (denied) return denied;
  let text: unknown;
  try { text = (await request.json()).text; }
  catch { return NextResponse.json({ error: "Enter a street address." }, { status: 400, headers }); }
  if (typeof text !== "string" || text.trim().length < 3 || text.length > 200 || /[\u0000-\u001f\u007f]/.test(text)) {
    return NextResponse.json({ error: "Enter 3–200 characters for street lookup." }, { status: 400, headers });
  }
  const apiKey = process.env.GEOAPIFY_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ available: false, reason: "not_configured", options: [] }, { headers });
  const query = new URLSearchParams({ text: text.trim(), filter: "countrycode:us", lang: "en", format: "json", limit: "5", apiKey });
  try {
    const response = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?${query}`, {
      cache: "no-store", signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      const reason: StreetLookupFailure = response.status === 401 || response.status === 403 ? "credentials" : response.status === 429 ? "quota" : "unavailable";
      // Record only an HTTP status, never the provider URL, key, body or search text.
      console.warn("Street address provider request failed", { status: response.status, reason });
      return NextResponse.json({ available: false, reason, options: [] }, { headers });
    }
    const result = await response.json() as { results?: Array<Record<string, unknown>> };
    const clean = (value: unknown) => typeof value === "string" ? value.trim().slice(0, 200) : "";
    const options: StreetAddressSuggestion[] = [];
    for (const item of (result.results ?? []).slice(0, 5)) {
      if (item.country_code !== "us" || !clean(item.street)) continue;
      const address1 = [clean(item.housenumber), clean(item.street)].filter(Boolean).join(" ");
      const city = clean(item.city) || clean(item.town) || clean(item.village) || clean(item.municipality);
      const stateName = clean(item.state_code) || clean(item.state);
      const state = usStates.find(([code, name]) => code === stateName || name.toLowerCase() === stateName.toLowerCase())?.[0] ?? "";
      const zipCode = clean(item.postcode);
      const label = [address1, city, [state, zipCode].filter(Boolean).join(" ")].filter(Boolean).join(", ");
      if (options.some((option) => option.label === label)) continue;
      options.push({ id: String(options.length), address1, city, state, zipCode, label });
    }
    return NextResponse.json({ available: true, options }, { headers });
  } catch {
    // Provider errors can include URLs containing the key and address: do not log them.
    return NextResponse.json({ available: false, reason: "unavailable", options: [] }, { headers });
  }
}
