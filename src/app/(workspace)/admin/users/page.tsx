import type { Metadata } from "next";
import { AdminUserDirectory } from "@/components/admin-user-directory";
import { listPlatformUsers } from "@/lib/admin-users";
import { requirePageRole } from "@/lib/route-authorization";
import { deletePlatformUserAction, resendPlatformUserInvitationAction } from "./actions";

export const metadata: Metadata = { title: "Users | Lattice" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await requirePageRole(["admin"]);
  const users = await listPlatformUsers();
  return <AdminUserDirectory currentUserId={session.user.id} deleteUserAction={deletePlatformUserAction} resendInvitationAction={resendPlatformUserInvitationAction} users={users} />;
}
