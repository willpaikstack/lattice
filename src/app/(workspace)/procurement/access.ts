import "server-only";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/route-authorization";
export async function procurementCompany() { const { user } = await requirePageRole(["customer"]); if (!user.companyId || user.supportAdmin) redirect("/dashboard"); return user.companyId; }
