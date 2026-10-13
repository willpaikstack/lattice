import { redirect } from "next/navigation";
import { EquipmentExplorer } from "@/components/equipment-explorer";
import { getEquipmentExplorerData } from "@/lib/equipment-explorer-data";
import { getCurrentSession } from "@/lib/session";

export default async function EquipmentExplorerPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?redirect_url=%2Fequipment-explorer");
  if (session.user.role === "supplier") redirect("/supplier/orders");
  return <EquipmentExplorer equipment={getEquipmentExplorerData()} />;
}
