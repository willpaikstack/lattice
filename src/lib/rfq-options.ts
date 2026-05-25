export type RfqOption = {
  value: string;
  label: string;
};

// Owned-code lookup tables extracted from Bubble runtime option sets.
// Keep Bubble db_value strings as stable values; display labels can be refined locally.
export const rfqMaterialOptions: RfqOption[] = [
  { value: "ss_303", label: "SS 303" },
  { value: "ss_304", label: "SS 304" },
  { value: "ss_316", label: "SS 316" },
  { value: "ss_300", label: "SS 300 series" },
  { value: "in_625", label: "IN 625" },
  { value: "pvc", label: "PVC" },
];

export const processOptions: RfqOption[] = [
  { value: "cnc_milling", label: "CNC Milling" },
  { value: "cnc_turning", label: "CNC Turning" },
  { value: "sheet_metal_fabrication", label: "Sheet Metal Fabrication" },
  { value: "injection_molding_services", label: "Injection Molding Services" },
  { value: "selective_laser_sintering__sls_", label: "Selective Laser Sintering (SLS)" },
  { value: "fused_deposition_modeling__fdm_", label: "Fused Deposition Modeling (FDM)" },
];

export const generalToleranceOptions: RfqOption[] = [
  { value: "iso_2768_medium__m_", label: "ISO 2768 Medium (m)" },
  { value: "iso_2768_fine__f_", label: "ISO 2768 Fine (f)" },
];

export const surfaceFinishOptions: RfqOption[] = [
  { value: "as_machined__ra_3_2__m___ra_126__in_", label: "As machined (Ra 3.2 µm / Ra 126 µin)" },
  { value: "smooth_machining__ra_1_6__m___ra_63__in_", label: "Smooth machining (Ra 1.6 µm / Ra 63 µin)" },
  { value: "fine_machining__ra_0_8__m___ra_32__in_", label: "Fine machining (Ra 0.8 µm / Ra 32 µin)" },
  { value: "bead_blasted", label: "Bead blasted" },
  { value: "powder_coated", label: "Powder coated" },
  { value: "electroless_nickel_plating", label: "Electroless Nickel Plating" },
  { value: "chromate_conversion_coating", label: "Chromate Conversion Coating" },
  { value: "as_machined___anodized_type_ii", label: "As machined + Anodized type II" },
  { value: "as_machined___anodized_type_iii__hardcoat_", label: "As machined + Anodized type III (Hardcoat)" },
];

export const qualityDocumentationOptions: RfqOption[] = [
  { value: "cmm", label: "Standard Inspection" },
  { value: "dimensional_inspection_report", label: "Dimensional Inspection Report" },
  { value: "coc", label: "Formal Inspection with Dimensional Report" },
  { value: "fai", label: "CMM Inspection with Dimensional Report" },
  { value: "fat", label: "First Article Inspection Report (FAIR AS9102)" },
  { value: "reach_compliance_declaration", label: "Source Inspection" },
  { value: "iso_90001", label: "Build and Hold First Article Inspection" },
  { value: "custom_inspection", label: "Custom Inspection" },
  { value: "material_test_report__mtr_", label: "Material Test Report (MTR)" },
];

export function optionLabel(options: RfqOption[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}
