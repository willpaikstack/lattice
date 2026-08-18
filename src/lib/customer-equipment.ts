import "server-only";

import { customerEquipmentGuidance } from "./customer-partner-privacy";
import { vendorEquipment, type EquipmentDataSheet, type EquipmentSection, type VendorEquipment } from "./vendor-equipment";

/**
 * The only equipment shape that may cross into the customer client bundle.
 * Internal supplier and provenance fields deliberately do not exist here.
 */
export type CustomerEquipment = Pick<
  VendorEquipment,
  | "slug"
  | "section"
  | "name"
  | "makeModel"
  | "quantity"
  | "customerQuantityLabel"
  | "imagePath"
  | "imageKind"
  | "summary"
  | "details"
  | "onlineSpecificationUrl"
> & {
  dataSheets?: Pick<EquipmentDataSheet, "label" | "url">[];
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function customerFacingEquipmentText(equipment: VendorEquipment, value: string) {
  const internalReferences = [equipment.vendor, equipment.source.vendor, equipment.source.document]
    .filter((reference): reference is string => Boolean(reference?.trim()))
    .sort((a, b) => b.length - a.length);

  return customerEquipmentGuidance(
    internalReferences.reduce(
      (copy, reference) => copy.replace(new RegExp(escapeRegExp(reference), "gi"), "the partner network"),
      value,
    ),
  )
    .replace(/\blisted by the partner network\b/gi, "documented")
    .replace(/\bthe partner network lists\b/gi, "Documented")
    .replace(/\bfrom the partner network\b/gi, "from the network")
    .replace(/\bthe partner network\s+the partner network\b/gi, "the partner network")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function toCustomerEquipment(equipment: VendorEquipment, index: number): CustomerEquipment {
  return {
    // Internal slugs frequently encode a supplier name. Customer-side DOM ids do
    // not need that provenance, so use an opaque stable catalog identifier.
    slug: `equipment-${index + 1}`,
    section: equipment.section as EquipmentSection,
    name: customerFacingEquipmentText(equipment, equipment.name),
    makeModel: customerFacingEquipmentText(equipment, equipment.makeModel),
    quantity: equipment.quantity,
    customerQuantityLabel: equipment.customerQuantityLabel,
    imagePath: equipment.imagePath,
    imageKind: equipment.imageKind,
    summary: customerFacingEquipmentText(equipment, equipment.summary),
    details: equipment.details.map((detail) => ({
      label: customerFacingEquipmentText(equipment, detail.label),
      value: customerFacingEquipmentText(equipment, detail.value),
    })),
    onlineSpecificationUrl: equipment.onlineSpecificationUrl,
    dataSheets: equipment.dataSheets?.map(({ label, url }) => ({ label, url })),
  };
}

export const customerEquipment = vendorEquipment.map(toCustomerEquipment);
