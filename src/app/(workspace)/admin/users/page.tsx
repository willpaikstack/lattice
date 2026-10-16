import type { Metadata } from "next";
import { AdminUserDirectory } from "@/components/admin-user-directory";
import { listPlatformUsers } from "@/lib/admin-users";
import { requirePageRole } from "@/lib/route-authorization";

export const metadata: Metadata = { title: "Users | Lattice" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requirePageRole(["admin"]);
  const users = await listPlatformUsers();
  return <AdminUserDirectory users={users} />;
}
