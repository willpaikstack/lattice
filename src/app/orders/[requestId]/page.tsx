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

  return <BuyerOrderDetail order={customerSafeRequest(order)} />;
}
