export type RequestStatus = "DRAFT" | "SUBMITTED" | "NEEDS_INFO" | "READY_FOR_SUPPLIER_RFQ" | "QUOTED" | "PURCHASED";

export type OperatorCompleteness = "READY_FOR_REVIEW" | "MISSING_INFO" | "COMPLETE";

export type RequestLineItemInput = {
  partName: string;
  quantity: number;
  material: string;
  generalTolerance?: string;
  surfaceFinish?: string;
  qualityDocumentation?: string[];
  notes?: string;
};

export type UploadedFileInput = {
  name: string;
  sizeBytes: number;
  type: string;
};

export type DraftRequestInput = {
  buyerCompany: string;
  requesterName: string;
  title: string;
  process: string;
  dueDate: string;
  lineItems: RequestLineItemInput[];
  files: UploadedFileInput[];
};

export type RequestLineItem = RequestLineItemInput & {
  id: string;
};

export type UploadedFile = UploadedFileInput & {
  id: string;
};

export type StatusEvent = {
  id: string;
  from: RequestStatus | null;
  to: RequestStatus;
  actor: "buyer" | "operator" | "system";
  at: string;
};

export type OperatorReview = {
  completeness: OperatorCompleteness;
  assignedOwner: string | null;
  internalNotes: string;
  supplierPackageNotes: string;
};

export type LatticeRequest = {
  id: string;
  buyerCompany: string;
  requesterName: string;
  title: string;
  process: string;
  dueDate: string;
  status: RequestStatus;
  lineItems: RequestLineItem[];
  files: UploadedFile[];
  operatorReview: OperatorReview;
  quote: QuoteSummary;
  statusEvents: StatusEvent[];
  createdAt: string;
  updatedAt: string;
};

const nowIso = () => new Date().toISOString();

const makeId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

function assertText(value: string, label: string) {
  if (!value.trim()) {
    throw new Error(`${label} is required`);
  }
}

function assertValidDraft(input: DraftRequestInput) {
  assertText(input.buyerCompany, "Buyer company");
  assertText(input.requesterName, "Requester name");
  assertText(input.title, "Request title");
  assertText(input.process, "Manufacturing process");
  assertText(input.dueDate, "Due date");

  if (input.lineItems.length === 0) {
    throw new Error("At least one line item is required");
  }

  input.lineItems.forEach((item, index) => {
    assertText(item.partName, `Line item ${index + 1} part name`);
    assertText(item.material, `Line item ${index + 1} material`);
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      throw new Error(`Line item ${index + 1} quantity must be greater than zero`);
    }
  });
}

export function buildDraftRequest(input: DraftRequestInput): LatticeRequest {
  assertValidDraft(input);

  const timestamp = nowIso();
  const request: LatticeRequest = {
    id: makeId("req"),
    buyerCompany: input.buyerCompany.trim(),
    requesterName: input.requesterName.trim(),
    title: input.title.trim(),
    process: input.process.trim(),
    dueDate: input.dueDate,
    status: "DRAFT",
    lineItems: input.lineItems.map((item) => ({
      id: makeId("line"),
      partName: item.partName.trim(),
      quantity: item.quantity,
      material: item.material.trim(),
      generalTolerance: item.generalTolerance?.trim() || "",
      surfaceFinish: item.surfaceFinish?.trim() || "",
      qualityDocumentation: item.qualityDocumentation ?? [],
      notes: item.notes?.trim() || "",
    })),
    files: input.files.map((file) => ({
      id: makeId("file"),
      name: file.name,
      sizeBytes: file.sizeBytes,
      type: file.type,
    })),
    operatorReview: {
      completeness: "READY_FOR_REVIEW",
      assignedOwner: null,
      internalNotes: "",
      supplierPackageNotes: "",
    },
    quote: {
      estimatedPriceCents: null,
      leadTimeDays: null,
      summary: "",
    },
    statusEvents: [
      {
        id: makeId("event"),
        from: null,
        to: "DRAFT",
        actor: "buyer",
        at: timestamp,
      },
    ],
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return request;
}

export function submitDraftRequest(draft: LatticeRequest): LatticeRequest {
  if (draft.status !== "DRAFT") {
    throw new Error("Only draft requests can be submitted");
  }

  if (draft.files.length === 0) {
    throw new Error("At least one file is required before submission");
  }

  const timestamp = nowIso();

  return {
    ...draft,
    status: "SUBMITTED",
    operatorReview: {
      ...draft.operatorReview,
      completeness: "READY_FOR_REVIEW",
    },
    statusEvents: [
      ...draft.statusEvents,
      {
        id: makeId("event"),
        from: "DRAFT",
        to: "SUBMITTED",
        actor: "buyer",
        at: timestamp,
      },
    ],
    updatedAt: timestamp,
  };
}

export type QuoteSummary = {
  estimatedPriceCents: number | null;
  leadTimeDays: number | null;
  summary: string;
};

export type OperatorStatusUpdateInput = {
  status: Extract<RequestStatus, "SUBMITTED" | "NEEDS_INFO" | "READY_FOR_SUPPLIER_RFQ" | "QUOTED">;
  assignedOwner?: string | null;
  internalNotes?: string;
  supplierPackageNotes?: string;
  estimatedPriceCents?: number | null;
  leadTimeDays?: number | null;
  quoteSummary?: string;
};

function completenessForStatus(status: OperatorStatusUpdateInput["status"]): OperatorCompleteness {
  if (status === "NEEDS_INFO") {
    return "MISSING_INFO";
  }

  if (status === "READY_FOR_SUPPLIER_RFQ" || status === "QUOTED") {
    return "COMPLETE";
  }

  return "READY_FOR_REVIEW";
}

export function applyOperatorStatusUpdate(
  request: LatticeRequest,
  input: OperatorStatusUpdateInput,
): LatticeRequest {
  if (request.status === "DRAFT" || request.status === "PURCHASED") {
    throw new Error("This request cannot be updated from the operator review screen");
  }

  const timestamp = nowIso();
  const nextStatus = input.status;

  return {
    ...request,
    status: nextStatus,
    operatorReview: {
      completeness: completenessForStatus(nextStatus),
      assignedOwner: input.assignedOwner?.trim() || null,
      internalNotes: input.internalNotes?.trim() || "",
      supplierPackageNotes: input.supplierPackageNotes?.trim() || "",
    },
    quote: {
      estimatedPriceCents: input.estimatedPriceCents ?? request.quote.estimatedPriceCents,
      leadTimeDays: input.leadTimeDays ?? request.quote.leadTimeDays,
      summary: input.quoteSummary?.trim() || request.quote.summary,
    },
    statusEvents: request.status === nextStatus
      ? request.statusEvents
      : [
          ...request.statusEvents,
          {
            id: makeId("event"),
            from: request.status,
            to: nextStatus,
            actor: "operator",
            at: timestamp,
          },
        ],
    updatedAt: timestamp,
  };
}
