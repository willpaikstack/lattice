import { MaterialFamilyAtlas } from "@/components/material-family-atlas";
import { materialFamilies } from "@/lib/material-family-view-models";

export default function MaterialsPage() {
  return (
    <div className="min-h-screen pb-14">
      <MaterialFamilyAtlas families={materialFamilies} />
    </div>
  );
}
