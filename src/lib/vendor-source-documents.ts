export type VendorSourceDocument = {
  id: string;
  vendor: string;
  title: string;
  documentDate: string;
  receivedDate: string;
  repositoryPath: string;
  originalFileName: string;
  documentType: "catalog" | "equipment-list" | "materials-list" | "capability-deck" | "factory-profile" | "quality-certificate" | "quality-procedure";
  extractionNotes: string;
};

export const vendorSourceDocuments = {
  sakyCatalog: {
    id: "saky-catalog",
    vendor: "Saky Steel",
    title: "SAKY STEEL Alloy Bar/Sheet/Strip/Pipe/Flange/Wire Catalog",
    documentDate: "unknown",
    receivedDate: "2026-05-29",
    repositoryPath: "docs/vendor-sources/saky-steel/saky-catalog.pdf",
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
    repositoryPath: "docs/vendor-sources/zytc/zytc-catalogue.pdf",
    originalFileName: "catalogue.pdf",
    documentType: "catalog",
    extractionNotes:
      "Image-based vendor catalog covering nickel/cobalt alloys, stainless steel, titanium, and alloy steel forms with AMS/ASTM/BS/UNS reference tables.",
  },
  zytcAlloy617Brochure: {
    id: "zytc-alloy-617-brochure",
    vendor: "Tianjin ZYTC Alloy Technology Co., Ltd",
    title: "HAYNES 617 Alloy Brochure",
    documentDate: "2020-06-12",
    receivedDate: "2025-12-18",
    repositoryPath: "docs/vendor-sources/zytc/zytc-alloy-617-brochure.pdf",
    originalFileName: "617-brochure.pdf",
    documentType: "catalog",
    extractionNotes:
      "HAYNES International technical brochure shared by Dominic at ZYTC. It describes UNS N06617 composition, high-temperature performance, fabrication, and typical applications; treat it as material-reference evidence, not a current ZYTC availability commitment.",
  },
  zytcAlloy625Brochure: {
    id: "zytc-alloy-625-brochure",
    vendor: "Tianjin ZYTC Alloy Technology Co., Ltd",
    title: "HAYNES 625 Alloy Brochure",
    documentDate: "2020-06-12",
    receivedDate: "2025-12-18",
    repositoryPath: "docs/vendor-sources/zytc/zytc-alloy-625-brochure.pdf",
    originalFileName: "625-brochure.pdf",
    documentType: "catalog",
    extractionNotes:
      "HAYNES International technical brochure shared by Dominic at ZYTC. It describes UNS N06625 composition, mechanical/thermal performance, fabrication, and heat treatment; treat it as material-reference evidence, not a current ZYTC availability commitment.",
  },
  bestPrototypesEquipment: {
    id: "best-prototypes-equipment-list",
    vendor: "Best Prototypes",
    title: "Machine Tool Equipment, Inspection Equipment, Die Casting, and 3D Printing Equipment",
    documentDate: "unknown",
    receivedDate: "2026-05-29",
    repositoryPath: "docs/vendor-sources/best-prototypes/best-prototypes-equipment-list.pdf",
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
    repositoryPath: "docs/vendor-sources/zintilon/zintilon-general-materials-list-20250613.xlsx",
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
    repositoryPath: "docs/vendor-sources/zintilon/zintilon-qc-equipment-list-20260123.pdf",
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
    receivedDate: "2025-08-25",
    repositoryPath: "docs/vendor-sources/zintilon/zintilon-processing-equipment-list-20250812.pdf",
    originalFileName: "2. Zintilon Processing Equipment List 20250812.pdf",
    documentType: "equipment-list",
    extractionNotes:
      "Original file received from Zintilon as part of its August 2025 factory-profile package and archived for equipment-repository provenance.",
  },
  zintilonSheetMetal: {
    id: "zintilon-sheet-metal-processing-capability",
    vendor: "Zintilon",
    title: "Zintilon Sheet Metal Processing Capability",
    documentDate: "2024-11-15",
    receivedDate: "2025-08-25",
    repositoryPath: "docs/vendor-sources/zintilon/zintilon-sheet-metal-processing-capability-20241115.pdf",
    originalFileName: "4. Zintilon Sheet Metal Processing Capability 20241115.pdf",
    documentType: "capability-deck",
    extractionNotes:
      "Original file received from Zintilon as part of its August 2025 factory-profile package and archived for equipment-repository provenance.",
  },
  zintilonQc20250612: {
    id: "zintilon-qc-equipment-list-20250612",
    vendor: "Zintilon",
    title: "Zintilon QC Equipment List",
    documentDate: "2025-06-12",
    receivedDate: "2025-08-25",
    repositoryPath: "docs/vendor-sources/zintilon/zintilon-qc-equipment-list-20250612.pdf",
    originalFileName: "3. Zintilon QC Equipment List 20250612.pdf",
    documentType: "equipment-list",
    extractionNotes:
      "Earlier Zintilon QC equipment list received with the August 2025 factory-profile package; retained as historical source evidence alongside the 2026 calibration-plan list.",
  },
  zintilonProfile20250815: {
    id: "zintilon-profile-20250815-meeting",
    vendor: "Zintilon",
    title: "Zintilon Profile — August 15, 2025 Meeting",
    documentDate: "2025-08-15",
    receivedDate: "2025-08-25",
    repositoryPath: "docs/vendor-sources/zintilon/zintilon-profile-20250815-meeting.pdf",
    originalFileName: "1. Zintilon Profile 20250815 Meeting.pdf",
    documentType: "factory-profile",
    extractionNotes:
      "Factory profile received from Claire Liao following the August 2025 visit and document request.",
  },
  zintilonCertificates20250108: {
    id: "zintilon-certificates-20250108",
    vendor: "Zintilon",
    title: "Zintilon Certificates",
    documentDate: "2025-01-08",
    receivedDate: "2025-08-25",
    repositoryPath: "docs/vendor-sources/zintilon/zintilon-certificates-20250108.rar",
    originalFileName: "5. Zintilon Certificates 2025.1.8.rar",
    documentType: "quality-certificate",
    extractionNotes:
      "Certificate archive received with the August 2025 factory-profile package; retain the original archive and validate individual certificates before customer-facing use.",
  },
  yijinIso9001: {
    id: "yijin-iso-9001",
    vendor: "Shenzhen Yijin Hardware Co., Ltd. (Yijin Solution)",
    title: "Yijin ISO 9001 Certificate",
    documentDate: "unknown",
    receivedDate: "2025-08-25",
    repositoryPath: "docs/vendor-sources/yijin-solution/yijin-iso-9001.pdf",
    originalFileName: "ISO9001.pdf",
    documentType: "quality-certificate",
    extractionNotes:
      "Certificate provided by Anna Qiu in response to the certification and equipment-list request. Validate scope and validity before relying on it in customer-facing claims.",
  },
  yijinIso14001: {
    id: "yijin-iso-14001",
    vendor: "Shenzhen Yijin Hardware Co., Ltd. (Yijin Solution)",
    title: "Yijin ISO 14001 Certificate",
    documentDate: "unknown",
    receivedDate: "2025-08-25",
    repositoryPath: "docs/vendor-sources/yijin-solution/yijin-iso-14001.pdf",
    originalFileName: "ISO14001.pdf",
    documentType: "quality-certificate",
    extractionNotes:
      "Certificate provided by Anna Qiu in response to the certification and equipment-list request. Validate scope and validity before relying on it in customer-facing claims.",
  },
  yijinEquipment: {
    id: "yijin-equipment-list",
    vendor: "Shenzhen Yijin Hardware Co., Ltd. (Yijin Solution)",
    title: "Yijin Equipment List",
    documentDate: "unknown",
    receivedDate: "2025-08-25",
    repositoryPath: "docs/vendor-sources/yijin-solution/yijin-equipment-list.pdf",
    originalFileName: "Equipment list.pdf",
    documentType: "equipment-list",
    extractionNotes:
      "Equipment list provided by Anna Qiu in response to the certification and equipment-list request; review and normalize before adding capabilities to the customer-facing repository.",
  },
  bestPartsEquipment: {
    id: "best-parts-equipment-list",
    vendor: "Best Parts",
    title: "Best Parts Equipment List",
    documentDate: "unknown",
    receivedDate: "2026-07-22",
    repositoryPath: "docs/vendor-sources/best-parts/best-parts-equipment-list.pdf",
    originalFileName: "BST equipment list.pdf",
    documentType: "equipment-list",
    extractionNotes:
      "General equipment list provided by Samantha following the Best Parts meeting.",
  },
  bestPartsInspectionEquipment: {
    id: "best-parts-inspection-equipment-list",
    vendor: "Best Parts",
    title: "Best Parts Inspection Equipment List",
    documentDate: "unknown",
    receivedDate: "2026-07-22",
    repositoryPath: "docs/vendor-sources/best-parts/best-parts-inspection-equipment-list.pdf",
    originalFileName: "BST Inspection equipment list.pdf",
    documentType: "equipment-list",
    extractionNotes:
      "Inspection-equipment list provided by Samantha following the Best Parts meeting; relevant to measurement and quality capability review.",
  },
  bestPartsMaterials: {
    id: "best-parts-machinable-materials",
    vendor: "Best Parts",
    title: "Best Parts Machinable Materials",
    documentDate: "unknown",
    receivedDate: "2026-07-22",
    repositoryPath: "docs/vendor-sources/best-parts/best-parts-machinable-materials.png",
    originalFileName: "Machinable materials.png",
    documentType: "materials-list",
    extractionNotes:
      "Machinable-materials image provided by Samantha following the Best Parts meeting; normalize material names and specifications before adding customer-facing availability.",
  },
  juchengTraceabilityProcedure: {
    id: "jucheng-traceability-control-procedure",
    vendor: "Shenzhen Jucheng Precision Model Co., Ltd.",
    title: "Jucheng Identification and Traceability Control Procedure",
    documentDate: "unknown",
    receivedDate: "2025-08-25",
    repositoryPath: "docs/vendor-sources/jucheng-precision/jucheng-traceability-control-procedure.doc",
    originalFileName: "JC-QP-16标识与可追溯性控制程序.doc",
    documentType: "quality-procedure",
    extractionNotes:
      "Traceability-control procedure attached to Eileen Liang's August 2025 meeting summary. It is reusable quality-process evidence, separate from order-specific inspection reports.",
  },
} satisfies Record<string, VendorSourceDocument>;

export type VendorSourceDocumentId = (typeof vendorSourceDocuments)[keyof typeof vendorSourceDocuments]["id"];
