import { requirePageRole } from "@/lib/route-authorization";
import { CadDemo } from "@/components/cad-demo";

export default async function CadViewerDemoPage() {
  await requirePageRole(["admin"]);
  return <CadDemo />;
}
