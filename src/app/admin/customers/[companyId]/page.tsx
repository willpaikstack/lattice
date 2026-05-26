import { notFound } from "next/navigation";

import { AdminCustomerProfileDetail } from "@/components/admin-customer-profile-detail";
import { getCustomerProfile } from "@/lib/customer-profiles";

import { updateCustomerProfileAction } from "./actions";

export const dynamic = "force-dynamic";

type AdminCustomerProfilePageProps = {
  params: Promise<{ companyId: string }>;
};

export default async function AdminCustomerProfilePage({ params }: AdminCustomerProfilePageProps) {
  const { companyId } = await params;
  const profile = await getCustomerProfile(companyId);

  if (!profile) {
    notFound();
  }

  return <AdminCustomerProfileDetail profile={profile} updateAction={updateCustomerProfileAction.bind(null, profile.id)} />;
}
