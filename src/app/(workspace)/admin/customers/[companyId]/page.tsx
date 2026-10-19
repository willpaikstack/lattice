import { requirePageRole } from "@/lib/route-authorization";
import { notFound } from "next/navigation";

import { AdminCustomerProfileDetail } from "@/components/admin-customer-profile-detail";
import { getCustomerProfile } from "@/lib/customer-profiles";

import { deleteCustomerCompanyAction, updateCustomerProfileAction } from "./actions";

export const dynamic = "force-dynamic";

type AdminCustomerProfilePageProps = {
  params: Promise<{ companyId: string }>;
};

export default async function AdminCustomerProfilePage({ params }: AdminCustomerProfilePageProps) {
  await requirePageRole(["admin"]);
  const { companyId } = await params;
  const profile = await getCustomerProfile(companyId);

  if (!profile) {
    notFound();
  }

  return <AdminCustomerProfileDetail deleteAction={deleteCustomerCompanyAction.bind(null, profile.id)} profile={profile} updateAction={updateCustomerProfileAction.bind(null, profile.id)} />;
}
