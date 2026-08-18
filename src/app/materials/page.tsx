import { MaterialFamilyCatalog } from "@/components/material-family-catalog";
import { materialFamilies } from "@/lib/material-family-view-models";

export default function MaterialsPage() {
  return (
    <div className="min-h-screen pb-14">
      <MaterialFamilyCatalog families={materialFamilies} />
    </div>
  );
}
