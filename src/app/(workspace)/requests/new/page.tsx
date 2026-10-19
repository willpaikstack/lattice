import { materialOfferingFor, materialConditionFor, materialSelectionLabel } from "@/lib/material-quote-offerings";
import { canonicalMaterialValue } from "@/lib/rfq-material-search";
import { RequestForm } from "@/components/request-form";
import { filterCustomerVisibleRequests, getCustomerRequestByIdForCurrentSession } from "@/lib/request-access-policy";
import { listBuyerQuotes } from "@/lib/request-repository";
import {
  draftInitialState,
  isResumeCandidate,
  orderReference,
  reorderInitialState,
} from "@/lib/request-form-prefill";
import { getCurrentSession } from "@/lib/session";

type NewRequestPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewRequestPage({ searchParams }: NewRequestPageProps) {
  const params = searchParams ? await searchParams : {};
  const reorderId = firstParam(params.reorder);
  const draftId = firstParam(params.draft);
  const requestedMaterial = canonicalMaterialValue(firstParam(params.material) ?? "");
  const offering = materialOfferingFor(requestedMaterial);
  const initialMaterial = !draftId && !reorderId && offering?.variants.length && !materialConditionFor(requestedMaterial)?.sourcing ? requestedMaterial : undefined;
  const [reorderSource, draftSource, buyerQuotes, session] = await Promise.all([
    reorderId ? getCustomerRequestByIdForCurrentSession(reorderId) : Promise.resolve(null),
    draftId ? getCustomerRequestByIdForCurrentSession(draftId) : Promise.resolve(null),
    listBuyerQuotes(),
    getCurrentSession(),
  ]);
  const visibleBuyerQuotes = filterCustomerVisibleRequests(buyerQuotes, session);
  const editableDraft = draftSource?.status === "DRAFT" ? draftSource : null;
  const initialState = reorderSource ? reorderInitialState(reorderSource) : editableDraft ? draftInitialState(editableDraft) : undefined;

  return (
    <RequestForm
      key={draftId ?? reorderId ?? `new-request:${initialMaterial ?? ""}`}
      toleranceDesign={firstParam(params.toleranceDesign) === "legacy" ? "legacy" : firstParam(params.toleranceDesign) === "cards" ? "cards" : process.env.LATTICE_TOLERANCE_DESIGN === "legacy" ? "legacy" : "cards"}
      initialState={initialState}
      initialMaterial={initialMaterial}
      localDraftId={draftId}
      prefillNotice={
        reorderSource
          ? `Reorder draft prepared from ${orderReference(reorderSource)}. Review the copied part, files, material, tolerance, finish, quantity, and timing before submitting.`
          : editableDraft
            ? "Incomplete RFQ reopened. Finish the missing details, then click Request Quote when it is ready for Lattice review."
          : initialMaterial ? `Selected material: ${materialSelectionLabel(initialMaterial)}. Upload your CAD file and review the material and condition for this part.` : undefined
      }
      resumeRequests={visibleBuyerQuotes.filter(isResumeCandidate)}
    />
  );
}
