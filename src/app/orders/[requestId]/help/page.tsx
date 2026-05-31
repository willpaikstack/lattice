import { notFound } from "next/navigation";

import { BuyerOrderHelp } from "@/components/buyer-order-help";
import { getRequestById } from "@/lib/request-repository";

export const dynamic = "force-dynamic";

type BuyerOrderHelpPageProps = {
  params: Promise<{ requestId: string }>;
};

export default async function BuyerOrderHelpPage({ params }: BuyerOrderHelpPageProps) {
  const { requestId } = await params;
  const order = await getRequestById(requestId);

  if (!order || order.status !== "PURCHASED") {
    notFound();
  }

  return <BuyerOrderHelp order={order} />;
}
