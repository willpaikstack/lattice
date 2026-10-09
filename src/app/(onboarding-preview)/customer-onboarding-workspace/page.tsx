import { redirect } from "next/navigation";
import { CustomerOnboardingWorkspace } from "@/components/customer-onboarding-workspace";
import { CustomerDashboardView } from "@/components/customer-dashboard-view";
import { buildCustomerDashboardSummary } from "@/lib/customer-dashboard";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Isolated customer chrome; access remains restricted to Lattice operators. */
export default async function OnboardingWorkspacePreview() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");
  return <CustomerOnboardingWorkspace><CustomerDashboardView dashboard={buildCustomerDashboardSummary([], [])} userName="Carmen" /></CustomerOnboardingWorkspace>;
}
