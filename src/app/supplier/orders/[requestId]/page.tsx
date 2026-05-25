import { notFound } from "next/navigation";

import { SupplierOrderDetail } from "@/components/supplier-order-detail";
import { getRequestById } from "@/lib/request-repository";

import { updateSupplierOrderAction } from "./actions";

export const dynamic = "force-dynamic";

type SupplierOrderDetailPageProps = {
  params: Promise<{ requestId: string }>;
};

export default async function SupplierOrderDetailPage({ params }: SupplierOrderDetailPageProps) {
  const { requestId } = await params;
  const order = await getRequestById(requestId);

  if (!order || order.status !== "PURCHASED") {
    notFound();
  }

  return <SupplierOrderDetail order={order} updateAction={updateSupplierOrderAction.bind(null, order.id)} />;
}
