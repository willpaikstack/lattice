import { notFound } from "next/navigation";

import { BuyerOrderHelp } from "@/components/buyer-order-help";
import { customerSafeRequest } from "@/lib/customer-partner-privacy";
import { getCustomerRequestByIdForCurrentSession } from "@/lib/request-access-policy";

export const dynamic = "force-dynamic";

type BuyerOrderHelpPageProps = {
  params: Promise<{ requestId: string }>;
};

export default async function BuyerOrderHelpPage({ params }: BuyerOrderHelpPageProps) {
  const { requestId } = await params;
  const order = await getCustomerRequestByIdForCurrentSession(requestId);

  if (!order || order.status !== "PURCHASED") {
    notFound();
  }

  return <BuyerOrderHelp order={customerSafeRequest(order)} />;
}
