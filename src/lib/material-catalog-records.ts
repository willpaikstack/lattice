import type { CustomerMaterialCondition, CustomerMaterialSubGroup } from "./customer-material-catalog";
import { getDirectoryMechanicalProperties, getMaterialMechanicalProperties } from "./material-grade-properties";

export type CatalogGradeRecord = {
  grade: string;
  name: string;
  groupName: string;
  conditions: CustomerMaterialCondition[];
};

export function catalogGradeName(grade: string) {
  return grade.replace(/ Aluminum$/i, "");
}

/** The published directory defines material membership and condition choices. */
export function catalogGradeRecords(groups: CustomerMaterialSubGroup[]): CatalogGradeRecord[] {
  return groups.flatMap((group) => group.grades.map((grade) => ({
    grade,
    name: catalogGradeName(grade),
    groupName: group.name,
    conditions: group.conditionsByGrade?.[grade] ?? [],
  })));
}

export function catalogReferenceProperties(familyName: string, grade: string, condition?: CustomerMaterialCondition) {
  const propertyGrade = condition?.grade ?? grade;
  return getDirectoryMechanicalProperties(familyName, propertyGrade)
    ?? getMaterialMechanicalProperties(catalogGradeName(propertyGrade));
}
