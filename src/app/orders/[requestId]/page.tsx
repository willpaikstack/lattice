import { notFound } from "next/navigation";

import { BuyerOrderDetail } from "@/components/buyer-order-detail";
import { getRequestById } from "@/lib/request-repository";

export const dynamic = "force-dynamic";

type BuyerOrderDetailPageProps = {
  params: Promise<{ requestId: string }>;
};

export default async function BuyerOrderDetailPage({ params }: BuyerOrderDetailPageProps) {
  const { requestId } = await params;
  const order = await getRequestById(requestId);

  if (!order || order.status !== "PURCHASED") {
    notFound();
  }

  return <BuyerOrderDetail order={order} />;
}
