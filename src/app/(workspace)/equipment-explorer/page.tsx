import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";

export default async function EquipmentExplorerPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?redirect_url=%2Fequipment-explorer");
  if (session.user.role === "supplier") redirect("/supplier/orders");
  // Archived for now; preserve the explorer component and data for restoration.
  redirect("/equipment");
}
