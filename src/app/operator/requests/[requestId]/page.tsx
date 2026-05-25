import { notFound } from "next/navigation";

import { OperatorRequestDetail } from "@/components/operator-request-detail";
import { getRequestById } from "@/lib/request-repository";

import { updateOperatorRequestStatusAction } from "./actions";

export const dynamic = "force-dynamic";

type OperatorRequestDetailPageProps = {
  params: Promise<{ requestId: string }>;
};

export default async function OperatorRequestDetailPage({ params }: OperatorRequestDetailPageProps) {
  const { requestId } = await params;
  const request = await getRequestById(requestId);

  if (!request) {
    notFound();
  }

  return <OperatorRequestDetail request={request} updateAction={updateOperatorRequestStatusAction.bind(null, request.id)} />;
}
