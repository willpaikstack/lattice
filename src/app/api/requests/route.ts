import { NextResponse } from "next/server";

import { createSubmittedRequest, listOperatorRequests } from "@/lib/request-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const requests = await listOperatorRequests();
  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  try {
    const input = await request.json();
    const created = await createSubmittedRequest(input);
    return NextResponse.json({ request: created }, { status: 201 });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Unable to create request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
