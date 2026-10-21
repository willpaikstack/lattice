import { customerSafeRequest } from "@/lib/customer-request";
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
  const [reorderSource, draftSource, buyerQuotes, session] = await Promise.all([
    reorderId ? getCustomerRequestByIdForCurrentSession(reorderId) : Promise.resolve(null),
    draftId ? getCustomerRequestByIdForCurrentSession(draftId) : Promise.resolve(null),
    listBuyerQuotes(),
    getCurrentSession(),
  ]);
  const visibleBuyerQuotes = filterCustomerVisibleRequests(buyerQuotes, session).map(customerSafeRequest);
  const editableDraft = draftSource?.status === "DRAFT" ? draftSource : null;
  const initialState = reorderSource ? reorderInitialState(customerSafeRequest(reorderSource)) : editableDraft ? draftInitialState(customerSafeRequest(editableDraft)) : undefined;

  return (
    <RequestForm
      key={draftId ?? reorderId ?? "new-request"}
      toleranceDesign={firstParam(params.toleranceDesign) === "legacy" ? "legacy" : firstParam(params.toleranceDesign) === "cards" ? "cards" : process.env.LATTICE_TOLERANCE_DESIGN === "legacy" ? "legacy" : "cards"}
      initialState={initialState}
      localDraftId={draftId}
      prefillNotice={
        reorderSource
          ? `Reorder draft prepared from ${orderReference(reorderSource)}. Review the copied part, files, material, tolerance, finish, quantity, and timing before submitting.`
          : editableDraft
            ? "Incomplete RFQ reopened. Finish the missing details, then click Request Quote when it is ready for Lattice review."
          : undefined
      }
      resumeRequests={visibleBuyerQuotes.filter(isResumeCandidate)}
    />
  );
}
