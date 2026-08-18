export type RequestStatus = "DRAFT" | "SUBMITTED" | "NEEDS_INFO" | "READY_FOR_SUPPLIER_RFQ" | "QUOTED" | "PURCHASED" | "CLOSED";

export type RequestOrigin = "ACCOUNT" | "GUEST_SIMPLE_QUOTE";

export type OperatorCompleteness = "READY_FOR_REVIEW" | "MISSING_INFO" | "COMPLETE";

export type SupplierOrderStatus =
  | "AWAITING_ACKNOWLEDGMENT"
  | "IN_PRODUCTION"
  | "QC_IN_PROGRESS"
  | "DOCUMENTS_UPLOADED"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "DELIVERED";

export type OrderResponsibleParty = "Lattice" | "Supplier" | "Customer";

export const supplierOrderStatusSequence: SupplierOrderStatus[] = [
  "AWAITING_ACKNOWLEDGMENT",
  "IN_PRODUCTION",
  "QC_IN_PROGRESS",
  "DOCUMENTS_UPLOADED",
  "READY_TO_SHIP",
  "SHIPPED",
  "DELIVERED",
];

export function canTransitionSupplierOrderStatus(from: SupplierOrderStatus, to: SupplierOrderStatus) {
  return supplierOrderStatusSequence.indexOf(to) >= supplierOrderStatusSequence.indexOf(from);
}

export type SupplierDocumentCategory =
  | "INSPECTION_REPORT"
  | "MATERIAL_CERT"
  | "CERTIFICATE_OF_CONFORMANCE"
  | "PHOTO"
  | "PACKING_SLIP"
  | "OTHER";

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
  storageKey?: string;
  cadPreviewUrn?: string;
};

export type RequestContactSnapshot = {
  requesterEmail: string;
  requesterPhone: string;
  shipToAddress1: string;
  shipToAddress2: string;
  shipToCity: string;
  shipToCompany: string;
  shipToName: string;
  shipToPhone: string;
  shipToState: string;
  shipToZipCode: string;
};

export type DraftRequestInput = {
  buyerCompany: string;
  contact?: Partial<RequestContactSnapshot>;
  guestAccessTokenExpiresAt?: string | null;
  guestAccessTokenHash?: string;
  requestOrigin?: RequestOrigin;
  requesterName: string;
  title: string;
  process: string;
  dueDate: string;
  revision?: {
    changeLog: string[];
    revisionNumber: number;
    sourceQuoteReference?: string;
    sourceRequestId: string;
  };
  lineItems: RequestLineItemInput[];
  files: UploadedFileInput[];
};

export type RequestLineItem = RequestLineItemInput & {
  id: string;
};

export type UploadedFile = UploadedFileInput & {
  id: string;
};

export type SupplierQuoteAttachment = UploadedFile & {
  uploadedAt: string;
};

export type PurchasePaymentMethod = "CARD" | "PURCHASE_ORDER";

export type PurchasePaymentStatus = "PENDING_REVIEW" | "PAYMENT_PENDING" | "PAID" | "PAYMENT_FAILED";

export type CustomerPurchaseOrderAttachment = UploadedFile & {
  uploadedAt: string;
};

export type PurchasePaymentSnapshot = {
  method: PurchasePaymentMethod | null;
  status: PurchasePaymentStatus | null;
  customerPoNumber: string;
  accountsPayableEmail: string;
  buyerCheckoutNotes: string;
  card: {
    id: string;
    brand: string;
    last4: string;
    holder: string;
    expires: string;
  } | null;
  stripe: {
    amountCents: number | null;
    checkoutSessionId: string;
    currency: string;
    paidAt: string | null;
    paymentIntentId: string;
  };
};

export type SupplierDocument = {
  id: string;
  name: string;
  sizeBytes: number;
  type: string;
  category: SupplierDocumentCategory;
  uploadedAt: string;
};

export type SupplierUpdate = {
  id: string;
  status: SupplierOrderStatus;
  note: string;
  trackingNumber: string;
  actor?: "operator" | "supplier";
  createdAt: string;
};

export type SupplierOrder = {
  status: SupplierOrderStatus;
  shopName: string;
  contactName: string;
  notes: string;
  trackingNumber: string;
  nextMilestone: string;
  nextMilestoneDate: string;
  responsibleParty: OrderResponsibleParty;
  documents: SupplierDocument[];
  updates: SupplierUpdate[];
};

