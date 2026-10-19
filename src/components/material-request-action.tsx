import Link from "next/link";
import { catalogMaterialAction } from "@/lib/material-quote-offerings";

export function MaterialRequestAction({ familyName, grade, condition, showCondition = true }: { familyName: string; grade: string; condition?: string; showCondition?: boolean }) {
  const action = catalogMaterialAction(familyName, grade, condition);
  return <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
    {showCondition && condition ? <span className="text-[#505257]">Condition: {condition}</span> : null}
    <Link href={action.href} aria-label={`${action.label} for ${grade}${condition ? ` ${condition}` : ""}`} className="inline-flex min-h-10 items-center font-medium text-[#0969c3] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0969c3]">{action.label} →</Link>
  </div>;
}
