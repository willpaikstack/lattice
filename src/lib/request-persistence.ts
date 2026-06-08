import type { DraftRequestInput, LatticeRequest } from "./request-model";
import { buildDraftRequest, submitDraftRequest } from "./request-model";

export const storedRequestInclude = {
  buyerCompany: true,
  lineItems: true,
  files: true,
  supplierQuoteFiles: {
    orderBy: {
      createdAt: "asc",
    },
  },
  supplierDocuments: {
    orderBy: {
      createdAt: "asc",
    },
  },
  supplierUpdates: {
    orderBy: {
      createdAt: "asc",
    },
  },
  supplierQuotes: {
    orderBy: {
      createdAt: "asc",
    },
  },
  customerQuotes: {
    orderBy: {
      versionNumber: "asc",
    },
  },
  statusEvents: {
    orderBy: {
      createdAt: "asc",
    },
  },
} as const;

export type StoredRequest = {
  id: string;
  title: string;
  process: string;
  dueDate: Date | null;
  status: LatticeRequest["status"];
  buyerCompany: { name: string } | null;
  requesterName: string;
  requesterEmail?: string;
  requesterPhone?: string;
  shipToName?: string;
  shipToCompany?: string;
  shipToAddress1?: string;
  shipToAddress2?: string;
  shipToCity?: string;
  shipToState?: string;
  shipToZipCode?: string;
  shipToPhone?: string;
  operatorCompleteness: LatticeRequest["operatorReview"]["completeness"];
  assignedOwner: string | null;
  internalNotes: string;
  supplierPackageNotes: string;
  supplierOrderStatus?: LatticeRequest["supplierOrder"]["status"];
  supplierShopName?: string;
  supplierContactName?: string;
  supplierNotes?: string;
  supplierTrackingNumber?: string;
  estimatedPriceCents: number | null;
  leadTimeDays: number | null;
  shippingCostCents: number | null;
  shippingMethod: string;
  shippingTerms: string;
  estimatedDeliveryDate: Date | null;
  quoteCreatedDate: Date | null;
  quoteValidUntil: Date | null;
  quoteSummary: string;
  isArchived?: boolean;
  revisionOfRequestId?: string | null;
  revisionNumber?: number;
  revisionChangeLog?: string[];
  lineItems: Array<{
    id: string;
    partName: string;
    quantity: number;
    material: string;
    generalTolerance: string;
    surfaceFinish: string;
    qualityDocumentation: string[];
    notes: string;
  }>;
  files: Array<{
    id: string;
    name: string;
    sizeBytes: number;
    type: string;
    storageKey: string | null;
  }>;
  supplierDocuments?: Array<{
    id: string;
    name: string;
    sizeBytes: number;
    type: string;
    category: LatticeRequest["supplierOrder"]["documents"][number]["category"];
    createdAt: Date;
  }>;
  supplierQuoteFiles?: Array<{
    id: string;
    name: string;
    sizeBytes: number;
    type: string;
    storageKey: string | null;
    createdAt: Date;
  }>;
  supplierUpdates?: Array<{
    id: string;
    status: LatticeRequest["supplierOrder"]["status"];
    note: string;
    trackingNumber: string;
    createdAt: Date;
  }>;
  supplierQuotes?: Array<{
    id: string;
    shopName: string;
    country: string;
    contactName: string;
    status: LatticeRequest["supplierQuotes"][number]["status"];
    priceCents: number | null;
    leadTimeDays: number | null;
    notes: string;
    quotedAt: Date | null;
    isSelected: boolean;
  }>;
  customerQuotes?: Array<{
    id: string;
    versionNumber: number;
    quoteNumber: string;
    quoteDate: Date | null;
    validUntil: Date | null;
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
    lineItems: unknown;
    totalCents: number;
    markdown: string;
    issuedAt: Date;
  }>;
  statusEvents: Array<{
    id: string;
    from: LatticeRequest["status"] | null;
    to: LatticeRequest["status"];
    actor: LatticeRequest["statusEvents"][number]["actor"] | string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
};

function toDueDate(dueDate: string) {
  return new Date(`${dueDate}T00:00:00.000Z`);
}

function toOptionalDate(date: string) {
  return date ? new Date(`${date}T00:00:00.000Z`) : null;
}

function formatDueDate(dueDate: Date | null) {
  return dueDate ? dueDate.toISOString().slice(0, 10) : "";
}

function normalizeActor(actor: string): LatticeRequest["statusEvents"][number]["actor"] {
  if (actor === "buyer" || actor === "operator" || actor === "supplier" || actor === "system") {
    return actor;
  }
  return "system";
}

function formatOptionalDate(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

function mapCustomerQuoteLineItems(lineItems: unknown): LatticeRequest["customerQuotes"][number]["lineItems"] {
  if (!Array.isArray(lineItems)) {
    return [];
  }

  return lineItems.map((item, index) => {
    const record = item && typeof item === "object" ? (item as Record<string, unknown>) : {};

    return {
      id: typeof record.id === "string" ? record.id : `line-${index + 1}`,
      description: typeof record.description === "string" ? record.description : "",
      process: typeof record.process === "string" ? record.process : "",
      material: typeof record.material === "string" ? record.material : "",
      finish: typeof record.finish === "string" ? record.finish : "",
      quantity: typeof record.quantity === "number" ? record.quantity : 0,
      unitPrice: typeof record.unitPrice === "number" ? record.unitPrice : 0,
      leadTimeDays: typeof record.leadTimeDays === "number" ? record.leadTimeDays : null,
    };
  });
}

export function buildSubmittedRequestCreateInput(input: DraftRequestInput) {
  const submitted = submitDraftRequest(buildDraftRequest(input));

  return {
    title: submitted.title,
    process: submitted.process,
    dueDate: toDueDate(submitted.dueDate),
    status: submitted.status,
    requesterName: submitted.requesterName,
    requesterEmail: submitted.requesterEmail,
    requesterPhone: submitted.requesterPhone,
    shipToName: submitted.shipToName,
    shipToCompany: submitted.shipToCompany,
    shipToAddress1: submitted.shipToAddress1,
    shipToAddress2: submitted.shipToAddress2,
    shipToCity: submitted.shipToCity,
    shipToState: submitted.shipToState,
    shipToZipCode: submitted.shipToZipCode,
    shipToPhone: submitted.shipToPhone,
    operatorCompleteness: submitted.operatorReview.completeness,
    assignedOwner: submitted.operatorReview.assignedOwner,
    internalNotes: submitted.operatorReview.internalNotes,
    supplierPackageNotes: submitted.operatorReview.supplierPackageNotes,
    supplierOrderStatus: submitted.supplierOrder.status,
    supplierShopName: submitted.supplierOrder.shopName,
    supplierContactName: submitted.supplierOrder.contactName,
    supplierNotes: submitted.supplierOrder.notes,
    supplierTrackingNumber: submitted.supplierOrder.trackingNumber,
    estimatedPriceCents: submitted.quote.estimatedPriceCents,
    leadTimeDays: submitted.quote.leadTimeDays,
    shippingCostCents: submitted.quote.shippingCostCents,
    shippingMethod: submitted.quote.shippingMethod,
    shippingTerms: submitted.quote.shippingTerms,
    estimatedDeliveryDate: toOptionalDate(submitted.quote.estimatedDeliveryDate),
    quoteCreatedDate: toOptionalDate(submitted.quote.quoteCreatedDate),
    quoteValidUntil: toOptionalDate(submitted.quote.quoteValidUntil),
    quoteSummary: submitted.quote.summary,
    isArchived: submitted.isArchived,
    revisionOfRequestId: submitted.revisionOfRequestId,
    revisionNumber: submitted.revisionNumber,
    revisionChangeLog: submitted.revisionChangeLog,
    buyerCompany: {
      create: {
        name: submitted.buyerCompany,
      },
    },
    lineItems: {
      create: submitted.lineItems.map((item) => ({
        partName: item.partName,
        quantity: item.quantity,
        material: item.material,
        generalTolerance: item.generalTolerance ?? "",
        surfaceFinish: item.surfaceFinish ?? "",
        qualityDocumentation: item.qualityDocumentation ?? [],
        notes: item.notes ?? "",
      })),
    },
    files: {
      create: submitted.files.map((file) => ({
        name: file.name,
        sizeBytes: file.sizeBytes,
        type: file.type,
        storageKey: file.storageKey,
      })),
    },
    statusEvents: {
      create: submitted.statusEvents.map((event) => ({
        from: event.from,
        to: event.to,
        actor: event.actor,
      })),
    },
  };
}

export function mapStoredRequest(stored: StoredRequest): LatticeRequest {
  return {
    id: stored.id,
    buyerCompany: stored.buyerCompany?.name ?? "Unknown buyer",
    requesterName: stored.requesterName,
    requesterEmail: stored.requesterEmail ?? "",
    requesterPhone: stored.requesterPhone ?? "",
    shipToName: stored.shipToName ?? stored.requesterName,
    shipToCompany: stored.shipToCompany ?? stored.buyerCompany?.name ?? "",
    shipToAddress1: stored.shipToAddress1 ?? "",
    shipToAddress2: stored.shipToAddress2 ?? "",
    shipToCity: stored.shipToCity ?? "",
    shipToState: stored.shipToState ?? "",
    shipToZipCode: stored.shipToZipCode ?? "",
    shipToPhone: stored.shipToPhone ?? stored.requesterPhone ?? "",
    title: stored.title,
    process: stored.process,
    dueDate: formatDueDate(stored.dueDate),
    status: stored.status,
    lineItems: stored.lineItems.map((item) => ({
      id: item.id,
      partName: item.partName,
      quantity: item.quantity,
      material: item.material,
      generalTolerance: item.generalTolerance,
      surfaceFinish: item.surfaceFinish,
      qualityDocumentation: item.qualityDocumentation,
      notes: item.notes,
    })),
    files: stored.files.map((file) => ({
      id: file.id,
      name: file.name,
      sizeBytes: file.sizeBytes,
      type: file.type,
      storageKey: file.storageKey ?? undefined,
    })),
    operatorReview: {
      completeness: stored.operatorCompleteness,
      assignedOwner: stored.assignedOwner,
      internalNotes: stored.internalNotes,
      supplierPackageNotes: stored.supplierPackageNotes,
    },
    supplierOrder: {
      status: stored.supplierOrderStatus ?? "AWAITING_ACKNOWLEDGMENT",
      shopName: stored.supplierShopName ?? "China supplier team",
      contactName: stored.supplierContactName ?? "",
      notes: stored.supplierNotes ?? "",
      trackingNumber: stored.supplierTrackingNumber ?? "",
      documents: (stored.supplierDocuments ?? []).map((document) => ({
        id: document.id,
        name: document.name,
        sizeBytes: document.sizeBytes,
        type: document.type,
        category: document.category,
        uploadedAt: document.createdAt.toISOString(),
      })),
      updates: (stored.supplierUpdates ?? []).map((update) => ({
        id: update.id,
        status: update.status,
        note: update.note,
        trackingNumber: update.trackingNumber,
        createdAt: update.createdAt.toISOString(),
      })),
    },
    supplierQuoteFiles: (stored.supplierQuoteFiles ?? []).map((file) => ({
      id: file.id,
      name: file.name,
      sizeBytes: file.sizeBytes,
      type: file.type,
      storageKey: file.storageKey ?? undefined,
      uploadedAt: file.createdAt.toISOString(),
    })),
    supplierQuotes: (stored.supplierQuotes ?? []).map((quote) => ({
      id: quote.id,
      shopName: quote.shopName,
      country: quote.country,
      contactName: quote.contactName,
      status: quote.status,
      priceCents: quote.priceCents,
      leadTimeDays: quote.leadTimeDays,
      notes: quote.notes,
      quotedAt: quote.quotedAt?.toISOString() ?? null,
      isSelected: quote.isSelected,
    })),
    customerQuotes: (stored.customerQuotes ?? []).map((quote) => ({
      id: quote.id,
      versionNumber: quote.versionNumber,
      quoteNumber: quote.quoteNumber,
      quoteDate: formatOptionalDate(quote.quoteDate),
      validUntil: formatOptionalDate(quote.validUntil),
      customerCompany: quote.customerCompany,
      customerContact: quote.customerContact,
      projectName: quote.projectName,
      preparedBy: quote.preparedBy,
      leadTime: quote.leadTime,
      shipping: quote.shipping,
      tax: quote.tax,
      notes: quote.notes,
      assumptions: quote.assumptions,
      clarifications: quote.clarifications,
      filesReviewed: quote.filesReviewed,
      lineItems: mapCustomerQuoteLineItems(quote.lineItems),
      totalCents: quote.totalCents,
      markdown: quote.markdown,
      issuedAt: quote.issuedAt.toISOString(),
    })),
    isArchived: stored.isArchived ?? false,
    quote: {
      estimatedPriceCents: stored.estimatedPriceCents,
      leadTimeDays: stored.leadTimeDays,
      shippingCostCents: stored.shippingCostCents,
      shippingMethod: stored.shippingMethod ?? "",
      shippingTerms: stored.shippingTerms ?? "",
      estimatedDeliveryDate: formatOptionalDate(stored.estimatedDeliveryDate),
      quoteCreatedDate: formatOptionalDate(stored.quoteCreatedDate),
      quoteValidUntil: formatOptionalDate(stored.quoteValidUntil),
      summary: stored.quoteSummary,
    },
    revisionOfRequestId: stored.revisionOfRequestId ?? null,
    revisionNumber: stored.revisionNumber ?? 1,
    revisionChangeLog: stored.revisionChangeLog ?? [],
    statusEvents: stored.statusEvents.map((event) => ({
      id: event.id,
      from: event.from,
      to: event.to,
      actor: normalizeActor(event.actor),
      at: event.createdAt.toISOString(),
    })),
    createdAt: stored.createdAt.toISOString(),
    updatedAt: stored.updatedAt.toISOString(),
  };
}