export type SupplierQuoteStatus = "INVITED" | "QUOTE_RECEIVED" | "DECLINED" | "SELECTED";

export type SupplierQuoteLineItemSnapshot = {
  id: string;
  description: string;
  drawingRevision: string;
  finish: string;
  inspection: string;
  leadTimeDays: number | null;
  material: string;
  process: string;
  quantity: number;
  supplierNotes: string;
  unitPrice: number;
};

export type SupplierQuote = {
  id: string;
  shopName: string;
  country: string;
  contactName: string;
  status: SupplierQuoteStatus;
  priceCents: number | null;
  leadTimeDays: number | null;
  notes: string;
  quotedAt: string | null;
  isSelected: boolean;
  lineItems: SupplierQuoteLineItemSnapshot[];
};

export type CustomerQuoteLineItemSnapshot = {
  id: string;
  description: string;
  process: string;
  material: string;
  finish: string;
  quantity: number;
  unitPrice: number;
  leadTimeDays?: number | null;
};

export type CustomerQuoteVersion = {
  id: string;
  versionNumber: number;
  quoteNumber: string;
  quoteDate: string;
  validUntil: string;
  customerCompany: string;
  customerContact: string;
  projectName: string;
  preparedBy: string;
  leadTime: string;
  shipping: string;
  tax: string;
  notes: string;
  assumptions: string;
  clarifications: string;
  filesReviewed: string;
  lineItems: CustomerQuoteLineItemSnapshot[];
  totalCents: number;
  markdown: string;
  issuedAt: string;
};

export function quotedLineForRequestItem(
  quotedLines: CustomerQuoteLineItemSnapshot[] | undefined,
  lineItem: Pick<RequestLineItem, "id" | "partName">,
) {
  if (!quotedLines?.length) {
    return null;
  }

  return quotedLines.find((line) => line.id === lineItem.id) ?? quotedLines.find((line) => line.description === lineItem.partName) ?? null;
}

