import { NextResponse } from "next/server";

import { getCustomerRequestByIdForCurrentSession } from "@/lib/request-access-policy";
import { archiveDraftRequest } from "@/lib/request-repository";
import { requireRouteRole } from "@/lib/route-authorization";

export const dynamic = "force-dynamic";

type ArchiveDraftRequestContext = {
  params: Promise<{ requestId: string }>;
};

export async function POST(request: Request, { params }: ArchiveDraftRequestContext) {
  const unauthorized = await requireRouteRole(["customer", "admin"]);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const { requestId } = await params;
    const draft = await getCustomerRequestByIdForCurrentSession(requestId);

    if (!draft) {
      return NextResponse.json({ error: "Draft request not found." }, { status: 404 });
    }

    if (draft.status !== "DRAFT") {
      return NextResponse.json({ error: "Only draft requests can be archived." }, { status: 400 });
    }

    const body = (await request.json().catch(() => ({}))) as { reason?: unknown };
    const archived = await archiveDraftRequest(requestId, typeof body.reason === "string" ? body.reason : "");

    return NextResponse.json({ request: archived });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Unable to archive draft request.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
