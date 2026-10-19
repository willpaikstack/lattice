import { NextRequest, NextResponse } from "next/server";
import zipcodes from "zipcodes";
import { requireRouteRole } from "@/lib/route-authorization";

export async function GET(request: NextRequest) {
  const denied = await requireRouteRole(["admin", "customer"]);
  if (denied) return denied;
  const state = request.nextUrl.searchParams.get("state")?.trim().toUpperCase().slice(0, 2) ?? "";
  const city = request.nextUrl.searchParams.get("city")?.trim().toLowerCase().slice(0, 100) ?? "";
  const zip = request.nextUrl.searchParams.get("zip")?.trim().slice(0, 5) ?? "";
  // Bundled public postal data: no customer address is sent to a third party.
  const options = [];
  if (zip.length >= 3 || city.length >= 1) {
    for (const item of Object.values(zipcodes.codes)) {
      if (item.country !== "US" || (state && item.state !== state) || (city && !item.city.toLowerCase().startsWith(city)) || (zip && !item.zip.startsWith(zip))) continue;
      options.push({ city: item.city, state: item.state, zipCode: item.zip });
      if (options.length === 100) break;
    }
  }
  return NextResponse.json({ options }, { headers: { "Cache-Control": "private, no-store" } });
}
