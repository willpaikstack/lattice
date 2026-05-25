import { OperatorQueue } from "@/components/operator-queue";
import { listOperatorRequests } from "@/lib/request-repository";

export const dynamic = "force-dynamic";

export default async function OperatorRequestsPage() {
  const requests = await listOperatorRequests();

  return <OperatorQueue requests={requests} />;
}