export type StatusEvent = {
  id: string;
  from: RequestStatus | null;
  to: RequestStatus;
  actor: "buyer" | "operator" | "supplier" | "system";
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
  buyerCompanyId?: string | null;
  guestAccessTokenExpiresAt: string | null;
  guestAccessTokenHash: string;
  requestOrigin: RequestOrigin;
  requesterEmail: string;
  requesterName: string;
  requesterPhone: string;
  shipToAddress1: string;
  shipToAddress2: string;
  shipToCity: string;
  shipToCompany: string;
  shipToName: string;
  shipToPhone: string;
  shipToState: string;
  shipToZipCode: string;
  title: string;
  process: string;
  dueDate: string;
  status: RequestStatus;
  lineItems: RequestLineItem[];
  files: UploadedFile[];
  operatorReview: OperatorReview;
  supplierOrder: SupplierOrder;
  supplierQuoteFiles: SupplierQuoteAttachment[];
  customerPurchaseOrderAttachment: CustomerPurchaseOrderAttachment | null;
  supplierQuotes: SupplierQuote[];
  customerQuotes: CustomerQuoteVersion[];
  purchasePayment: PurchasePaymentSnapshot;
  isArchived: boolean;
  quote: QuoteSummary;
  revisionOfRequestId: string | null;
  revisionNumber: number;
  revisionChangeLog: string[];
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

function text(value: string | undefined) {
  return value?.trim() ?? "";
}

export function requestShipToCityLine(request: Partial<RequestContactSnapshot>) {
  return [request.shipToCity, [request.shipToState, request.shipToZipCode].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
}

export function requestShipToLines(request: Partial<RequestContactSnapshot>) {
  return [
    request.shipToName,
    request.shipToCompany,
    request.shipToAddress1,
    request.shipToAddress2,
    requestShipToCityLine(request),
    request.shipToPhone,
  ].filter(Boolean) as string[];
}

function contactSnapshotForDraft(input: DraftRequestInput): RequestContactSnapshot {
  const contact = input.contact ?? {};
  const requesterPhone = text(contact.requesterPhone);

  return {
    requesterEmail: text(contact.requesterEmail),
    requesterPhone,
    shipToAddress1: text(contact.shipToAddress1),
    shipToAddress2: text(contact.shipToAddress2),
    shipToCity: text(contact.shipToCity),
    shipToCompany: text(contact.shipToCompany) || input.buyerCompany.trim(),
    shipToName: text(contact.shipToName) || input.requesterName.trim(),
    shipToPhone: text(contact.shipToPhone) || requesterPhone,
    shipToState: text(contact.shipToState),
    shipToZipCode: text(contact.shipToZipCode),
  };
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
  const contact = contactSnapshotForDraft(input);
  const request: LatticeRequest = {
    id: makeId("req"),
    buyerCompany: input.buyerCompany.trim(),
    buyerCompanyId: null,
    guestAccessTokenExpiresAt: input.guestAccessTokenExpiresAt ?? null,
    guestAccessTokenHash: input.guestAccessTokenHash?.trim() ?? "",
    requestOrigin: input.requestOrigin ?? "ACCOUNT",
    requesterEmail: contact.requesterEmail,
    requesterName: input.requesterName.trim(),
    requesterPhone: contact.requesterPhone,
    shipToAddress1: contact.shipToAddress1,
    shipToAddress2: contact.shipToAddress2,
    shipToCity: contact.shipToCity,
    shipToCompany: contact.shipToCompany,
    shipToName: contact.shipToName,
    shipToPhone: contact.shipToPhone,
    shipToState: contact.shipToState,
    shipToZipCode: contact.shipToZipCode,
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
      storageKey: file.storageKey,
      cadPreviewUrn: file.cadPreviewUrn,
    })),
    operatorReview: {
      completeness: "READY_FOR_REVIEW",
      assignedOwner: null,
      internalNotes: "",
      supplierPackageNotes: "",
    },
    supplierOrder: {
      status: "AWAITING_ACKNOWLEDGMENT",
      shopName: "China supplier team",
      contactName: "",
      notes: "",
      trackingNumber: "",
      nextMilestone: "Supplier acknowledgment",
      nextMilestoneDate: "",
      responsibleParty: "Supplier",
      documents: [],
      updates: [],
    },
    supplierQuoteFiles: [],
    customerPurchaseOrderAttachment: null,
    supplierQuotes: [],
    customerQuotes: [],
    purchasePayment: {
      method: null,
      status: null,
      customerPoNumber: "",
      accountsPayableEmail: "",
      buyerCheckoutNotes: "",
      card: null,
      stripe: {
        amountCents: null,
        checkoutSessionId: "",
        currency: "",
        paidAt: null,
        paymentIntentId: "",
      },
    },
    isArchived: false,
    quote: {
      estimatedPriceCents: null,
      leadTimeDays: null,
      shippingCostCents: null,
      shippingMethod: "",
      shippingTerms: "",
      estimatedDeliveryDate: "",
      quoteCreatedDate: "",
      quoteValidUntil: "",
      summary: "",
    },
    revisionOfRequestId: input.revision?.sourceRequestId.trim() || null,
    revisionNumber: Math.max(1, input.revision?.revisionNumber ?? 1),
    revisionChangeLog: input.revision?.changeLog.map((line) => line.trim()).filter(Boolean) ?? [],
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
  shippingCostCents: number | null;
  shippingMethod: string;
  shippingTerms: string;
  estimatedDeliveryDate: string;
  quoteCreatedDate: string;
  quoteValidUntil: string;
  summary: string;
};

export type OperatorStatusUpdateInput = {
  status: Extract<RequestStatus, "SUBMITTED" | "NEEDS_INFO" | "READY_FOR_SUPPLIER_RFQ" | "QUOTED" | "CLOSED">;
  assignedOwner?: string | null;
  internalNotes?: string;
  supplierPackageNotes?: string;
  estimatedPriceCents?: number | null;
  leadTimeDays?: number | null;
  shippingCostCents?: number | null;
  shippingMethod?: string;
  shippingTerms?: string;
  estimatedDeliveryDate?: string;
  quoteCreatedDate?: string;
  quoteValidUntil?: string;
  quoteSummary?: string;
};

