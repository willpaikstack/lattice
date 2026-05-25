import type { DraftRequestInput, LatticeRequest } from "./request-model";
import { buildDraftRequest, submitDraftRequest } from "./request-model";

export const storedRequestInclude = {
  buyerCompany: true,
  lineItems: true,
  files: true,
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
  statusEvents: {
    orderBy: {
      createdAt: "asc",
    },
  },
} as const;

type StoredRequest = {
  id: string;
  title: string;
  process: string;
  dueDate: Date | null;
  status: LatticeRequest["status"];
  buyerCompany: { name: string } | null;
  requesterName: string;
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
  quoteSummary: string;
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
  }>;
  supplierDocuments?: Array<{
    id: string;
    name: string;
    sizeBytes: number;
    type: string;
    category: LatticeRequest["supplierOrder"]["documents"][number]["category"];
    createdAt: Date;
  }>;
  supplierUpdates?: Array<{
    id: string;
    status: LatticeRequest["supplierOrder"]["status"];
    note: string;
    trackingNumber: string;
    createdAt: Date;
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

function formatDueDate(dueDate: Date | null) {
  return dueDate ? dueDate.toISOString().slice(0, 10) : "";
}

function normalizeActor(actor: string): LatticeRequest["statusEvents"][number]["actor"] {
  if (actor === "buyer" || actor === "operator" || actor === "supplier" || actor === "system") {
    return actor;
  }
  return "system";
}

export function buildSubmittedRequestCreateInput(input: DraftRequestInput) {
  const submitted = submitDraftRequest(buildDraftRequest(input));

  return {
    title: submitted.title,
    process: submitted.process,
    dueDate: toDueDate(submitted.dueDate),
    status: submitted.status,
    requesterName: submitted.requesterName,
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
    quoteSummary: submitted.quote.summary,
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
    quote: {
      estimatedPriceCents: stored.estimatedPriceCents,
      leadTimeDays: stored.leadTimeDays,
      summary: stored.quoteSummary,
    },
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
