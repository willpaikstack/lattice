import { requirePageRole } from "@/lib/route-authorization";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  await requirePageRole(["admin"]);
  redirect("/admin/quotes");
}
