import { redirect } from "next/navigation";

import { getCurrentSession } from "@/lib/session";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");
  return children;
}
