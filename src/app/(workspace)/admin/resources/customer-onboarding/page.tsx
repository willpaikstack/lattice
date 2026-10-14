import { requirePageRole } from "@/lib/route-authorization";
import { CustomerOnboardingDraft } from "@/components/customer-onboarding-draft";

export default async function CustomerOnboardingPreviewPage() {
  await requirePageRole(["admin"]);
  return <CustomerOnboardingDraft />;
}
