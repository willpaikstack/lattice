import { AdminActivityDashboard } from "@/components/admin-activity-dashboard";
import { buildAdminActivitySummary } from "@/lib/admin-activity";
import { listAdminRequests } from "@/lib/request-repository";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const requests = await listAdminRequests();
  const summary = buildAdminActivitySummary(requests);

  return <AdminActivityDashboard summary={summary} />;
}
