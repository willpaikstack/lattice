export type VendorSourceDocument = {
  id: string;
  vendor: string;
  title: string;
  documentDate: string;
  receivedDate: string;
  repositoryPath: string;
  originalFileName: string;
  documentType: "catalog" | "equipment-list" | "materials-list" | "capability-deck";
  extractionNotes: string;
};

export const vendorSourceDocuments = {
  sakyCatalog: {
    id: "saky-catalog",
    vendor: "Saky Steel",
    title: "SAKY STEEL Alloy Bar/Sheet/Strip/Pipe/Flange/Wire Catalog",
    documentDate: "unknown",
    receivedDate: "2026-05-29",
    repositoryPath: "docs/vendor-sources/saky-catalog.pdf",
    originalFileName: "saky-catalog.pdf",
    documentType: "catalog",
    extractionNotes:
      "Vendor catalog with nickel, duplex stainless, precision alloy, 904L/Alloy 20, Monel, Hastelloy, and related material forms/specifications.",
  },
  zytcCatalogue: {
    id: "zytc-catalogue",
    vendor: "Tianjin ZYTC Alloy Technology Co., Ltd",
    title: "Your Alloy Expert Catalog",
    documentDate: "unknown",
    receivedDate: "2026-05-29",
    repositoryPath: "docs/vendor-sources/zytc-catalogue.pdf",
    originalFileName: "catalogue.pdf",
    documentType: "catalog",
    extractionNotes:
      "Image-based vendor catalog covering nickel/cobalt alloys, stainless steel, titanium, and alloy steel forms with AMS/ASTM/BS/UNS reference tables.",
  },
  bestPrototypesEquipment: {
    id: "best-prototypes-equipment-list",
    vendor: "Best Prototypes",
    title: "Machine Tool Equipment, Inspection Equipment, Die Casting, and 3D Printing Equipment",
    documentDate: "unknown",
    receivedDate: "2026-05-29",
    repositoryPath: "docs/vendor-sources/best-prototypes-equipment-list.pdf",
    originalFileName: "best_prototypes_equipment_list.pdf",
    documentType: "equipment-list",
    extractionNotes:
      "Vendor equipment list with CNC milling, inspection, die casting, and 3D printing capacity. Several table fields are sparse and should be verified before customer-facing use.",
  },
  zintilonMaterials20250613: {
    id: "zintilon-general-materials-list-20250613",
    vendor: "Zintilon",
    title: "ZTL's General Materials List (Ongoing update 250613)",
    documentDate: "2025-06-13",
    receivedDate: "2026-05-29",
    repositoryPath: "docs/vendor-sources/zintilon-general-materials-list-20250613.xlsx",
    originalFileName: "Zintilons_General_Materials_List_(Ongoing_update250613).xlsx",
    documentType: "materials-list",
    extractionNotes:
      "Spreadsheet source for Zintilon material availability across aluminum, steels, stainless steels, other metals, and plastics.",
  },
  zintilonQc20260123: {
    id: "zintilon-qc-equipment-list-20260123",
    vendor: "Zintilon",
    title: "Zintilon QC Equipment List & 2026 Calibration Plan",
    documentDate: "2026-01-23",
    receivedDate: "2026-05-29",
    repositoryPath: "docs/vendor-sources/zintilon-qc-equipment-list-20260123.pdf",
    originalFileName: "Zintilon_QC_Equipment_List_-_E_20260123.pdf",
    documentType: "equipment-list",
    extractionNotes:
      "Current Zintilon QC equipment and calibration-plan source, replacing the earlier 2025 calibration-list reference for admin provenance.",
  },
  zintilonProcessing: {
    id: "zintilon-processing-equipment-statistics",
    vendor: "Zintilon",
    title: "Zintilon CNC Milling Machine and Lathe Machine Statistics Table",
    documentDate: "2025-08-12",
    receivedDate: "unknown",
    repositoryPath: "docs/vendor-sources/not-yet-archived/zintilon-processing-equipment-statistics",
    originalFileName: "not-yet-archived",
    documentType: "equipment-list",
    extractionNotes:
      "Previously entered source used by the existing equipment repository. Original file should be added to docs/vendor-sources when available.",
  },
  zintilonSheetMetal: {
    id: "zintilon-sheet-metal-processing-capability",
    vendor: "Zintilon",
    title: "Zintilon Sheet Metal Processing Capability",
    documentDate: "2024-11-15",
    receivedDate: "unknown",
    repositoryPath: "docs/vendor-sources/not-yet-archived/zintilon-sheet-metal-processing-capability",
    originalFileName: "not-yet-archived",
    documentType: "capability-deck",
    extractionNotes:
      "Previously entered sheet metal capability source used by the existing equipment repository. Original file should be added to docs/vendor-sources when available.",
  },
} satisfies Record<string, VendorSourceDocument>;

export type VendorSourceDocumentId = (typeof vendorSourceDocuments)[keyof typeof vendorSourceDocuments]["id"];

