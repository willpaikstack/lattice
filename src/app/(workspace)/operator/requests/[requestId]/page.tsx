import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type OperatorRequestDetailPageProps = {
  params: Promise<{ requestId: string }>;
};

export default async function OperatorRequestDetailPage({ params }: OperatorRequestDetailPageProps) {
  const { requestId } = await params;
  redirect(`/admin/quotes?requestId=${encodeURIComponent(requestId)}`);
}
