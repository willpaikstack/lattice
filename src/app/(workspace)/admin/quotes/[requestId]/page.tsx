import { notFound } from "next/navigation";
import { AdminRfqDetail } from "@/components/admin-rfq-detail";
import { getRequestById } from "@/lib/request-repository";
import { requireActionRole } from "@/lib/route-authorization";

export const dynamic = "force-dynamic";

export default async function AdminRfqPage({ params }: { params: Promise<{ requestId: string }> }) {
  await requireActionRole(["admin"]);
  const { requestId } = await params;
  const request = await getRequestById(requestId, { requireDatabase: true });
  if (!request) notFound();
  return <AdminRfqDetail request={request} />;
}
