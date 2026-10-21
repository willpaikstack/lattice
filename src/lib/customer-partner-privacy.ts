/**
 * Customer-facing copy must never disclose the identity or contact details of
 * Lattice's manufacturing partners. Keep supplier data in the order model for
 * admin and supplier workflows, but use these neutral labels on buyer routes.
 */
export const customerPartnerPrivacy = {
  networkLabel: "Lattice manufacturing network",
  partnerLabel: "Manufacturing partner",
  progressUpdate: "Lattice is coordinating the next production milestone and will post the next update here.",
} as const;

export function customerDocumentName(category: string) {
  const labels: Record<string, string> = {
    CERTIFICATE_OF_CONFORMANCE: "Certificate of conformance",
    INSPECTION_REPORT: "Inspection report",
    MATERIAL_CERT: "Material certification",
    PACKING_SLIP: "Packing slip",
    PHOTO: "Production photo",
  };

  return labels[category] ?? "Production document";
}

export function customerEquipmentGuidance(value: string) {
  const internalPartnerPattern = "(?:Best Prototypes|Best Parts|Zintilon|Yijin Solution|Jucheng Precision(?: \\(JC Proto\\))?|Saky Steel|Tianjin ZYTC Alloy Technology Co\\.,? Ltd)";

  return value
    .replace(new RegExp(`^${internalPartnerPattern} lists?\\s*`, "i"), "Documented ")
    .replace(new RegExp(`\\blisted by ${internalPartnerPattern}\\b`, "gi"), "")
    .replace(new RegExp(`\\bfrom ${internalPartnerPattern}\\b`, "gi"), "")
    .replace(new RegExp(`\\bcurrent ${internalPartnerPattern} list\\b`, "gi"), "current inventory")
    .replace(new RegExp(`\\b${internalPartnerPattern}\\b`, "gi"), "")
    .replace(/\s+\./g, ".")
    .replace(/\s{2,}/g, " ")
    .trim();
}