export type SupplierOrderUpdateInput = {
  status: SupplierOrderStatus;
  actor?: "operator" | "supplier";
  assignedOwner?: string | null;
  shopName?: string;
  contactName?: string;
  notes?: string;
  nextMilestone?: string;
  nextMilestoneDate?: string;
  responsibleParty?: OrderResponsibleParty;
  trackingNumber?: string;
  documents?: Array<{
    name: string;
    sizeBytes: number;
    type: string;
    category: SupplierDocumentCategory;
  }>;
};

function completenessForStatus(status: OperatorStatusUpdateInput["status"]): OperatorCompleteness {
  if (status === "NEEDS_INFO") {
    return "MISSING_INFO";
  }

  if (status === "READY_FOR_SUPPLIER_RFQ" || status === "QUOTED" || status === "CLOSED") {
    return "COMPLETE";
  }

  return "READY_FOR_REVIEW";
}

export function applyOperatorStatusUpdate(
  request: LatticeRequest,
  input: OperatorStatusUpdateInput,
): LatticeRequest {
  if (request.status === "DRAFT" || request.status === "PURCHASED" || request.status === "CLOSED") {
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
      estimatedPriceCents: input.estimatedPriceCents !== undefined ? input.estimatedPriceCents : request.quote.estimatedPriceCents,
      leadTimeDays: input.leadTimeDays !== undefined ? input.leadTimeDays : request.quote.leadTimeDays,
      shippingCostCents: input.shippingCostCents !== undefined ? input.shippingCostCents : request.quote.shippingCostCents,
      shippingMethod: input.shippingMethod ?? request.quote.shippingMethod,
      shippingTerms: input.shippingTerms ?? request.quote.shippingTerms,
      estimatedDeliveryDate: input.estimatedDeliveryDate ?? request.quote.estimatedDeliveryDate,
      quoteCreatedDate: input.quoteCreatedDate ?? request.quote.quoteCreatedDate,
      quoteValidUntil: input.quoteValidUntil ?? request.quote.quoteValidUntil,
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

export function applySupplierOrderUpdate(
  request: LatticeRequest,
  input: SupplierOrderUpdateInput,
): LatticeRequest {
  if (request.status !== "PURCHASED") {
    throw new Error("Only purchased orders can be updated from the supplier portal");
  }

  if (!canTransitionSupplierOrderStatus(request.supplierOrder.status, input.status)) {
    throw new Error("Order status cannot move backward. Add a customer update or contact an administrator to correct a recorded milestone.");
  }

  const timestamp = nowIso();
  const actor = input.actor ?? "supplier";
  const note = input.notes?.trim() ?? "";

  if (actor === "operator" && !note) {
    throw new Error("A customer-facing update is required when Lattice changes order progress");
  }
  const nextDocuments = (input.documents ?? []).map((document) => ({
    id: makeId("supplier_doc"),
    name: document.name,
    sizeBytes: document.sizeBytes,
    type: document.type,
    category: document.category,
    uploadedAt: timestamp,
  }));
  const trackingNumber = input.trackingNumber?.trim() || request.supplierOrder.trackingNumber;

  return {
    ...request,
    supplierOrder: {
      status: input.status,
      shopName: input.shopName?.trim() || request.supplierOrder.shopName,
      contactName: input.contactName?.trim() || request.supplierOrder.contactName,
      notes: note || request.supplierOrder.notes,
      trackingNumber,
      nextMilestone: input.nextMilestone === undefined ? request.supplierOrder.nextMilestone : input.nextMilestone.trim(),
      nextMilestoneDate: input.nextMilestoneDate === undefined ? request.supplierOrder.nextMilestoneDate : input.nextMilestoneDate,
      responsibleParty: input.responsibleParty ?? request.supplierOrder.responsibleParty,
      documents: [...request.supplierOrder.documents, ...nextDocuments],
      updates: [
        ...request.supplierOrder.updates,
        {
          id: makeId("supplier_update"),
          status: input.status,
          note,
          trackingNumber,
          actor,
          createdAt: timestamp,
        },
      ],
    },
    statusEvents: [
      ...request.statusEvents,
      {
        id: makeId("event"),
        from: request.status,
        to: request.status,
        actor,
        at: timestamp,
      },
    ],
    operatorReview: {
      ...request.operatorReview,
      assignedOwner: input.assignedOwner === undefined ? request.operatorReview.assignedOwner : input.assignedOwner?.trim() || null,
    },
    updatedAt: timestamp,
  };
}
