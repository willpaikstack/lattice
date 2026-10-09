import { CustomerQualityApproval } from "@/components/customer-quality-approval";
import { getCurrentSession } from "@/lib/session";
import { notFound } from "next/navigation";

import { BuyerOrderDetail } from "@/components/buyer-order-detail";
import { customerSafeRequest } from "@/lib/customer-partner-privacy";
import { getCustomerRequestByIdForCurrentSession } from "@/lib/request-access-policy";

export const dynamic = "force-dynamic";

type BuyerOrderDetailPageProps = {
  params: Promise<{ requestId: string }>;
};

export default async function BuyerOrderDetailPage({ params }: BuyerOrderDetailPageProps) {
  const { requestId } = await params;
  const order = await getCustomerRequestByIdForCurrentSession(requestId);

  if (!order || order.status !== "PURCHASED") {
    notFound();
  }

  const session = await getCurrentSession();
  return <div className="space-y-5">{order.requiresQualityApproval && <CustomerQualityApproval requestId={order.id} approvedAt={order.qualityApprovedAt} canApprove={session?.user.customerRole === "admin" && !session.user.supportAdmin} />}<BuyerOrderDetail order={customerSafeRequest(order)} /></div>;
}
